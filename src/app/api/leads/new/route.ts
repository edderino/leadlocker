import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { supabaseAdmin } from '@/libs/supabaseAdmin';
import { sendSMS } from '@/libs/twilio';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

const leadSchema = z.object({
  user_id: z.string().uuid(),
  source: z.string(),
  name: z.string(),
  phone: z.string(),
  description: z.string().optional(),
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const validatedData = leadSchema.parse(body);

    // Store lead in Supabase
    const { data: lead, error } = await supabaseAdmin
      .from('leads')
      .insert({
        user_id: validatedData.user_id,
        source: validatedData.source,
        name: validatedData.name,
        phone: validatedData.phone,
        description: validatedData.description || '',
        status: 'NEW',
      })
      .select()
      .single();

    if (error) {
      console.error('Supabase error:', error);
      return NextResponse.json(
        { error: 'Failed to create lead' },
        { status: 500 }
      );
    }

    // Send SMS alert via Twilio
    const defaultPhone = process.env.LL_DEFAULT_USER_PHONE;
    if (defaultPhone) {
      await sendSMS(defaultPhone, [
        `🔔 New Lead — ${validatedData.source}`,
        validatedData.name ? `Name: ${validatedData.name}` : undefined,
        validatedData.description ? `Job: ${validatedData.description}` : undefined,
        validatedData.phone ? `Call: ${validatedData.phone}` : undefined,
        `Mark done: ${process.env.NEXT_PUBLIC_APP_URL!}/api/leads/status?id=${lead.id}`
      ].filter(Boolean).join('\n'));
    }

    return NextResponse.json(
      { success: true, lead },
      { status: 200 }
    );
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid request data', details: error.errors },
        { status: 400 }
      );
    }

    console.error('Unexpected error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

