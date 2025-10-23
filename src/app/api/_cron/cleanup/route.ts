import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/libs/supabaseAdmin';
import { log } from '@/libs/log';
import { notifyAdmin } from '@/libs/notifyAdmin';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export async function GET(request: NextRequest) {
  return handleCleanupCron(request);
}

export async function POST(request: NextRequest) {
  return handleCleanupCron(request);
}

async function handleCleanupCron(request: NextRequest) {
  try {
    // 1. Verify CRON_SECRET
    const cronSecret = request.headers.get('x-cron-secret');
    const expectedSecret = process.env.CRON_SECRET;

    if (!expectedSecret) {
      console.error('[Cleanup] CRON_SECRET not configured in environment');
      return NextResponse.json(
        { success: false, error: 'Server configuration error' },
        { status: 500 }
      );
    }

    if (!cronSecret || cronSecret !== expectedSecret) {
      console.error('[Cleanup] Unauthorized access attempt - invalid or missing x-cron-secret');
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    log('[Cleanup] /api/_cron/cleanup - Starting cleanup job');

    // 2. Get retention periods from environment (with defaults)
    const leadRetentionDays = parseInt(process.env.CLEANUP_LEAD_RETENTION_DAYS || '30');
    const eventRetentionDays = parseInt(process.env.CLEANUP_EVENT_RETENTION_DAYS || '60');

    log('[Cleanup] Retention periods', { leadRetentionDays, eventRetentionDays });

    // 3. Calculate cutoff dates
    const cutoffLeads = new Date();
    cutoffLeads.setDate(cutoffLeads.getDate() - leadRetentionDays);

    const eventCutoffDate = new Date();
    eventCutoffDate.setDate(eventCutoffDate.getDate() - eventRetentionDays);

    log('[Cleanup] Cutoff dates', {
      leads: cutoffLeads.toISOString(),
      events: eventCutoffDate.toISOString(),
    });

    // 4. Delete old completed leads
    const { data: deletedLeads, error: leadsError } = await supabaseAdmin
      .from('leads')
      .delete()
      .lt('created_at', cutoffLeads.toISOString())
      .in('status', ['COMPLETED'])
      .select();

    if (leadsError) {
      console.error('[Cleanup] Failed to delete old leads:', leadsError);
      throw new Error(`Failed to delete leads: ${leadsError.message}`);
    }

    const leadsDeleted = deletedLeads?.length || 0;
    log('[Cleanup] Deleted old leads', { count: leadsDeleted });

    // 5. Delete old events
    const { data: eventsToDelete, error: eventSelectError } = await supabaseAdmin
      .from('events')
      .select('id, event_type, created_at')
      .lt('created_at', eventCutoffDate.toISOString());

    if (eventSelectError) {
      console.error('[Cleanup] Failed to query old events:', eventSelectError);
      throw new Error(`Failed to query events: ${eventSelectError.message}`);
    }

    const eventsDeleted = eventsToDelete?.length || 0;

    if (eventsDeleted > 0) {
      const eventIds = eventsToDelete.map((event) => event.id);
      
      const { error: eventDeleteError } = await supabaseAdmin
        .from('events')
        .delete()
        .in('id', eventIds);

      if (eventDeleteError) {
        console.error('[Cleanup] Failed to delete old events:', eventDeleteError);
        throw new Error(`Failed to delete events: ${eventDeleteError.message}`);
      }

      log('[Cleanup] Deleted old events', { count: eventsDeleted });
    } else {
      log('[Cleanup] No old events to delete');
    }

    // 6. Log cleanup.run event
    const userId = 'c96933ac-8a2b-484b-b9df-8e25d04e7f29';

    try {
      const { error: cleanupEventError } = await supabaseAdmin.from('events').insert({
        event_type: 'cleanup.run',
        lead_id: null,
        actor_id: userId,
        metadata: {
          leads_deleted: leadsDeleted,
          events_deleted: eventsDeleted,
          lead_retention_days: leadRetentionDays,
          event_retention_days: eventRetentionDays,
          lead_cutoff_date: cutoffLeads.toISOString(),
          event_cutoff_date: eventCutoffDate.toISOString(),
          triggered_by: 'cron',
        },
      });

      if (cleanupEventError) {
        console.error('[Cleanup] Failed to log cleanup.run event:', cleanupEventError);
      } else {
        log('[Cleanup] Logged cleanup.run event');
      }
    } catch (eventError) {
      console.error('[Cleanup] Event logging error:', eventError);
    }

    log('[Cleanup] Cleanup job completed successfully', { leadsDeleted, eventsDeleted });

    return NextResponse.json({
      success: true,
      leadsDeleted,
      eventsDeleted,
      timestamp: new Date().toISOString(),
      retention: {
        leadDays: leadRetentionDays,
        eventDays: eventRetentionDays,
      },
    });

  } catch (error: any) {
    console.error('[Cleanup] Cleanup job failed:', error);
    
    // Notify admin of the error
    await notifyAdmin('/api/_cron/cleanup', error);
    
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

