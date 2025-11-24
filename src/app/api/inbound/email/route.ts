import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

/**
 * Mini-Zap intake: accept Resend inbound webhooks and enqueue the full payload.
 * No parsing, no DB writes to `leads`, no SMS. Downstream worker will process.
 */
export async function POST(req: NextRequest) {
  try {
    const payload = await req.json();

    // Accept only Resend inbound events
    if (payload?.type !== "email.received") {
      return NextResponse.json({ ok: true, ignored: true });
    }

    const data = payload.data || {};
    const emailId: string | null = data.email_id ?? null;
    const fromAddr: string | null = data.from ?? null;
    const toAddr: string | null = Array.isArray(data.to) ? data.to[0] : data.to ?? null;
    const subject: string | null = data.subject ?? null;

    console.log("🔵 [INBOUND] enqueue request:", {
      type: payload.type,
      emailId,
      from: fromAddr,
      to: toAddr,
      subject,
    });

    // Create Supabase service client
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    // Idempotency: if we’ve already enqueued this email_id for provider=resend, skip
    if (emailId) {
      const { data: existing, error: selErr } = await supabase
        .from("inbound_queue")
        .select("id")
        .eq("provider", "resend")
        .eq("external_id", emailId)
        .limit(1);

      if (selErr) {
        console.error("❌ [INBOUND] select existing failed:", selErr);
      }

      if (existing && existing.length > 0) {
        console.log("🟡 [INBOUND] duplicate email_id, already enqueued:", emailId);
        return NextResponse.json({ ok: true, duplicate: true });
      }
    }

    // Enqueue full raw payload (jsonb), mark as PENDING
    const { error: insErr } = await supabase.from("inbound_queue").insert({
      provider: "resend",
      external_id: emailId,
      from_addr: fromAddr,
      to_addr: toAddr,
      subject,
      payload,            // store the entire raw payload for the worker
      status: "PENDING",
    });

    if (insErr) {
      console.error("❌ [INBOUND] enqueue failed:", insErr);
      return NextResponse.json({ ok: false, error: "enqueue_failed" }, { status: 500 });
    }

    console.log("✅ [INBOUND] enqueued:", { emailId, subject });
    return NextResponse.json({ ok: true, enqueued: true });
  } catch (err) {
    console.error("❌ [INBOUND] crash:", err);
    return NextResponse.json({ ok: false, error: "server_error" }, { status: 500 });
  }
}
