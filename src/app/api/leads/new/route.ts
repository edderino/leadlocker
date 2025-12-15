import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import crypto from 'crypto';
import { supabaseAdmin } from '@/libs/supabaseAdmin';
import { sendSMS } from '@/libs/twilio';
import { log } from '@/libs/log';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

const LeadPayload = z.object({
  source: z.string().min(1),
  name: z.string().min(1),
  phone: z.string().min(3),
  description: z.string().optional(),
  // user_id removed — server will resolve it
});

function createStatusToken(leadId: string): string | null {
  const secret = process.env.LEAD_STATUS_SECRET;
  if (!secret) return null;

  return crypto.createHmac('sha256', secret).update(leadId).digest('hex');
}

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

export async function POST(request: NextRequest) {
  try {
    console.log("🔥 Lead creation endpoint triggered");

    // Basic auth hardening: require a valid session cookie
    const token =
      request.cookies.get("ll_session")?.value ||
      request.cookies.get("sb-access-token")?.value;

    if (!token) {
      return NextResponse.json(
        { error: "Not authenticated" },
        { status: 401 }
      );
    }

    const body = await request.json();
    const payload = LeadPayload.parse(body);
    log("POST /api/leads/new - Lead creation request", payload.source, payload.name);

    const user_id = await resolveDefaultUserId();

    // Store lead in Supabase
    const { data, error } = await supabaseAdmin
      .from('leads')
      .insert({
        user_id,
        org_id: 'demo-org', // Default org for all leads
        source: payload.source,
        name: payload.name,
        phone: payload.phone,
        description: payload.description ?? null,
        status: 'NEW',
      })
      .select('*')
      .single();

    if (error) {
      log("POST /api/leads/new - Supabase error", error.message);
      return NextResponse.json(
        { error: 'Failed to create lead' },
        { status: 500 }
      );
    }

    log("POST /api/leads/new - Lead created successfully", data.id);

    const statusToken = createStatusToken(data.id);

    // Log event (silent failure)
    try {
      const actorId = data.user_id && typeof data.user_id === "string" ? data.user_id : null;
      
      const result = await supabaseAdmin.from("events").insert({
        event_type: "lead.created",
        lead_id: data.id,
        actor_id: actorId,
        metadata: {
          source: data.source,
          name: data.name,
          phone: data.phone,
          created_via: "form",
        },
      });
      console.log("🧾 Event insert result:", result);
    } catch (eventError) {
      log("POST /api/leads/new - Event logging failed (non-fatal)", eventError);
    }

    // Send SMS alert via Twilio
    const defaultPhone = process.env.LL_DEFAULT_USER_PHONE;
    if (defaultPhone) {
      // Ensure base URL has proper protocol
      const rawUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
      const baseUrl = rawUrl.startsWith('http') ? rawUrl : `http://${rawUrl}`;
      
      const statusUrl = new URL("/api/leads/status", baseUrl);
      statusUrl.searchParams.set("id", data.id);
      if (statusToken) {
        statusUrl.searchParams.set("token", statusToken);
      }

      const smsBody = [
        `🔔 New Lead — ${payload.source}`,
        payload.name ? `Name: ${payload.name}` : undefined,
        payload.description ? `Job: ${payload.description}` : undefined,
        payload.phone ? `Call: ${payload.phone}` : undefined,
        `Mark done: ${statusUrl.toString()}`
      ].filter(Boolean).join('\n');
      
      await sendSMS(defaultPhone, smsBody);

      // Log SMS event (silent failure)
      try {
        const actorId = data.user_id && typeof data.user_id === "string" ? data.user_id : null;
        
        await supabaseAdmin.from("events").insert({
          event_type: "sms.sent",
          lead_id: data.id,
          actor_id: actorId,
          metadata: {
            recipient: defaultPhone,
            message_type: "new_lead_alert",
            body_length: smsBody.length,
            source: payload.source,
          },
        });
      } catch (eventError) {
        console.error("[EventLayer] POST /api/leads/new - SMS event logging failed:", eventError);
      }
    }

    return NextResponse.json({ success: true, lead: data });
  } catch (error) {
    if (error instanceof z.ZodError) {
      log("POST /api/leads/new - Validation error", error.errors);
      return NextResponse.json(
        { error: 'Invalid request data', details: error.errors },
        { status: 400 }
      );
    }

    log("POST /api/leads/new - Unexpected error", error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}