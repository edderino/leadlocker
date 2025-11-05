// src/app/api/client/messages/send/route.ts

import { NextRequest, NextResponse } from "next/server";

import { supabaseAdmin } from "@/libs/supabaseAdmin";

import { twilioClient } from "@/libs/twilio"; // already in your repo

export const runtime = "nodejs";

export const dynamic = "force-dynamic";

/**

 * POST /api/client/messages/send

 * Headers:

 *   x-client-token: <must match CLIENT_PORTAL_SECRET>

 * Body JSON:

 *   { orgId: string, body: string }

 * Behavior:

 *   Sends an SMS FROM the client's configured twilio_from TO the client's twilio_to.

 */

export async function POST(req: NextRequest) {

  try {

    // 1) auth (same model as your client leads endpoint)

    const clientToken = req.headers.get("x-client-token");

    const expected = process.env.CLIENT_PORTAL_SECRET;

    if (!expected || clientToken !== expected) {

      return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });

    }

    // 2) parse body

    const { orgId, body } = await req.json();

    if (!orgId || !body || typeof body !== "string" || body.trim().length === 0) {

      return NextResponse.json({ ok: false, error: "Missing orgId or body" }, { status: 400 });

    }

    // 3) fetch client SMS settings

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

    // 4) send SMS

    const sms = await twilioClient.messages.create({

      from: client.twilio_from,

      to: client.twilio_to,

      body,

    });

    // 5) (optional) log message row later; for now just return SID

    return NextResponse.json({ ok: true, sid: sms.sid });

  } catch (e: any) {

    return NextResponse.json({ ok: false, error: e?.message ?? "error" }, { status: 500 });

  }

}

