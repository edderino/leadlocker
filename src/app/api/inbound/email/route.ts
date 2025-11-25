import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import twilio from "twilio";

export async function POST(req: Request) {
  console.log("📩 [INBOUND] Mailgun hit endpoint");

  const form = await req.formData();
  const payload: Record<string, any> = {};
  for (const [key, value] of form.entries()) {
    payload[key] = value;
  }

  console.log("📩 [INBOUND] Parsed payload:", payload);

  const from_email = payload.sender || payload.From || payload.from || "";
  const to_email = payload.recipient || payload.Recipient || payload.to || "";
  const subject = payload.subject || "";
  const body_plain = payload["body-plain"] || payload["stripped-text"] || "";
  const external_id = payload["Message-Id"] || "";
  const source = "email";

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  const { error: dbError } = await supabase.from("inbound_emails").insert({
    source,
    external_id,
    subject,
    from_email,
    to_email,
    payload,
  });

  if (dbError) {
    console.error("❌ DB Error", dbError);
    return NextResponse.json({ ok: false, error: dbError.message }, { status: 500 });
  }

  // -------------------------
  // 📲 SEND TEXT NOTIFICATION
  // -------------------------
  try {
    const client = twilio(
      process.env.TWILIO_ACCOUNT_SID!,
      process.env.TWILIO_AUTH_TOKEN!
    );

    await client.messages.create({
      body: `📩 New Lead Received\nFrom: ${from_email}\nSubject: ${subject}\n\n${body_plain}`,
      from: process.env.TWILIO_FROM_NUMBER!,
      to: process.env.NOTIFY_PHONE!,
    });

    console.log("📲 SMS sent!");
  } catch (err: any) {
    console.error("🚨 SMS Error:", err);
  }

  return NextResponse.json({ ok: true });
}
