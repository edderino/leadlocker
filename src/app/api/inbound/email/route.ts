import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import twilio from "twilio";

/**
 * LeadLocker – Mailgun Inbound Handler
 * With HARD-BLOCK filtering for:
 * - no-reply/auto senders
 * - verification emails
 * - bounce notifications
 * - social alerts
 * - newsletters
 * - empty subject/body
 */

export async function POST(req: Request) {
  console.log("📩 [INBOUND] Mailgun hit endpoint");

  // Parse Mailgun FormData
  const form = await req.formData();
  const payload: Record<string, any> = {};
  for (const [key, value] of form.entries()) payload[key] = value;

  console.log("📩 [INBOUND] Parsed payload:", payload);

  const rawSubject = (payload.subject || "").toLowerCase();
  const fromHeader =
    payload.From ||
    payload.from ||
    "";
  const stripped =
    payload["stripped-text"] ||
    payload["body-plain"] ||
    "";

  // ======================================================
  // HARD-BLOCK FILTERS
  // ======================================================

  // A) Auto-reply / no-reply senders
  const fromLower = fromHeader.toLowerCase();
  const AUTO_BLOCK = [
    "no-reply",
    "noreply",
    "donotreply",
    "auto",
    "automated",
    "mailer-daemon",
  ];
  if (AUTO_BLOCK.some((w) => fromLower.includes(w))) {
    console.log("🛑 BLOCKED: Auto/no-reply sender");
    return NextResponse.json({ ok: true, blocked: "auto-sender" });
  }

  // B) Gmail/Outlook verification / security codes
  const VERIFICATION_WORDS = [
    "verification",
    "verify",
    "confirm",
    "confirmation",
    "code",
    "otp",
    "security",
  ];
  const VERIFICATION_DOMAINS = [
    "google.com",
    "outlook.com",
    "microsoft.com",
  ];
  if (
    VERIFICATION_WORDS.some((w) => rawSubject.includes(w)) ||
    VERIFICATION_DOMAINS.some((d) => fromLower.includes(d))
  ) {
    console.log("🛑 BLOCKED: Verification/security email");
    return NextResponse.json({ ok: true, blocked: "verification" });
  }

  // C) Bounce notifications
  const BOUNCE_WORDS = [
    "delivery status notification",
    "undelivered",
    "failed",
    "address not found",
    "returned mail",
  ];
  if (BOUNCE_WORDS.some((w) => rawSubject.includes(w))) {
    console.log("🛑 BLOCKED: Bounce notification");
    return NextResponse.json({ ok: true, blocked: "bounce" });
  }

  // D) Social/media platform NON-lead alerts
  const SOCIAL_WORDS = [
    "facebook",
    "instagram",
    "meta",
    "security alert",
    "new login",
    "new follower",
    "page activity",
    "your ad has been approved",
  ];
  if (SOCIAL_WORDS.some((w) => rawSubject.includes(w))) {
    console.log("🛑 BLOCKED: Social/media alert");
    return NextResponse.json({ ok: true, blocked: "social-alert" });
  }

  // E) Empty subject + empty body
  if (rawSubject.trim() === "" && stripped.trim() === "") {
    console.log("🛑 BLOCKED: Empty subject/body");
    return NextResponse.json({ ok: true, blocked: "empty" });
  }

  // F) Newsletter / bulk messages
  const newsletterBody = stripped.toLowerCase();
  const NEWSLETTER_WORDS = [
    "unsubscribe",
    "view in browser",
  ];
  if (
    NEWSLETTER_WORDS.some((w) => newsletterBody.includes(w)) ||
    payload["List-Unsubscribe"]
  ) {
    console.log("🛑 BLOCKED: Newsletter/bulk email");
    return NextResponse.json({ ok: true, blocked: "newsletter" });
  }

  // ======================================================
  // CONTINUE — Email is a legit lead
  // ======================================================

  // Deduce Message-ID
  let message_id =
    payload["Message-Id"] ||
    payload["message-id"] ||
    null;

  if (!message_id && payload["message-headers"]) {
    try {
      const headers = JSON.parse(payload["message-headers"]);
      const msg = headers.find((h: any) => h[0].toLowerCase() === "message-id");
      if (msg) message_id = msg[1];
    } catch (_) {}
  }

  if (!message_id) {
    console.warn("⚠️ No Message-Id found, generating fallback");
    message_id = crypto.randomUUID();
  }

  // Init Supabase
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  // Dedupe
  const { data: existing } = await supabase
    .from("leads")
    .select("id")
    .eq("message_id", message_id)
    .maybeSingle();

  if (existing) {
    console.log("🛑 Duplicate webhook detected — skipping lead + SMS");
    return NextResponse.json({ ok: true, deduped: true });
  }

  // Match client
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
    return NextResponse.json(
      { ok: false, error: "Client not found" },
      { status: 404 }
    );
  }

  console.log("🏷 Matched client:", client.id);

  // Parse real sender
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

  const subject =
    rawSubject.length > 100 ? rawSubject.slice(0, 100) + "..." : rawSubject;

  // Extract phone
  const phoneMatch = stripped.match(/(\+?\d[\d\s-]{7,15})/);
  const phone = phoneMatch ? phoneMatch[1].replace(/\s+/g, "") : "N/A";

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
      message_id,
      status: "NEW",
    });

  if (dbError) {
    console.error("❌ DB Error", dbError);
    return NextResponse.json(
      { ok: false, error: dbError.message },
      { status: 500 }
    );
  }

  // Send SMS
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
