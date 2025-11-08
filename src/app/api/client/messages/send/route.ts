// src/app/api/client/messages/send/route.ts

import { NextRequest, NextResponse } from "next/server";

import { supabaseAdmin } from "@/libs/supabaseAdmin";
import { twilioClient } from "@/libs/twilio"; // already in your repo
import { verifyClientSession } from "../../_lib/verifyClientSession";

export const runtime = "nodejs";

export const dynamic = "force-dynamic";

/**
 * POST /api/client/messages/send
 *
 * Body JSON:
 *   { orgId: string, body: string }
 *
 * Behavior:
 *   Sends an SMS FROM the client's configured twilio_from TO the client's twilio_to.
 *   Requires Authorization: Bearer <access_token> header.
 */
export async function POST(req: NextRequest) {
  try {
    const authHeader = req.headers.get("authorization");

    if (!authHeader?.toLowerCase().startsWith("bearer ")) {
      return NextResponse.json({ ok: false, error: "Missing authorization header" }, { status: 401 });
    }

    const token = authHeader.slice("Bearer ".length).trim();

    if (!token) {
      return NextResponse.json({ ok: false, error: "Invalid authorization header" }, { status: 401 });
    }

    const { orgId, body } = await req.json();

    if (!orgId || !body || typeof body !== "string" || body.trim().length === 0) {
      return NextResponse.json({ ok: false, error: "Missing orgId or body" }, { status: 400 });
    }

    const verification = await verifyClientSession(token);

    if (!verification.ok) {
      return NextResponse.json({ ok: false, error: verification.error }, { status: verification.status });
    }

    if (verification.clientId !== orgId) {
      return NextResponse.json({ ok: false, error: "Forbidden" }, { status: 403 });
    }

    const { data: client, error: clientErr } = await supabaseAdmin
      .from("clients")
      .select("id, twilio_from, twilio_to")
      .eq("id", orgId)
      .single();

    if (clientErr || !client) {
      return NextResponse.json({ ok: false, error: "Invalid orgId" }, { status: 400 });
    }

    if (!client.twilio_from || !client.twilio_to) {
      return NextResponse.json({ ok: false, error: "Client missing Twilio numbers" }, { status: 400 });
    }

    const sms = await twilioClient.messages.create({
      from: client.twilio_from,
      to: client.twilio_to,
      body,
    });

    return NextResponse.json({ ok: true, sid: sms.sid });
  } catch (e: any) {
    return NextResponse.json({ ok: false, error: e?.message ?? "error" }, { status: 500 });
  }
}

