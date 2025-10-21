import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/libs/supabaseAdmin';
import { log } from '@/libs/log';

// ========================================
// FOLLOW-UP AUTOMATION API ROUTE
// ========================================

/**
 * Follow-Up Trigger API Route
 * 
 * Scans for stale leads (not completed, updated > 48 hours ago) and sends
 * push notifications to organizations with follow-up reminders.
 * 
 * Features:
 * - Scans all leads for stale status
 * - Groups by organization
 * - Sends push notifications via existing system
 * - Logs followup.triggered events
 * - Admin-only access (x-cron-secret required)
 */

interface FollowUpResult {
  orgId: string;
  count: number;
  leadIds: string[];
}

interface FollowUpResponse {
  success: boolean;
  processed: number;
  details: FollowUpResult[];
  error?: string;
}

/**
 * Scan for stale leads and send follow-up reminders
 */
async function processFollowUpReminders(): Promise<FollowUpResponse> {
  try {
    console.log('[FollowUp] Starting follow-up scan...');

    // Query for stale leads (not completed, updated > 48 hours ago)
    const fortyEightHoursAgo = new Date(Date.now() - 48 * 60 * 60 * 1000).toISOString();
    
    const { data: staleLeads, error: leadsError } = await supabaseAdmin
      .from('leads')
      .select('id, org_id, name, phone, status, updated_at, created_at')
      .neq('status', 'completed')
      .lt('updated_at', fortyEightHoursAgo)
      .order('org_id');

    if (leadsError) {
      console.error('[FollowUp] Error fetching stale leads:', leadsError);
      throw new Error('Failed to fetch stale leads');
    }

    if (!staleLeads || staleLeads.length === 0) {
      console.log('[FollowUp] No stale leads found');
      return {
        success: true,
        processed: 0,
        details: []
      };
    }

    console.log(`[FollowUp] Found ${staleLeads.length} stale leads`);

    // Group leads by organization
    const leadsByOrg = staleLeads.reduce((acc, lead) => {
      if (!acc[lead.org_id]) {
        acc[lead.org_id] = [];
      }
      acc[lead.org_id].push(lead);
      return acc;
    }, {} as Record<string, typeof staleLeads>);

    const results: FollowUpResult[] = [];
    let totalProcessed = 0;

    // Process each organization
    for (const [orgId, leads] of Object.entries(leadsByOrg)) {
      try {
        const count = leads.length;
        const leadIds = leads.map(lead => lead.id);

        console.log(`[FollowUp] Processing org ${orgId}: ${count} stale leads`);

        // Log the follow-up trigger event
        await log(`[FollowUp] Triggered for org: ${orgId}, count: ${count}`);

        // Send push notification
        const notificationResult = await sendFollowUpNotification(orgId, count);
        
        if (notificationResult.success) {
          console.log(`[FollowUp] Notification sent to org ${orgId}`);
        } else {
          console.warn(`[FollowUp] Failed to send notification to org ${orgId}:`, notificationResult.error);
        }

        results.push({
          orgId,
          count,
          leadIds
        });

        totalProcessed += count;

      } catch (orgError) {
        console.error(`[FollowUp] Error processing org ${orgId}:`, orgError);
        // Continue with other organizations
      }
    }

    console.log(`[FollowUp] Processed ${totalProcessed} stale leads across ${results.length} organizations`);

    return {
      success: true,
      processed: totalProcessed,
      details: results
    };

  } catch (error) {
    console.error('[FollowUp] Process error:', error);
    return {
      success: false,
      processed: 0,
      details: [],
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }
}

/**
 * Send follow-up notification via existing push notification system
 */
async function sendFollowUpNotification(orgId: string, count: number): Promise<{ success: boolean; error?: string }> {
  try {
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
    const cronSecret = process.env.CRON_SECRET || 'test-secret-12345';

    const response = await fetch(`${baseUrl}/api/notifications/trigger`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-cron-secret': cronSecret
      },
      body: JSON.stringify({
        orgId,
        eventType: 'followup.triggered',
        title: '⏰ Follow-Up Reminder',
        message: `${count} lead${count > 1 ? 's' : ''} need${count === 1 ? 's' : ''} follow-up.`,
        url: `/client/${orgId}`
      })
    });

    const result = await response.json();

    if (!response.ok || !result.success) {
      throw new Error(result.error || 'Failed to send notification');
    }

    return { success: true };

  } catch (error) {
    console.error('[FollowUp] Notification error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown notification error'
    };
  }
}

// ========================================
// API ROUTE HANDLER
// ========================================

/**
 * POST /api/followups/trigger
 * Trigger follow-up reminder scan and notifications
 */
export async function POST(request: NextRequest) {
  try {
    // Check admin authentication
    const cronSecret = request.headers.get('x-cron-secret');
    if (cronSecret !== process.env.CRON_SECRET) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    console.log('[FollowUp] Manual trigger requested');

    const result = await processFollowUpReminders();

    if (result.success) {
      console.log(`[FollowUp] Successfully processed ${result.processed} stale leads`);
    } else {
      console.error('[FollowUp] Processing failed:', result.error);
    }

    return NextResponse.json(result);

  } catch (error) {
    console.error('[FollowUp] POST error:', error);
    return NextResponse.json(
      { 
        success: false,
        processed: 0,
        details: [],
        error: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

/**
 * GET /api/followups/trigger
 * Health check endpoint
 */
export async function GET(request: NextRequest) {
  try {
    // Check admin authentication
    const cronSecret = request.headers.get('x-cron-secret');
    if (cronSecret !== process.env.CRON_SECRET) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Follow-up automation endpoint is active',
      timestamp: new Date().toISOString(),
      endpoint: '/api/followups/trigger'
    });

  } catch (error) {
    console.error('[FollowUp] GET error:', error);
    return NextResponse.json(
      { error: 'Health check failed' },
      { status: 500 }
    );
  }
}
