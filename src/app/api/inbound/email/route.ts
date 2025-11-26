import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import twilio from "twilio";

/**
 * LeadLocker – Mailgun Inbound Email Handler
 * Handles forwarded Gmail → Mailgun → Lead creation + SMS alert.
 */
export async function POST(req: Request) {
  console.log("📩 [INBOUND] Mailgun hit endpoint");

  // Parse Mailgun FormData
  const form = await req.formData();
  const payload: Record<string, any> = {};
  for (const [key, value] of form.entries()) {
    payload[key] = value;
  }

  console.log("📩 [INBOUND] Parsed payload:", payload);

  // Extract basics
  const from_email =
    payload.sender ||
    payload.From ||
    payload.from ||
    "unknown@unknown.com";

  const to_email =
    payload.recipient ||
    payload.Recipient ||
    payload.to ||
    "";

  // Trim subject
  const rawSubject = payload.subject || "";
  const subject =
    rawSubject.length > 100 ? rawSubject.slice(0, 100) + "..." : rawSubject;

  const stripped =
    payload["stripped-text"] ||
    payload["body-plain"] ||
    "";

  // -----------------------------------
  // NAME EXTRACTION (FINAL LOGIC)
  // -----------------------------------
  let name = "Unknown";

  // Case 1: "Display Name <email>"
  const match = from_email.match(/^(.*)<(.+)>$/);
  if (match) {
    const extracted = match[1].trim();
    name = extracted.length > 0 ? extracted : match[2];
  } else {
    // Case 2: plain email → use entire email as name
    name = from_email.trim();
  }

  // Extract phone from message
  const phoneMatch = stripped.match(/(\+?\d[\d\s-]{7,15})/);
  const phone = phoneMatch
    ? phoneMatch[1].replace(/\s+/g, "")
    : "N/A";

  // Supabase
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  // Find matching client
  const { data: client, error: clientErr } = await supabase
    .from("clients")
    .select("*")
    .eq("inbound_email", to_email)
    .single();

  if (clientErr || !client) {
    console.error("❌ No matching client for email:", to_email);
    return NextResponse.json(
      { ok: false, error: "Client not found" },
      { status: 404 }
    );
  }

  console.log("🏷 Matched client:", client.id);

  // Insert lead
  const { error: dbError } = await supabase
    .from("leads")
    .insert({
      user_id: client.user_id,
      client_id: client.id,
      source: "email",
      subject,
      from_email,
      name,
      phone,
    });

  if (dbError) {
    console.error("❌ DB Error", dbError);
    return NextResponse.json(
      { ok: false, error: dbError.message },
      { status: 500 }
    );
  }

  // SMS body
  const smsBody =
    `📩 New Lead via Email\n\n` +
    `👤 Name: ${name}\n` +
    `📞 Phone: ${phone}\n` +
    `📝 Subject: ${subject}`;

  // Send SMS
  try {
    const twilioClient = twilio(
      process.env.TWILIO_ACCOUNT_SID!,
      process.env.TWILIO_AUTH_TOKEN!
    );

    await twilioClient.messages.create({
      body: smsBody,
      from: client.twilio_from || process.env.TWILIO_FROM_NUMBER!,
      to: client.twilio_to || process.env.LL_DEFAULT_USER_PHONE!,
    });

    console.log("📲 SMS sent to:", client.twilio_to);
  } catch (err: any) {
    console.error("🚨 SMS Error:", err);
  }

  return NextResponse.json({ ok: true });
}
