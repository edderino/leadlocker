import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
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
    const body = await request.json();
    const payload = LeadPayload.parse(body);
    log("POST /api/leads/new - Lead creation request", payload.source, payload.name);

    const user_id = await resolveDefaultUserId();

    // Store lead in Supabase
    const { data, error } = await supabaseAdmin
      .from('leads')
      .insert({
        user_id,
        source: payload.source,
        name: payload.name,
        phone: payload.phone,
        description: payload.description ?? null,
        status: 'NEW',
      })
      .select('id')
      .single();

    if (error) {
      log("POST /api/leads/new - Supabase error", error.message);
      return NextResponse.json(
        { error: 'Failed to create lead' },
        { status: 500 }
      );
    }

    log("POST /api/leads/new - Lead created successfully", data.id);

    // Send SMS alert via Twilio
    const defaultPhone = process.env.LL_DEFAULT_USER_PHONE;
    if (defaultPhone) {
      await sendSMS(defaultPhone, [
        `🔔 New Lead — ${payload.source}`,
        payload.name ? `Name: ${payload.name}` : undefined,
        payload.description ? `Job: ${payload.description}` : undefined,
        payload.phone ? `Call: ${payload.phone}` : undefined,
        `Mark done: ${process.env.NEXT_PUBLIC_APP_URL!}/api/leads/status?id=${data.id}`
      ].filter(Boolean).join('\n'));
    }

    return NextResponse.json({ ok: true, id: data.id });
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