import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/libs/supabaseAdmin';
import { sendSMS } from '@/libs/twilio';
import { log } from '@/libs/log';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export async function GET(request: NextRequest) {
  return handleSummary();
}

export async function POST(request: NextRequest) {
  return handleSummary();
}

async function handleSummary() {
  try {
    log("POST/GET /api/summary/send - Daily summary request");
    
    // Query leads from the last 24 hours
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);

    const { data: leads, error } = await supabaseAdmin
      .from('leads')
      .select('*')
      .gte('created_at', yesterday.toISOString())
      .order('created_at', { ascending: false });

    if (error) {
      log("POST/GET /api/summary/send - Supabase error", error.message);
      return NextResponse.json(
        { error: 'Failed to fetch leads' },
        { status: 500 }
      );
    }

    // Format summary
    const totalLeads = leads?.length || 0;
    const newLeads = leads?.filter((l) => l.status === 'NEW').length || 0;
    const doneLeads = leads?.filter((l) => l.status === 'DONE').length || 0;

    log("POST/GET /api/summary/send - Summary generated", { total: totalLeads, new: newLeads, done: doneLeads });

    // Send SMS
    const defaultPhone = process.env.LL_DEFAULT_USER_PHONE;
    if (defaultPhone) {
      await sendSMS(defaultPhone, `📊 Daily Summary:\nLeads: ${totalLeads}\nDone: ${doneLeads}`);
    }

    log("POST/GET /api/summary/send - Summary sent successfully");
    return NextResponse.json(
      {
        success: true,
        summary: {
          total: totalLeads,
          new: newLeads,
          done: doneLeads,
        },
      },
      { status: 200 }
    );
  } catch (error) {
    log("POST/GET /api/summary/send - Unexpected error", error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

