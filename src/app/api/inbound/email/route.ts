import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

function extractPhone(src: string | null | undefined) {
  if (!src) return null;
  // AU-focused but general enough: +61, 04xx xxx xxx, (02) 9xxx xxxx, etc.
  const re =
    /(\+?\s?61\s?[\d\s]{8,12}|0?\s?4\d[\s-]?\d{3}[\s-]?\d{3}|0[2378]\s?\d{4}\s?\d{4}|\+?\d[\d\s\-()]{7,16})/;
  const m = src.match(re);
  return m ? m[0].replace(/\s+/g, "").replace(/^(\+?61)0/, "$1") : null;
}

export async function POST(req: NextRequest) {
  try {
    const payload = await req.json();

    if (payload?.type !== "email.received") {
      return NextResponse.json({ ok: true });
    }

    const received = payload.data ?? {};
    const from: string | null = received.from ?? null;
    const to: string | null = Array.isArray(received.to) ? received.to[0] : received.to ?? null;
    const subject: string | null = received.subject ?? null;
    const emailId: string | null = received.email_id ?? null;

    console.log("FULL RAW PAYLOAD:", JSON.stringify(payload, null, 2));

    // --- Try to fetch full body from Resend ---------------------------------
    let textBody = received.text ?? "";   // webhook fallback if present
    let htmlBody = received.html ?? "";

    async function fetchResend(path: string) {
      const r = await fetch(`https://api.resend.com${path}`, {
        headers: { Authorization: `Bearer ${process.env.RESEND_API_KEY}` },
        // no need for content-type on GET
        cache: "no-store",
      });
      let data: any = null;
      try { data = await r.json(); } catch {}
      return { ok: r.ok, status: r.status, data };
    }

    if (emailId && (!textBody && !htmlBody)) {
      // First try /emails/{id}
      const a = await fetchResend(`/emails/${emailId}`);
      // If not found or missing content, try inbound endpoint variant
      const b = !a.ok || (!a.data?.text && !a.data?.html)
        ? await fetchResend(`/inbound_emails/${emailId}`)
        : null;

      const picked = (b && b.ok ? b : a);
      const hasText = !!picked?.data?.text;
      const hasHtml = !!picked?.data?.html;

      console.log("Resend fetch:", {
        status: picked?.status ?? a.status,
        hasText,
        hasHtml,
      });

      if (hasText) textBody = picked!.data.text;
      if (hasHtml) htmlBody = picked!.data.html;
    }

    // Compose the best available plain text for parsing
    const compositeText =
      (textBody && typeof textBody === "string" ? textBody : "") ||
      (htmlBody && typeof htmlBody === "string"
        ? htmlBody
            .replace(/<br\s*\/?>/gi, "\n")
            .replace(/<\/(p|div|li|tr|h\d)>/gi, "\n")
            .replace(/<[^>]+>/g, "")
        : "");

    // --- Parse lead fields ---------------------------------------------------
    const { parseLeadFromEmail } = await import("@/libs/parseEmail");
    const parsed = parseLeadFromEmail(compositeText || "");

    // Extra fallback for phone: scan subject + from + composite text
    let phone =
      parsed.phone ||
      extractPhone(`${subject ?? ""}\n${from ?? ""}\n${compositeText}`) ||
      null;

    const fallbackName =
      (from?.split("<")[0]?.trim().replace(/["']/g, "") || "Unknown").trim();

    const lead = {
      name: parsed.name || fallbackName,
      email: parsed.email || from || null,
      phone,
      description: parsed.message || compositeText.slice(0, 2000) || "",
      raw: compositeText || "",
    };

    console.log("Parsed lead:", lead);

    // --- Insert into Supabase -----------------------------------------------
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    const { error } = await supabase.from("leads").insert({
      org_id: "demo-org",
      email: lead.email || "unknown@example.com",
      name: lead.name,
      phone: lead.phone,
      description: lead.description,
      status: "NEW",
      source: "Email",
    });

    if (error) {
      console.error("Lead insert failed:", error);
      return NextResponse.json({ error: "DB insert failed" }, { status: 500 });
    }

    console.log("Lead inserted successfully");

    // --- SMS alert via Twilio -----------------------------------------------
    try {
      const smsRes = await fetch(
        `https://api.twilio.com/2010-04-01/Accounts/${process.env.TWILIO_ACCOUNT_SID}/Messages.json`,
        {
          method: "POST",
          headers: {
            Authorization:
              "Basic " +
              Buffer.from(
                `${process.env.TWILIO_ACCOUNT_SID}:${process.env.TWILIO_AUTH_TOKEN}`
              ).toString("base64"),
            "Content-Type": "application/x-www-form-urlencoded",
          },
          body: new URLSearchParams({
            To: process.env.LL_DEFAULT_USER_PHONE!,
            From: process.env.TWILIO_FROM_NUMBER || process.env.TWILIO_PHONE_NUMBER || "",
            Body: `New Lead from Email
Name: ${lead.name}
Phone: ${lead.phone || "N/A"}
Source: Email`,
          }),
        }
      );
      console.log("SMS sent:", await smsRes.json());
    } catch (smsErr) {
      console.error("Failed to send SMS:", smsErr);
    }

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("Inbound email error:", err);
    return NextResponse.json({ error: true }, { status: 500 });
  }
}
