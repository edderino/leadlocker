import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

/**
 * Resend Inbound Webhook -> enqueue into public.inbound_emails
 * We DO NOT parse or send SMS here. Keep it idempotent & fast.
 */
export async function POST(req: NextRequest) {
  try {
    const payload = await req.json().catch(() => null);
    console.log("[INBOUND][RAW PAYLOAD]", JSON.stringify(payload, null, 2));
    if (!payload || payload.type !== "email.received") {
      // ignore pings/other event types
      return NextResponse.json({ ok: true });
    }

    const data = payload.data ?? {};
    const emailId: string | null = data.email_id ?? null;
    const subject: string | null = data.subject ?? null;
    const from: string | null = data.from ?? null;
    const to: string | null = Array.isArray(data.to) ? data.to[0] : data.to ?? null;

    // Resend often includes parsed body parts on the webhook:
    const text: string | null = data.text ?? null;
    const html: string | null = data.html ?? null;

    // Basic log for sanity
    console.log("✅ [INBOUND] enqueued:", {
      emailId,
      subject,
    });

    // Supabase (service role for server-side insert)
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    // Insert a lightweight row for the processor to pick up
    const { error } = await supabase.from("inbound_emails").insert({
      source: "resend",
      external_id: emailId ?? crypto.randomUUID(),
      status: "new",
      payload: {
        from,
        to,
        subject,
        text,
        html,
      },
    });

    if (error) {
      console.error("[INBOUND] enqueue failed:", error);
      return NextResponse.json({ ok: false, error: "enqueue-failed" }, { status: 500 });
    }

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("[INBOUND] webhook error:", err);
    return NextResponse.json({ ok: false, error: "server-error" }, { status: 500 });
  }
}
