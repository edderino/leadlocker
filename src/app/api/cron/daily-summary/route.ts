import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/libs/supabaseAdmin';
import { sendSMS } from '@/libs/twilio';
import { log } from '@/libs/log';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export async function GET(request: NextRequest) {
  return handleDailySummaryCron(request);
}

export async function POST(request: NextRequest) {
  return handleDailySummaryCron(request);
}

async function handleDailySummaryCron(request: NextRequest) {
  try {
    // 1. Verify CRON_SECRET
    const cronSecret = request.headers.get('x-cron-secret');
    const expectedSecret = process.env.CRON_SECRET;

    if (!expectedSecret) {
      console.error('[Cron] CRON_SECRET not configured in environment');
      return NextResponse.json(
        { success: false, error: 'Server configuration error' },
        { status: 500 }
      );
    }

    if (!cronSecret || cronSecret !== expectedSecret) {
      console.error('[Cron] Unauthorized access attempt - invalid or missing x-cron-secret');
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    log('[Cron] /api/cron/daily-summary - Starting daily summary job');

    const userId = 'c96933ac-8a2b-484b-b9df-8e25d04e7f29';

    // 2. Query leads created today (midnight to now)
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const { data: leads, error } = await supabaseAdmin
      .from('leads')
      .select('*')
      .eq('user_id', userId)
      .gte('created_at', today.toISOString())
      .order('created_at', { ascending: false });

    if (error) {
      console.error('[Cron] Failed to fetch leads from database:', error.message);
      throw new Error(`Database query failed: ${error.message}`);
    }

    // 3. Build summary message
    const total = leads?.length || 0;
    const newCount = leads?.filter((l) => l.status === 'NEW').length || 0;
    const approvedCount = leads?.filter((l) => l.status === 'APPROVED').length || 0;
    const completedCount = leads?.filter((l) => l.status === 'COMPLETED').length || 0;

    const byStatus = {
      NEW: newCount,
      APPROVED: approvedCount,
      COMPLETED: completedCount,
    };

    log('[Cron] Summary generated', { total, byStatus });

    // 4. Send SMS via Twilio
    const smsBody = `Leads today: ${total} (new ${newCount}, ok ${approvedCount}, done ${completedCount})`;
    const defaultPhone = process.env.LL_DEFAULT_USER_PHONE;

    if (!defaultPhone) {
      console.error('[Cron] LL_DEFAULT_USER_PHONE not configured');
      throw new Error('Recipient phone number not configured');
    }

    const smsResult = await sendSMS(defaultPhone, smsBody);
    
    // Check if SMS failed
    if (smsResult && 'error' in smsResult) {
      console.error('[Cron] SMS send failed:', smsResult.error);
      throw new Error(`SMS delivery failed: ${smsResult.error}`);
    }

    log('[Cron] SMS sent successfully', { length: smsBody.length });

    // 5. Log events to database
    try {
      // Log sms.sent event
      const { error: smsEventError } = await supabaseAdmin.from('events').insert({
        event_type: 'sms.sent',
        lead_id: null,
        actor_id: userId,
        metadata: {
          recipient: defaultPhone,
          message_type: 'daily_summary',
          body_length: smsBody.length,
          summary_data: { total, byStatus },
          triggered_by: 'cron',
        },
      });

      if (smsEventError) {
        console.error('[Cron] Failed to log sms.sent event:', smsEventError);
      }

      // Log summary.sent event
      const { error: summaryEventError } = await supabaseAdmin.from('events').insert({
        event_type: 'summary.sent',
        lead_id: null,
        actor_id: userId,
        metadata: {
          date: today.toISOString().split('T')[0],
          total,
          byStatus,
          recipient: defaultPhone,
          triggered_by: 'cron',
        },
      });

      if (summaryEventError) {
        console.error('[Cron] Failed to log summary.sent event:', summaryEventError);
      }
    } catch (eventError) {
      // Events are logged as best effort, don't fail the whole job
      console.error('[Cron] Event logging error:', eventError);
    }

    log('[Cron] Daily summary job completed successfully');

    return NextResponse.json({
      success: true,
      total,
      byStatus,
      timestamp: new Date().toISOString(),
    });

  } catch (error: any) {
    console.error('[Cron] Daily summary job failed:', error);
    
    return NextResponse.json(
      { 
        success: false, 
        error: error.message || 'Internal server error',
        timestamp: new Date().toISOString(),
      },
      { status: 500 }
    );
  }
}

