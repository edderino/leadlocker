import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import twilio from "twilio";
import crypto from "crypto";

/**
 * LeadLocker – Mailgun Inbound Handler (Billionaire CTO version)
 *
 * - Parses Mailgun form-data safely
 * - Canonicalizes subject + body (handles HTML-only, <br>, Gmail wrappers, etc.)
 * - Early dedupe via Mailgun timestamp/token/signature with race-safe insert
 * - Hard filters:
 *    - Auto/no-reply / system senders
 *    - Verification / security / code emails
 *    - Bounce / delivery failure
 *    - Social / ad platform alerts
 *    - Newsletters / bulk mail
 *    - Contentless rubbish (subject "no"/"test"/"hi" with empty body)
 * - Client match via inbound_email
 * - Lead upsert via message_id (prevents dup leads)
 * - SMS only on first insert
 */

type MailgunPayload = Record<string, any>;

/** Turn Mailgun formData into a plain object */
async function parseMailgunPayload(req: Request): Promise<MailgunPayload> {
  const form = await req.formData();
  const payload: MailgunPayload = {};
  for (const [key, value] of form.entries()) {
    payload[key] = typeof value === "string" ? value : String(value);
  }
  return payload;
}

/** Parse Mailgun "message-headers" JSON into a lowercase-key map */
function parseHeaderMap(raw: any): Record<string, string> {
  if (!raw || typeof raw !== "string") return {};
  try {
    const arr = JSON.parse(raw) as [string, string][];
    const map: Record<string, string> = {};
    for (const [k, v] of arr) {
      map[k.toLowerCase()] = String(v);
    }
    return map;
  } catch {
    return {};
  }
}

/** Very defensive HTML → text stripper */
function stripHtmlAdvanced(html: string): string {
  if (!html) return "";

  let s = html;

  // Drop head/style/script
  s = s.replace(/<head[\s\S]*?<\/head>/gi, " ");
  s = s.replace(/<style[\s\S]*?<\/style>/gi, " ");
  s = s.replace(/<script[\s\S]*?<\/script>/gi, " ");

  // Drop quoted replies
  s = s.replace(/<blockquote[\s\S]*?<\/blockquote>/gi, " ");

  // Replace structural tags with spaces
  s = s.replace(/<(br|\/p|\/div|\/tr|\/li)[^>]*>/gi, " ");

  // Remove all remaining tags
  s = s.replace(/<[^>]+>/g, " ");

  // Decode a few common entities
  s = s
    .replace(/&nbsp;/gi, " ")
    .replace(/&amp;/gi, "&")
    .replace(/&lt;/gi, "<")
    .replace(/&gt;/gi, ">")
    .replace(/&quot;/gi, '"')
    .replace(/&#39;/gi, "'");

  // Normalize whitespace
  s = s.replace(/\s+/g, " ").trim();

  return s;
}

/** Canonical subject: raw + normalized lowercase */
function getCanonicalSubject(payload: MailgunPayload) {
  const raw =
    (payload.subject ||
      payload.Subject ||
      "").toString();

  const normalized = raw.trim().toLowerCase();
  return { raw, normalized };
}

/** Canonical body: html/text/raw+normalized */
function getCanonicalBody(payload: MailgunPayload) {
  const strippedText = (payload["stripped-text"] || "") as string;
  const bodyPlain = (payload["body-plain"] || "") as string;
  const strippedHtml = (payload["stripped-html"] || "") as string;
  const bodyHtml = (payload["body-html"] || "") as string;

  // Prefer Mailgun's already-clean text where available
  let primaryText = strippedText || bodyPlain;

  if (!primaryText) {
    const htmlSource = strippedHtml || bodyHtml;
    if (htmlSource) primaryText = stripHtmlAdvanced(htmlSource);
  }

  const raw = (primaryText || "").trim();
  const normalized = raw.toLowerCase();

  return { raw, normalized };
}

/** Get "from" as raw header + normalized lowercased string */
function getFromHeader(payload: MailgunPayload) {
  const fromHeader =
    (payload.From ||
      payload.from ||
      "") as string;

  return {
    raw: fromHeader,
    lower: fromHeader.toLowerCase(),
  };
}

/** Extract message-id from payload or headers */
function getMessageId(payload: MailgunPayload, headerMap: Record<string, string>): string {
  let messageId: string | null =
    (payload["Message-Id"] as string) ||
    (payload["message-id"] as string) ||
    null;

  if (!messageId && headerMap["message-id"]) {
    messageId = headerMap["message-id"];
  }

  if (!messageId) {
    console.warn("⚠️ No Message-Id found, generating fallback UUID");
    messageId = crypto.randomUUID();
  }

  return messageId;
}

/** Build a Mailgun signature key for dedupe */
function buildSignatureKey(payload: MailgunPayload): string | null {
  const timestamp = payload.timestamp || "";
  const token = payload.token || "";
  const signature = payload.signature || "";

  if (!timestamp || !token || !signature) return null;

  return crypto
    .createHash("sha256")
    .update(`${timestamp}:${token}:${signature}`)
    .digest("hex");
}

/** Extract a best-guess recipient/inbound address */
function getRecipientEmail(payload: MailgunPayload, headerMap: Record<string, string>): string {
  // Mailgun primary fields
  const direct =
    (payload.recipient as string) ||
    (payload.Recipient as string) ||
    (payload.to as string) ||
    "";

  if (direct) return direct.trim().toLowerCase();

  // Fallback: X-Forwarded-To header
  const xfwdTo = headerMap["x-forwarded-to"];
  if (xfwdTo) return xfwdTo.trim().toLowerCase();

  return "";
}

/** Extract a human-ish name + email for sender */
function parseSender(payload: MailgunPayload) {
  const fromHeader =
    (payload.From as string) ||
    (payload.from as string) ||
    "";

  let fromEmail = "unknown@unknown.com";
  let name = "Unknown";

  if (fromHeader) {
    const match = fromHeader.match(/^(.*)<(.+@.+)>$/);
    if (match) {
      name = (match[1] || "").trim() || match[2].trim();
      fromEmail = match[2].trim();
    } else {
      fromEmail = fromHeader.trim();
      name = fromHeader.trim();
    }
  }

  return { fromEmail, name, fromHeader };
}

/** Extract a probable phone number from text */
function extractPhone(text: string): string {
  if (!text) return "N/A";

  // Very simple: something that "looks" like a phone number
  const match = text.match(/(\+?\d[\d\s\-]{7,15})/);
  if (!match) return "N/A";

  return match[1].replace(/\s+/g, "");
}

/** Decide if this is "contentless junk": empty body + garbage subject */
function isContentless(subjectNorm: string, bodyNorm: string): boolean {
  if (bodyNorm.trim().length > 0) return false;

  const meaninglessSubjects = new Set([
    "",
    "no",
    "na",
    "n/a",
    "-",
    ".",
    "test",
    "testing",
    "hi",
    "hey",
    "yo",
  ]);

  return meaninglessSubjects.has(subjectNorm.trim());
}

/** HARD FILTERS – return {blocked: true, reason} if we should stop */
function applyHardFilters(options: {
  subjectNorm: string;
  bodyNorm: string;
  fromLower: string;
  headerMap: Record<string, string>;
  payload: MailgunPayload;
}): { blocked: boolean; reason?: string } {
  const { subjectNorm, bodyNorm, fromLower, headerMap, payload } = options;

  // A) Auto / no-reply / system senders
  const AUTO_BLOCK = [
    "no-reply",
    "noreply",
    "do-not-reply",
    "donotreply",
    "mailer-daemon",
    "postmaster",
    "autoreply",
    "auto-reply",
  ];
  if (AUTO_BLOCK.some((w) => fromLower.includes(w))) {
    return { blocked: true, reason: "auto-sender" };
  }

  // B) Autoresponder headers
  const autoSubmitted = (headerMap["auto-submitted"] || "").toLowerCase();
  const precedence = (headerMap["precedence"] || "").toLowerCase();
  if (
    autoSubmitted.includes("auto-replied") ||
    autoSubmitted.includes("auto-generated") ||
    precedence.includes("bulk") ||
    precedence.includes("list") ||
    precedence.includes("auto_reply")
  ) {
    return { blocked: true, reason: "autoresponder-header" };
  }

  // C) Verification / security / OTP crap
  const VERIFICATION_WORDS = [
    "verification",
    "verify",
    "confirm your email",
    "confirmation code",
    "one-time password",
    "one time password",
    "otp",
    "security alert",
    "new login",
    "login attempt",
    "unusual activity",
  ];
  const VERIFICATION_DOMAINS = [
    "google.com",
    "facebookmail.com",
    "instagram.com",
    "meta.com",
    "microsoft.com",
    "outlook.com",
    "apple.com",
    "paypal.com",
  ];
  if (
    VERIFICATION_WORDS.some((w) => subjectNorm.includes(w)) ||
    VERIFICATION_WORDS.some((w) => bodyNorm.includes(w)) ||
    VERIFICATION_DOMAINS.some((d) => fromLower.endsWith(`@${d}`) || fromLower.includes(d))
  ) {
    return { blocked: true, reason: "verification-security" };
  }

  // D) Bounce notifications / delivery failures
  const BOUNCE_WORDS = [
    "delivery status notification",
    "delivery failure",
    "delivery incomplete",
    "undelivered",
    "returned mail",
    "mail delivery subsystem",
    "address not found",
  ];
  if (BOUNCE_WORDS.some((w) => subjectNorm.includes(w))) {
    return { blocked: true, reason: "bounce" };
  }

  // E) Social / platform alerts
  const SOCIAL_WORDS = [
    "facebook",
    "instagram",
    "meta",
    "linkedin",
    "tiktok",
    "youtube",
    "your ad is live",
    "your ad is now live",
    "your ad has been approved",
    "campaign update",
    "page activity",
    "new follower",
    "new like",
    "new comment",
  ];
  if (SOCIAL_WORDS.some((w) => subjectNorm.includes(w))) {
    return { blocked: true, reason: "social-alert" };
  }

  // F) Newsletter / bulk: unsubscribe signal or list headers
  const NEWSLETTER_WORDS = [
    "unsubscribe",
    "update your preferences",
    "view this email in your browser",
  ];
  const hasListUnsub = !!(
    payload["List-Unsubscribe"] ||
    headerMap["list-unsubscribe"]
  );

  if (
    hasListUnsub ||
    NEWSLETTER_WORDS.some((w) => bodyNorm.includes(w))
  ) {
    return { blocked: true, reason: "newsletter-bulk" };
  }

  // G) Contentless junk (what hit you: subject "no", empty body)
  if (isContentless(subjectNorm, bodyNorm)) {
    return { blocked: true, reason: "empty-content" };
  }

  return { blocked: false };
}

export async function POST(req: Request) {
  console.log("📩 [INBOUND] Mailgun hit endpoint");

  // Parse payload
  const payload = await parseMailgunPayload(req);
  console.log("📩 [INBOUND] Parsed payload:", payload);

  const headerMap = parseHeaderMap(payload["message-headers"]);
  const { raw: subjectRaw, normalized: subjectNorm } = getCanonicalSubject(payload);
  const { raw: bodyRaw, normalized: bodyNorm } = getCanonicalBody(payload);
  const { raw: fromHeader, lower: fromLower } = getFromHeader(payload);

  // Supabase client (service role)
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  // ======================================================
  // MAILGUN SIGNATURE DEDUPE (race-safe)
  // ======================================================
  const signatureKey = buildSignatureKey(payload);

  if (signatureKey) {
    const { error: dedupeError } = await supabase
      .from("inbound_webhook_dedupes")
      .insert({
        signature_key: signatureKey,
        received_at: new Date().toISOString(),
      });

    if (dedupeError) {
      // Unique violation = we've already seen this webhook
      if ((dedupeError as any).code === "23505") {
        console.log("🛑 DUPLICATE MAILGUN WEBHOOK (signature_key) — SKIPPING");
        return NextResponse.json({ ok: true, deduped: true });
      }

      console.error("❌ Dedupe insert error:", dedupeError);
      // For non-unique errors, we continue – worst case we might process twice
    }
  } else {
    console.warn("⚠️ Missing Mailgun signature fields, cannot dedupe by signature");
  }

  // ======================================================
  // HARD FILTERS
  // ======================================================
  const filterResult = applyHardFilters({
    subjectNorm,
    bodyNorm,
    fromLower,
    headerMap,
    payload,
  });

  if (filterResult.blocked) {
    console.log(`🛑 BLOCKED EMAIL – reason: ${filterResult.reason}`);
    return NextResponse.json({
      ok: true,
      blocked: filterResult.reason,
    });
  }

  // ======================================================
  // CONTINUE – Email is considered a legit lead
  // ======================================================

  // Message-ID (for de-duping leads)
  const messageId = getMessageId(payload, headerMap);

  // Client match
  const toEmail = getRecipientEmail(payload, headerMap);

  const { data: client, error: clientErr } = await supabase
    .from("clients")
    .select("*")
    .eq("inbound_email", toEmail)
    .maybeSingle();

  if (clientErr || !client) {
    console.error("❌ No matching client for email:", toEmail, clientErr);
    return NextResponse.json(
      { ok: false, error: "Client not found" },
      { status: 404 }
    );
  }

  console.log("🏷 Matched client:", client.id);

  // Sender details
  const { fromEmail, name } = parseSender(payload);

  // Trim long subjects, keep raw casing for SMS / display
  const subjectForDb =
    subjectRaw.length > 100 ? subjectRaw.slice(0, 100) + "..." : subjectRaw;

  // Phone extraction from body (raw text, not lowercased)
  const phone = extractPhone(bodyRaw);

  // ======================================================
  // UPSERT LEAD (message_id uniqueness)
  // ======================================================
  const { data: inserted, error: upsertError } = await supabase
    .from("leads")
    .upsert(
      {
        user_id: client.user_id,
        client_id: client.id,
        source: "email",
        subject: subjectForDb,
        from_email: fromEmail,
        name,
        phone,
        message_id: messageId,
        status: "NEW",
      },
      {
        onConflict: "message_id",
        ignoreDuplicates: true,
      }
    )
    .select()
    .maybeSingle();

  if (upsertError) {
    console.error("❌ DB Upsert Error:", upsertError);
    return NextResponse.json(
      { ok: false, error: upsertError.message },
      { status: 500 }
    );
  }

  // If row already existed, skip SMS.
  if (!inserted) {
    console.log("🛑 Duplicate lead (message_id) — SMS suppressed");
    return NextResponse.json({ ok: true, deduped_lead: true });
  }

  // ======================================================
  // SEND SMS (first time only)
  // ======================================================
  try {
    const twilioClient = twilio(
      process.env.TWILIO_ACCOUNT_SID!,
      process.env.TWILIO_AUTH_TOKEN!
    );

    const smsBody =
      `📩 New Lead via Email\n\n` +
      `👤 Name: ${name}\n` +
      `📞 Phone: ${phone}\n` +
      `✉️ From: ${fromEmail}\n` +
      `📝 Subject: ${subjectForDb || "(no subject)"}`;

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
