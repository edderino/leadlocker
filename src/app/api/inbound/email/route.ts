// src/app/api/inbound/email/route.ts
import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

type ResendEmailEvent = {
  type: string;
  created_at?: string;
  data?: {
    email_id?: string;
    from?: string;
    to?: string[]; // usually an array
    subject?: string;
    text?: string;   // ✅ sometimes present in the webhook
    html?: string;   // ✅ sometimes present in the webhook
    message_id?: string;
    attachments?: any[];
    cc?: string[];
    bcc?: string[];
  };
};

function extractAUPhone(str: string | null | undefined): string | null {
  if (!str) return null;
  // AU patterns: 04XXXXXXXX, +61 4XX XXX XXX, landlines, with punctuation/spaces
  const re =
    /(?:\+?61|0)\s*(?:[2-478])(?:\s*\d){8,9}|\+?61\s*4\s*(?:\d\s*){8}/g;
  const m = str.match(re);
  if (!m) return null;

  // Normalise first match to E.164 where possible
  let raw = m[0].replace(/[^\d+]/g, "");
  if (raw.startsWith("04")) raw = "+61" + raw.slice(1);
  if (raw.startsWith("0") && raw.length === 10) raw = "+61" + raw.slice(1);
  if (!raw.startsWith("+")) raw = "+" + raw; // last-ditch
  return raw;
}

function stripHtml(html: string): string {
  return html
    .replace(/<br\s*\/?>/gi, "\n")
    .replace(/<\/(p|div|li|tr|h[1-6])>/gi, "\n")
    .replace(/<style[\s\S]*?<\/style>/gi, "")
    .replace(/<script[\s\S]*?<\/script>/gi, "")
    .replace(/<[^>]+>/g, "")
    .replace(/\r/g, "")
    .trim();
}

export async function POST(req: NextRequest) {
  try {
    const payload = (await req.json()) as ResendEmailEvent;

    if (payload?.type !== "email.received" || !payload?.data) {
      return NextResponse.json({ ok: true });
    }

    const d = payload.data;
    const emailId = d.email_id || d.message_id || "";
    const from = d.from || "";
    const to = Array.isArray(d.to) ? d.to[0] : d.to || "";
    const subject = d.subject || "";

    console.log("Inbound email received:", { from, to, subject, emailId });

    // ---------- 1) Get body text: payload first, then Resend fetch ----------
    let textBody = d.text || "";
    let htmlBody = d.html || "";

    if (!textBody && !htmlBody && emailId) {
      try {
        const r = await fetch(`https://api.resend.com/emails/${emailId}`, {
          headers: { Authorization: `Bearer ${process.env.RESEND_API_KEY}` },
          // Some accounts require this header to allow content
        });
        const ok = r.ok;
        let text: string | null = null;
        let html: string | null = null;
        if (ok) {
          const j = await r.json();
          text = j?.text ?? null;
          html = j?.html ?? null;
        }
        console.log("Resend fetch:", {
          status: r.status,
          hasText: !!text,
          hasHtml: !!html,
        });
        textBody = textBody || text || "";
        htmlBody = htmlBody || html || "";
      } catch (e) {
        console.log("Resend fetch failed (ignored):", (e as Error).message);
      }
    }

    const rawText = textBody || stripHtml(htmlBody) || "";
    const emailForParse =
      [
        subject,
        rawText,
        // include headers in case phone is there
        `From: ${from}`,
        `To: ${to}`,
      ]
        .filter(Boolean)
        .join("\n")
        .trim() || "";

    // ---------- 2) Parse ----------
    // name/email fallbacks
    const fallbackName =
      from.split("<")[0]?.trim().replace(/["']/g, "") ||
      from ||
      "Unknown";

    const emailMatch =
      emailForParse.match(/[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/i)?.[0] || null;

    const phone =
      // explicit label first
      (emailForParse.match(/(?:phone|mobile|contact)\s*[:\-]\s*([^\n]+)/i)?.[1] ??
        extractAUPhone(emailForParse)) || null;

    const lead = {
      name: fallbackName,
      email: emailMatch,
      phone,
      description: rawText || subject || "",
      raw: rawText,
      external_id: emailId || null,
      source: "email" as const,
    };

    console.log("Parsed lead:", lead);

    // ---------- 3) Idempotency guard (avoid dup inserts/SMS) ----------
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );
    const orgId = "demo-org";

    if (lead.external_id) {
      const { data: existing, error: selErr } = await supabase
        .from("leads")
        .select("id")
        .eq("source", "email")
        .eq("external_id", lead.external_id)
        .limit(1);

      if (selErr) console.error("Select error (ignored):", selErr);
      if (existing && existing.length > 0) {
        console.log("Duplicate email_id; skipping insert/SMS");
        return NextResponse.json({ ok: true, deduped: true });
      }
    }

    // ---------- 4) Insert ----------
    const { error: insErr } = await supabase.from("leads").insert({
      org_id: orgId,
      status: "NEW",
      source: "email",
      external_id: lead.external_id,
      name: lead.name,
      email: lead.email ?? from ?? "unknown@example.com",
      phone: lead.phone,
      description: lead.description,
      raw: lead.raw,
    });

    if (insErr) {
      console.error("Lead insert failed:", insErr);
      return NextResponse.json({ error: "DB insert failed" }, { status: 500 });
    }
    console.log("Lead inserted successfully");

    // ---------- 5) SMS (with clean fallback) ----------
    try {
      const smsBody = `New Lead from Email
Name: ${lead.name}
Phone: ${lead.phone ?? "N/A"}
Source: Email`;

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
            From: process.env.TWILIO_FROM_NUMBER!, // ✅ use the right env
            Body: smsBody,
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
