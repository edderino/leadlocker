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
      "LL_DEFAULT_USER_ID is not set. Please set it to the UUID of the owner auth user in your environment variables."
    );
  }
  return envId;
}

async function resolveDefaultClientId(): Promise<string> {
  const envId = process.env.LL_DEFAULT_CLIENT_ID;
  if (!envId) {
    throw new Error(
      "LL_DEFAULT_CLIENT_ID is not set. Please set it to the UUID of the client row (public.clients.id) that should own Facebook leads."
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
    const change = entry?.changes?.[0];

    // Confirm we're parsing the webhook payload correctly
    log("meta_webhook_payload", {
      object: body?.object,
      entry0: body?.entry?.[0],
      change0: body?.entry?.[0]?.changes?.[0],
      leadgen_id: body?.entry?.[0]?.changes?.[0]?.value?.leadgen_id,
    });

    console.log(
      "📩 [Facebook Webhook] Raw change:",
      change ? JSON.stringify(change, null, 2) : "missing"
    );
    console.log("📩 [Facebook Webhook] Field check:", change?.field);

    if (change?.field !== "leadgen") {
      console.warn("⚠️ [Facebook Webhook] Ignoring non-leadgen event");
      log("POST /api/inbound/facebook - Ignoring non-leadgen event");
      return NextResponse.json({ ok: true, ignored: true });
    }

    const value = change.value;

    console.log(
      "📩 [Facebook Webhook] Value:",
      value ? JSON.stringify(value, null, 2) : "missing"
    );

    const leadId = value.leadgen_id;
    const adId = value.ad_id ?? null;
    const formId = value.form_id ?? null;
    const pageId = value.page_id ?? null;

    log("POST /api/inbound/facebook - Processing lead", { leadId, adId, formId, pageId });

    // Detect Meta Lead Ads Testing Tool events (entry.id === "0" on object "page")
    const isMetaTestToolEvent = body.object === "page" && entry?.id === "0";
    const isTestMode =
      process.env.FACEBOOK_WEBHOOK_TEST_MODE === "true" || isMetaTestToolEvent;

    if (isMetaTestToolEvent) {
      console.log("🧪 [Facebook Webhook] Meta Lead Ads Testing Tool event detected");
    }

    // 1. Fetch actual lead data from Facebook Graph API (or use test mode)
    let name = "";
    let email = "";
    let phone = "";

    // Test mode: bypass Graph API and use hardcoded values
    if (isTestMode) {
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

      const fields = [
        "created_time",
        "ad_id",
        "adgroup_id",
        "campaign_id",
        "form_id",
        "platform",
        "is_organic",
        "field_data",
      ].join(",");

      const url =
        `https://graph.facebook.com/v17.0/${leadId}` +
        `?fields=${encodeURIComponent(fields)}` +
        `&access_token=${encodeURIComponent(pageAccessToken)}`;

      let resp: Response;
      let json: any;
      
      try {
        resp = await fetch(url);
        
        // Get raw response text before parsing JSON
        const rawResponseText = await resp.text();
        
        // Log HTTP status, headers, and raw body
        const headersObj: Record<string, string> = {};
        resp.headers.forEach((value, key) => {
          headersObj[key] = value;
        });
        
        log("meta_graph_fetch_response", {
          leadId,
          status: resp.status,
          statusText: resp.statusText,
          headers: headersObj,
          rawBody: rawResponseText,
          url_no_token: url.replace(/access_token=[^&]+/, "access_token=REDACTED"),
        });
        
        // Try to parse JSON
        try {
          json = JSON.parse(rawResponseText);
        } catch (parseError: any) {
          log("meta_graph_fetch_json_parse_failed", {
            leadId,
            status: resp.status,
            rawBody: rawResponseText,
            parseError: parseError?.message || String(parseError),
            url_no_token: url.replace(/access_token=[^&]+/, "access_token=REDACTED"),
          });
          throw parseError;
        }
      } catch (fetchError: any) {
        // Re-throw after logging
        log("meta_graph_fetch_error", {
          leadId,
          error: fetchError?.message || String(fetchError),
          stack: fetchError?.stack,
          url_no_token: url.replace(/access_token=[^&]+/, "access_token=REDACTED"),
        });
        throw fetchError;
      }

      // 🔥 NEVER silently continue if Graph call fails
      if (!resp.ok) {
        log("meta_graph_fetch_failed", {
          leadId,
          status: resp.status,
          json,
          url_no_token: url.replace(/access_token=[^&]+/, "access_token=REDACTED"),
        });
        return NextResponse.json(
          { error: "Graph fetch failed", details: json },
          { status: 500 }
        );
      }

      log("meta_graph_fetch_ok", {
        leadId,
        keys: Object.keys(json || {}),
        field_data_len: json?.field_data?.length ?? 0,
      });

      const leadDetails = json;

      // Make the lead insert depend on actually having field_data
      if (!leadDetails?.field_data?.length) {
        log("meta_no_field_data", { leadId, leadDetails });
        return NextResponse.json(
          { error: "No field_data", leadId, leadDetails },
          { status: 200 }
        );
      }

      // Extract fields (FB returns an array of {name, values[]})
      for (const field of leadDetails.field_data ?? []) {
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

    // 3. Resolve client_id (so leads show in dashboard)
    console.log("🔍 [Facebook Webhook] Resolving client_id...");
    let client_id: string;
    try {
      client_id = await resolveDefaultClientId();
      console.log("✅ [Facebook Webhook] Resolved client_id:", client_id);
    } catch (clientIdError: any) {
      console.error("❌ [Facebook Webhook] Failed to resolve client_id:", clientIdError);
      console.error("❌ [Facebook Webhook] Error message:", clientIdError?.message);
      return NextResponse.json(
        {
          error: "Failed to resolve client_id",
          details: clientIdError?.message || String(clientIdError),
        },
        { status: 500 }
      );
    }

    // 4. Build description with email and Facebook metadata
    const descriptionParts = [];
    if (email) descriptionParts.push(`Email: ${email}`);
    if (adId) descriptionParts.push(`Ad ID: ${adId}`);
    if (formId) descriptionParts.push(`Form ID: ${formId}`);
    const description = descriptionParts.length > 0 ? descriptionParts.join(" | ") : null;

    // 5. Insert lead into Supabase
    // NOTE: Your production DB `leads` table does NOT have a `user_id` column,
    // so we do NOT send `user_id` here to avoid PGRST204 errors. We DO send
    // client_id so the lead appears in the client's dashboard.
    const insertPayload = {
      client_id,
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

    // 6. Log event (silent failure)
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

    // 7. Send SMS alert via Twilio (same pattern as /api/leads/new)
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