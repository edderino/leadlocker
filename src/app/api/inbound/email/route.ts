import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export async function POST(req: NextRequest) {
  try {
    const payload = await req.json();

    if (payload.type !== "email.received") {
      return NextResponse.json({ ok: true });
    }

    const received = payload.data;

    const from = received.from;
    const to = received.to?.[0];
    const subject = received.subject;
    const emailId = received.email_id;

    console.log("Inbound email received:", {
      from,
      to,
      subject,
      emailId,
    });

    // Fetch full email body from Resend
    const emailRes = await fetch(`https://api.resend.com/emails/${emailId}`, {
      headers: {
        Authorization: `Bearer ${process.env.RESEND_API_KEY}`,
      },
    });

    const fullEmail = await emailRes.json();

    const textBody = fullEmail?.text ?? "";
    const htmlBody = fullEmail?.html ?? "";

    // Parse lead fields
    const { parseLeadFromEmail } = await import("@/_lib/parseEmail");
    const parsed = parseLeadFromEmail(textBody || htmlBody || "");

    const fallbackName =
      received.from?.split("<")[0]?.trim().replace(/["']/g, "") || "Unknown";

    const lead = {
      name: parsed.name || fallbackName,
      email: parsed.email || null,
      phone: parsed.phone || null,
      description: parsed.message || "",
      raw: textBody || htmlBody || "",
    };

    console.log("Parsed lead:", lead);

    // Insert lead in Supabase
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    const { data: client, error: clientErr } = await supabase
      .from("clients")
      .select("id")
      .limit(1)
      .single();

    if (clientErr || !client) {
      console.error("Client lookup failed:", clientErr);
      return NextResponse.json({ error: "No client found" }, { status: 500 });
    }

    const { data, error } = await supabase.from("leads").insert({
      client_id: client.id,
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

    // Send SMS via Twilio
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
            To: process.env.CLIENT_PHONE!,
            From: process.env.TWILIO_PHONE_NUMBER!,
            Body: `New lead: ${lead.name}\nPhone: ${lead.phone}\nSource: Email`,
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
