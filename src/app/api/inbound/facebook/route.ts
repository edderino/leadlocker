import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/libs/supabaseAdmin";
import { sendSMS } from "@/libs/twilio";
import { log } from "@/libs/log";

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

async function resolveDefaultUserId(): Promise<string> {
  const envId = process.env.LL_DEFAULT_USER_ID;
  if (!envId) {
    throw new Error(
      "LL_DEFAULT_USER_ID is not set. Please set it to the UUID of the owner client/auth user in your environment variables."
    );
  }
  return envId;
}

export async function GET(req: NextRequest) {
  const url = new URL(req.url);

  const mode = url.searchParams.get("hub.mode");
  const token = url.searchParams.get("hub.verify_token");
  const challenge = url.searchParams.get("hub.challenge");

  if (
    mode === "subscribe" &&
    token &&
    token === process.env.FACEBOOK_WEBHOOK_VERIFY_TOKEN
  ) {
    log("GET /api/inbound/facebook - Webhook verification successful");
    return new Response(challenge ?? "", {
      status: 200,
      headers: {
        "Content-Type": "text/plain; charset=utf-8",
      },
    });
  }

  log("GET /api/inbound/facebook - Webhook verification failed", { mode, token });
  return new Response("Forbidden", { status: 403 });
}

export async function POST(req: NextRequest) {
  console.log("🔥 [Facebook Webhook] POST handler called at:", new Date().toISOString());
  console.log("🔥 [Facebook Webhook] Request URL:", req.url);
  
  try {
    const body = await req.json();

    // Always log to console for Vercel visibility
    console.log("📩 [Facebook Webhook] POST received");
    console.log("📩 [Facebook Webhook] Full body:", JSON.stringify(body, null, 2));
    log("POST /api/inbound/facebook - Webhook received", { body });

    // Facebook sends multiple types of events; we only care about leadgen.
    const entry = body.entry?.[0];
    const changes = entry?.changes?.[0];
    const value = changes?.value;

    console.log("📩 [Facebook Webhook] Entry:", entry ? "exists" : "missing");
    console.log("📩 [Facebook Webhook] Changes:", changes ? "exists" : "missing");
    console.log("📩 [Facebook Webhook] Value:", value ? JSON.stringify(value, null, 2) : "missing");
    console.log("📩 [Facebook Webhook] Field check:", value?.field);

    if (!value || value.field !== "leadgen") {
      console.log("⚠️ [Facebook Webhook] Ignoring non-leadgen event. Field:", value?.field);
      log("POST /api/inbound/facebook - Ignoring non-leadgen event");
      return NextResponse.json({ ok: true, ignored: true });
    }

    const leadId = value.leadgen_id;
    const adId = value.ad_id ?? null;
    const formId = value.form_id ?? null;
    const pageId = value.page_id ?? null;

    log("POST /api/inbound/facebook - Processing lead", { leadId, adId, formId, pageId });

    // 1. Fetch actual lead data from Facebook Graph API (or use test mode)
    let name = "";
    let email = "";
    let phone = "";

    // Test mode: bypass Graph API and use hardcoded values
    if (process.env.FACEBOOK_WEBHOOK_TEST_MODE === "true") {
      console.log("🧪 [Facebook Webhook] TEST MODE ENABLED - Using hardcoded test values");
      name = "Test Lead";
      email = "test@test.com";
      phone = "+61400000000";
    } else {
      // Production mode: fetch from Facebook Graph API
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
      for (const field of leadData.field_data ?? []) {
        if (field.name === "full_name") name = field.values?.[0] || "";
        if (field.name === "email") email = field.values?.[0] || "";
        if (field.name === "phone_number") phone = field.values?.[0] || "";
      }
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
    console.log("🔍 [Facebook Webhook] Resolving user_id...");
    let user_id: string;
    try {
      user_id = await resolveDefaultUserId();
      console.log("✅ [Facebook Webhook] Resolved user_id:", user_id);
    } catch (userIdError: any) {
      console.error("❌ [Facebook Webhook] Failed to resolve user_id:", userIdError);
      console.error("❌ [Facebook Webhook] Error message:", userIdError?.message);
      return NextResponse.json(
        { 
          error: "Failed to resolve user_id",
          details: userIdError?.message || String(userIdError)
        },
        { status: 500 }
      );
    }

    // 3. Build description with email and Facebook metadata
    const descriptionParts = [];
    if (email) descriptionParts.push(`Email: ${email}`);
    if (adId) descriptionParts.push(`Ad ID: ${adId}`);
    if (formId) descriptionParts.push(`Form ID: ${formId}`);
    const description = descriptionParts.length > 0 ? descriptionParts.join(" | ") : null;

    // 4. Insert lead into Supabase
    // NOTE: Your production DB `leads` table does NOT have a `user_id` column,
    // so we do NOT send `user_id` here to avoid PGRST204 errors.
    const insertPayload = {
      org_id: 'demo-org',
      source: "Facebook",
      name,
      phone,
      description,
      status: 'NEW',
    };
    
    console.log("💾 [Facebook Webhook] Attempting insert with payload:", JSON.stringify(insertPayload, null, 2));
    
    const { data, error } = await supabaseAdmin
      .from("leads")
      .insert(insertPayload)
      .select('*')
      .single();

    if (error) {
      console.error("❌ [Facebook Webhook] Supabase insert error:", error);
      console.error("❌ [Facebook Webhook] Error message:", error.message);
      console.error("❌ [Facebook Webhook] Error code:", error.code);
      console.error("❌ [Facebook Webhook] Error hint:", error.hint);
      console.error("❌ [Facebook Webhook] Error details:", error.details);
      log("POST /api/inbound/facebook - Supabase insert error", error.message);
      return NextResponse.json(
        { 
          error: "Failed to save lead",
          details: error.message,
          code: error.code,
          hint: error.hint
        },
        { status: 500 }
      );
    }
    
    console.log("✅ [Facebook Webhook] Lead inserted successfully:", data.id);

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

    console.log("✅ [Facebook Webhook] Successfully processed lead:", data.id);
    return NextResponse.json({ ok: true, lead_id: data.id });
  } catch (err: any) {
    console.error("❌ [Facebook Webhook] Error:", err);
    console.error("❌ [Facebook Webhook] Error message:", err?.message);
    console.error("❌ [Facebook Webhook] Error stack:", err?.stack);
    log("POST /api/inbound/facebook - Unexpected error", err);
    return NextResponse.json(
      { error: "Internal server error", details: err?.message },
      { status: 500 }
    );
  }
}