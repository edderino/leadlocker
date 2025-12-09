import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/libs/supabaseAdmin";
import { sendSMS } from "@/libs/twilio";
import { log } from "@/libs/log";

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

async function resolveDefaultUserId(): Promise<string> {
  // Prefer env if set
  if (process.env.LL_DEFAULT_USER_ID) return process.env.LL_DEFAULT_USER_ID;

  // Fallback: first user in DB
  const { data, error } = await supabaseAdmin
    .from('users')
    .select('id')
    .order('created_at', { ascending: true })
    .limit(1)
    .maybeSingle();

  if (error) throw new Error(`Failed to resolve default user: ${error.message}`);
  if (!data?.id) throw new Error('No users exist. Create one in Supabase or set LL_DEFAULT_USER_ID.');
  return data.id;
}

export async function GET(req: NextRequest) {
  const url = new URL(req.url);

  const mode = url.searchParams.get("hub.mode");
  const token = url.searchParams.get("hub.verify_token");
  const challenge = url.searchParams.get("hub.challenge");

  if (mode === "subscribe" && token === process.env.FACEBOOK_WEBHOOK_TOKEN) {
    log("GET /api/inbound/facebook - Webhook verification successful");
    return new Response(challenge, { status: 200 });
  }

  log("GET /api/inbound/facebook - Webhook verification failed", { mode, token });
  return new Response("Forbidden", { status: 403 });
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

    log("POST /api/inbound/facebook - Webhook received", { body });

    // Facebook sends multiple types of events; we only care about leadgen.
    const entry = body.entry?.[0];
    const changes = entry?.changes?.[0];
    const value = changes?.value;

    if (!value || value.field !== "leadgen") {
      log("POST /api/inbound/facebook - Ignoring non-leadgen event");
      return NextResponse.json({ ok: true, ignored: true });
    }

    const leadId = value.leadgen_id;
    const adId = value.ad_id ?? null;
    const formId = value.form_id ?? null;
    const pageId = value.page_id ?? null;

    log("POST /api/inbound/facebook - Processing lead", { leadId, adId, formId, pageId });

    // 1. Fetch actual lead data from Facebook Graph API
    const pageAccessToken = process.env.FACEBOOK_PAGE_ACCESS_TOKEN;
    if (!pageAccessToken) {
      log("POST /api/inbound/facebook - Missing FACEBOOK_PAGE_ACCESS_TOKEN");
      return NextResponse.json(
        { error: "Facebook Page Access Token not configured" },
        { status: 500 }
      );
    }

    const graphRes = await fetch(
      `https://graph.facebook.com/v17.0/${leadId}?access_token=${pageAccessToken}`
    );

    if (!graphRes.ok) {
      log("POST /api/inbound/facebook - Facebook Graph API error", {
        status: graphRes.status,
        statusText: graphRes.statusText,
      });
      return NextResponse.json(
        { error: "Failed to fetch lead data from Facebook" },
        { status: 500 }
      );
    }

    const leadData = await graphRes.json();

    // Extract fields (FB returns an array of {name, values[]})
    let name = "";
    let email = "";
    let phone = "";

    for (const field of leadData.field_data ?? []) {
      if (field.name === "full_name") name = field.values?.[0] || "";
      if (field.name === "email") email = field.values?.[0] || "";
      if (field.name === "phone_number") phone = field.values?.[0] || "";
    }

    // Validate required fields
    if (!name || !phone) {
      log("POST /api/inbound/facebook - Missing required fields", { name, phone });
      return NextResponse.json(
        { error: "Missing required lead data (name or phone)" },
        { status: 400 }
      );
    }

    log("POST /api/inbound/facebook - Extracted lead data", { name, email, phone });

    // 2. Resolve user_id
    const user_id = await resolveDefaultUserId();

    // 3. Build description with email and Facebook metadata
    const descriptionParts = [];
    if (email) descriptionParts.push(`Email: ${email}`);
    if (adId) descriptionParts.push(`Ad ID: ${adId}`);
    if (formId) descriptionParts.push(`Form ID: ${formId}`);
    const description = descriptionParts.length > 0 ? descriptionParts.join(" | ") : null;

    // 4. Insert lead into Supabase
    const { data, error } = await supabaseAdmin
      .from("leads")
      .insert({
        user_id,
        org_id: 'demo-org',
        source: "Facebook",
        name,
        phone,
        description,
        status: 'NEW',
      })
      .select('*')
      .single();

    if (error) {
      log("POST /api/inbound/facebook - Supabase insert error", error.message);
      return NextResponse.json(
        { error: "Failed to save lead" },
        { status: 500 }
      );
    }

    log("POST /api/inbound/facebook - Lead created successfully", data.id);

    // 5. Log event (silent failure)
    try {
      await supabaseAdmin.from("events").insert({
        event_type: "lead.created",
        lead_id: data.id,
        actor_id: user_id,
        metadata: {
          source: "Facebook",
          name,
          phone,
          email,
          ad_id: adId,
          form_id: formId,
          page_id: pageId,
          facebook_lead_id: leadId,
        },
      });
    } catch (eventError) {
      log("POST /api/inbound/facebook - Event logging failed (non-fatal)", eventError);
    }

    // 6. Send SMS alert via Twilio (same pattern as /api/leads/new)
    const defaultPhone = process.env.LL_DEFAULT_USER_PHONE;
    if (defaultPhone) {
      const rawUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
      const baseUrl = rawUrl.startsWith('http') ? rawUrl : `http://${rawUrl}`;
      
      const smsBody = [
        `🔔 New Lead — Facebook`,
        `Name: ${name}`,
        email ? `Email: ${email}` : undefined,
        `Call: ${phone}`,
        `Mark done: ${baseUrl}/api/leads/status?id=${data.id}`
      ].filter(Boolean).join('\n');
      
      await sendSMS(defaultPhone, smsBody);

      // Log SMS event (silent failure)
      try {
        await supabaseAdmin.from("events").insert({
          event_type: "sms.sent",
          lead_id: data.id,
          actor_id: user_id,
          metadata: {
            recipient: defaultPhone,
            message_type: "new_lead_alert",
            body_length: smsBody.length,
            source: "Facebook",
          },
        });
      } catch (eventError) {
        log("POST /api/inbound/facebook - SMS event logging failed (non-fatal)", eventError);
      }
    }

    return NextResponse.json({ ok: true, lead_id: data.id });
  } catch (err) {
    log("POST /api/inbound/facebook - Unexpected error", err);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
