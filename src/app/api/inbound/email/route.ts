import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

function stripHtml(s: string) {
  return s
    .replace(/<br\s*\/?>/gi, "\n")
    .replace(/<\/(p|div|li|tr|table)>/gi, "\n")
    .replace(/<[^>]+>/g, "")
    .replace(/\r/g, "")
    .trim();
}

export async function POST(req: NextRequest) {
  try {
    const payload = await req.json();

    // Only handle inbound emails
    if (payload?.type !== "email.received") {
      return NextResponse.json({ ok: true });
    }

    const data = payload.data ?? {};
    const emailId: string | undefined = data.email_id;
    const from: string = data.from ?? "";
    const to: string | undefined = Array.isArray(data.to) ? data.to[0] : data.to;
    const subject: string | undefined = data.subject;

    console.log("FULL RAW PAYLOAD:", JSON.stringify(payload, null, 2));

    // --- Try to fetch the full message from Resend API ---
    let apiText = "";
    let apiHtml = "";
    let apiStatus = 0;

    if (emailId) {
      const emailRes = await fetch(`https://api.resend.com/emails/${emailId}`, {
        headers: { Authorization: `Bearer ${process.env.RESEND_API_KEY}` },
      });
      apiStatus = emailRes.status;

      let apiJson: any = {};
      try {
        apiJson = await emailRes.json();
      } catch (e) {
        console.error("Resend API: failed to parse JSON");
      }

      apiText = apiJson?.text || "";
      apiHtml = apiJson?.html || "";

      console.log("Resend fetch:", {
        status: apiStatus,
        hasText: Boolean(apiText?.length),
        hasHtml: Boolean(apiHtml?.length),
      });
    }

    // --- Fallbacks: use payload’s inline body if API didn’t return content ---
    const inlineText: string = data.text ?? "";
    const inlineHtml: string = data.html ?? "";

    const bodyText =
      apiText ||
      stripHtml(apiHtml || "") ||
      inlineText ||
      stripHtml(inlineHtml || "");

    // --- Parse lead fields ---
    const { parseLeadFromEmail } = await import("@/libs/parseEmail");

    const parsed = parseLeadFromEmail(bodyText || "");

    // Fallbacks for name/email if parser missed them
    const fallbackName =
      from.split("<")[0]?.trim().replace(/["']/g, "") || "Unknown";

    const fallbackEmail =
      (from.match(/[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/i) || [null])[0];

    const lead = {
      name: parsed.name || fallbackName,
      email: parsed.email || fallbackEmail || null,
      phone: parsed.phone || null,
      description: parsed.message || "",
      raw: bodyText || "",
    };

    console.log("Parsed lead:", lead);

    // --- Insert into DB ---
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    const orgId = "demo-org";
    const { error } = await supabase.from("leads").insert({
      org_id: orgId,
      email: lead.email || from || "unknown@example.com",
      name: lead.name,
      phone: lead.phone,
      description: lead.description,
      status: "NEW",
      source: "email",
    });

    if (error) {
      console.error("Lead insert failed:", error);
      return NextResponse.json({ error: "DB insert failed" }, { status: 500 });
    }

    console.log("Lead inserted successfully");

    // --- SMS alert (use the correct FROM env name) ---
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
            From: process.env.TWILIO_FROM_NUMBER!, // ← ensure this env exists
            Body: `New Lead from Email
Name: ${lead.name}
Phone: ${lead.phone || "N/A"}
Source: Email`,
          }),
        }
      );

      const smsJson = await smsRes.json();
      console.log("SMS sent:", smsJson);
    } catch (smsErr) {
      console.error("Failed to send SMS:", smsErr);
    }

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("Inbound email error:", err);
    return NextResponse.json({ error: true }, { status: 500 });
  }
}
