import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import twilio from "twilio";

/**
 * Inbound Email → Lead
 * - Parses Mailgun form-data
 * - Extracts name, phone, subject
 * - Stores ONLY the lead (clean)
 * - Sends SMS alert (no body included)
 */
export async function POST(req: Request) {
  console.log("📩 [INBOUND] Mailgun hit endpoint");

  // Mailgun sends all incoming email as form-data
  const form = await req.formData();
  const payload: Record<string, any> = {};
  for (const [key, value] of form.entries()) payload[key] = value;

  console.log("📩 [INBOUND] Parsed payload:", payload);

  const from_email =
    payload.sender || payload.From || payload.from || "unknown@unknown.com";

  const subjectRaw = payload.subject || "";
  const subject =
    subjectRaw.length > 100 ? subjectRaw.slice(0, 100) + "..." : subjectRaw;

  const stripped = payload["stripped-text"] || payload["body-plain"] || "";

  // Try extracting name + phone
  const nameMatch = from_email.match(/^(.*)</);
  const name = nameMatch ? nameMatch[1].trim() : "Unknown";

  const phoneMatch = stripped.match(/(\+?\d[\d\s-]{7,15})/);
  const phone = phoneMatch ? phoneMatch[1].replace(/\s+/g, "") : "N/A";

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  // Get owner of this inbound domain
  const { data: domain } = await supabase
    .from("inbound_domains")
    .select("user_id")
    .eq("domain", payload.recipient?.split("@")[1])
    .single();

  if (!domain) {
    console.error("❌ No domain owner found");
    return NextResponse.json({ ok: false, error: "Domain not registered" }, { status: 404 });
  }

  const userId = domain.user_id;

  // Insert clean lead (not raw payload)
  const { error: dbError } = await supabase
    .from("leads")
    .insert({
      user_id: userId,
      source: "email",
      subject,
      from_email,
      name,
      phone,
    });

  if (dbError) {
    console.error("❌ DB Error", dbError);
    return NextResponse.json({ ok: false, error: dbError.message }, { status: 500 });
  }

  // -------------------------------------------------
  // SEND SMS (NO BODY INCLUDED)
  // -------------------------------------------------
  try {
    const clientTwilio = twilio(
      process.env.TWILIO_ACCOUNT_SID!,
      process.env.TWILIO_AUTH_TOKEN!
    );

    const smsBody =
      `📩 New Lead via Email\n\n` +
      `👤 Name: ${name}\n` +
      `📞 Phone: ${phone}\n` +
      `📝 Subject: ${subject}`;

    // Get client SMS number
    const { data: userRecord } = await supabase
      .from("users")
      .select("sms_phone")
      .eq("id", userId)
      .single();

    await clientTwilio.messages.create({
      body: smsBody,
      from: process.env.TWILIO_FROM_NUMBER!,
      to: userRecord?.sms_phone || process.env.LL_DEFAULT_USER_PHONE!,
    });

    console.log("📲 SMS sent!");
  } catch (err: any) {
    console.error("🚨 SMS Error:", err);
  }

  return NextResponse.json({ ok: true });
}
