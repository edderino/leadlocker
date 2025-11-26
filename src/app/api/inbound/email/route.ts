import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import twilio from "twilio";

/**
 * LeadLocker – Mailgun Inbound Handler
 * - DEDUPES via Message-Id
 * - Uses real "From:" header (not Gmail forwarding alias)
 * - Stores clean lead
 * - Sends SMS once only
 */
export async function POST(req: Request) {
  console.log("📩 [INBOUND] Mailgun hit endpoint");

  // Parse Mailgun FormData
  const form = await req.formData();
  const payload: Record<string, any> = {};
  for (const [key, value] of form.entries()) payload[key] = value;

  console.log("📩 [INBOUND] Parsed payload:", payload);

  // -----------------------------
  // Extract Message-ID (dedupe key)
  // -----------------------------
  let message_id =
    payload["Message-Id"] ||
    payload["message-id"] ||
    null;

  // Try extracting from message-headers
  if (!message_id && payload["message-headers"]) {
    try {
      const headers = JSON.parse(payload["message-headers"]);
      const msg = headers.find((h: any) => h[0].toLowerCase() === "message-id");
      if (msg) message_id = msg[1];
    } catch (_) {}
  }

  if (!message_id) {
    console.warn("⚠️ No Message-Id found, generating fallback ID");
    message_id = crypto.randomUUID();
  }

  // -----------------------------
  // Init Supabase
  // -----------------------------
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  // -----------------------------
  // DEDUPE CHECK
  // -----------------------------
  const { data: existing } = await supabase
    .from("leads")
    .select("id")
    .eq("message_id", message_id)
    .maybeSingle();

  if (existing) {
    console.log("🛑 Duplicate webhook detected — skipping lead + SMS");
    return NextResponse.json({ ok: true, deduped: true });
  }

  // -----------------------------
  // Extract TO address (which client?)
  // -----------------------------
  const to_email =
    payload.recipient ||
    payload.Recipient ||
    payload.to ||
    "";

  const { data: client, error: clientErr } = await supabase
    .from("clients")
    .select("*")
    .eq("inbound_email", to_email)
    .single();

  if (clientErr || !client) {
    console.error("❌ No matching client for email:", to_email);
    return NextResponse.json({ ok: false, error: "Client not found" }, { status: 404 });
  }

  console.log("🏷 Matched client:", client.id);

  // -----------------------------
  // Extract REAL From email (ignore Gmail forwarding alias)
  // -----------------------------
  const from_header =
    payload.From ||
    payload.from ||
    null;

  let from_email = "unknown@unknown.com";
  let name = "Unknown";

  if (from_header) {
    const match = from_header.match(/^(.*)<(.*)>$/);
    if (match) {
      name = match[1].trim() || match[2];
      from_email = match[2].trim();
    } else {
      from_email = from_header.trim();
      name = from_header.trim();
    }
  }

  // -----------------------------
  // Subject + Body
  // -----------------------------
  const rawSubject = payload.subject || "";
  const subject =
    rawSubject.length > 100 ? rawSubject.slice(0, 100) + "..." : rawSubject;

  const stripped =
    payload["stripped-text"] ||
    payload["body-plain"] ||
    "";

  // Extract phone
  const phoneMatch = stripped.match(/(\+?\d[\d\s-]{7,15})/);
  const phone = phoneMatch ? phoneMatch[1].replace(/\s+/g, "") : "N/A";

  // -----------------------------
  // INSERT LEAD (WITH message_id)
  // -----------------------------
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
      message_id,
      status: "NEW",
    });

  if (dbError) {
    console.error("❌ DB Error", dbError);
    return NextResponse.json({ ok: false, error: dbError.message }, { status: 500 });
  }

  // -----------------------------
  // SEND SMS ONCE
  // -----------------------------
  try {
    const twilioClient = twilio(
      process.env.TWILIO_ACCOUNT_SID!,
      process.env.TWILIO_AUTH_TOKEN!
    );

    const smsBody =
      `📩 New Lead via Email\n\n` +
      `👤 Name: ${name}\n` +
      `📞 Phone: ${phone}\n` +
      `📝 Subject: ${subject}`;

    await twilioClient.messages.create({
      body: smsBody,
      from: client.twilio_from || process.env.TWILIO_FROM_NUMBER!,
      to: client.twilio_to || process.env.LL_DEFAULT_USER_PHONE!,
    });

    console.log("📲 SMS sent!");
  } catch (err: any) {
    console.error("🚨 SMS Error:", err);
  }

  return NextResponse.json({ ok: true });
}
