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
    
    const userId = 'c96933ac-8a2b-484b-b9df-8e25d04e7f29';
    
    // Query leads from today (midnight to now)
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const { data: leads, error } = await supabaseAdmin
      .from('leads')
      .select('*')
      .eq('user_id', userId)
      .gte('created_at', today.toISOString())
      .order('created_at', { ascending: false });

    if (error) {
      log("POST/GET /api/summary/send - Supabase error", error.message);
      return NextResponse.json(
        { success: false, error: 'Failed to fetch leads' },
        { status: 500 }
      );
    }

    // Format summary
    const total = leads?.length || 0;
    const newCount = leads?.filter((l) => l.status === 'NEW').length || 0;
    const approvedCount = leads?.filter((l) => l.status === 'APPROVED').length || 0;
    const completedCount = leads?.filter((l) => l.status === 'COMPLETED').length || 0;

    const byStatus = {
      NEW: newCount,
      APPROVED: approvedCount,
      COMPLETED: completedCount,
    };

    log("POST/GET /api/summary/send - Summary generated", { total, byStatus });

    // Send SMS (keep it <= 140 chars)
    const smsBody = `Leads today: ${total} (new ${newCount}, ok ${approvedCount}, done ${completedCount})`;
    
    const defaultPhone = process.env.LL_DEFAULT_USER_PHONE;
    if (defaultPhone) {
      await sendSMS(defaultPhone, smsBody);
      log("POST/GET /api/summary/send - SMS sent", { length: smsBody.length });

      // Log SMS event (silent failure)
      try {
        await supabaseAdmin.from("events").insert({
          event_type: "sms.sent",
          lead_id: null, // No specific lead for summary
          actor_id: userId,
          metadata: {
            recipient: defaultPhone,
            message_type: "daily_summary",
            body_length: smsBody.length,
            summary_data: { total, byStatus },
          },
        });
      } catch (eventError) {
        console.error("[EventLayer] /api/summary/send - SMS event logging failed:", eventError);
      }
    }

    // Log summary.sent event (silent failure)
    try {
      await supabaseAdmin.from("events").insert({
        event_type: "summary.sent",
        lead_id: null,
        actor_id: userId,
        metadata: {
          date: today.toISOString().split('T')[0],
          total,
          byStatus,
          recipient: defaultPhone || null,
        },
      });
    } catch (eventError) {
      console.error("[EventLayer] /api/summary/send - Summary event logging failed:", eventError);
    }

    log("POST/GET /api/summary/send - Summary sent successfully");
    return NextResponse.json({
      success: true,
      total,
      byStatus,
    });
  } catch (error) {
    log("POST/GET /api/summary/send - Unexpected error", error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}

