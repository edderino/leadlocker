import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import twilio from "twilio";

/**
 * LeadLocker – Mailgun Inbound Email Handler
 * - Parses Mailgun form-data
 * - Finds correct client via public.clients.inbound_email
 * - Stores clean lead
 * - Sends SMS alert (NO BODY INCLUDED)
 */
export async function POST(req: Request) {
  console.log("📩 [INBOUND] Mailgun hit endpoint");

  // -----------------------------
  // Parse Mailgun FormData
  // -----------------------------
  const form = await req.formData();
  const payload: Record<string, any> = {};
  for (const [key, value] of form.entries()) payload[key] = value;

  console.log("📩 [INBOUND] Parsed payload:", payload);

  // Extract basics
  const from_email =
    payload.sender || payload.From || payload.from || "unknown@unknown.com";

  const to_email = payload.recipient || payload.Recipient || payload.to || "";

  // -----------------------------
  // Trim subject to 100 chars
  // -----------------------------
  const subjectRaw = payload.subject || "";
  const subject =
    subjectRaw.length > 100 ? subjectRaw.slice(0, 100) + "..." : subjectRaw;

  const stripped = payload["stripped-text"] || payload["body-plain"] || "";

  // Extract name safely
  const nameMatch = from_email.match(/^(.*)</);
  const name = nameMatch ? nameMatch[1].trim() : "Unknown";

  // Extract phone number from stripped body
  const phoneMatch = stripped.match(/(\+?\d[\d\s-]{7,15})/);
  const phone = phoneMatch ? phoneMatch[1].replace(/\s+/g, "") : "N/A";

  // -----------------------------
  // Init Supabase
  // -----------------------------
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  // -----------------------------
  // Identify the correct client
  // -----------------------------
  const { data: client, error: clientErr } = await supabase
    .from("clients")
    .select("*")
    .eq("inbound_email", to_email)
    .single();

  if (clientErr || !client) {
    console.error("❌ No matching client for inbound email:", to_email);
    return NextResponse.json(
      { ok: false, error: "Client not found for inbound email" },
      { status: 404 }
    );
  }

  console.log("🏷 Matched client:", client.id);

  // -----------------------------
  // Store clean lead
  // -----------------------------
  const { error: dbError } = await supabase.from("leads").insert({
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

  // -----------------------------
  // SEND SMS (NO BODY INCLUDED)
  // -----------------------------
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

    await clientTwilio.messages.create({
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
