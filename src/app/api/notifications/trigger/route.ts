import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/libs/supabaseAdmin';
import { z } from 'zod';
import webpush from 'web-push';

// ========================================
// WEB PUSH CONFIGURATION
// ========================================

const VAPID_PUBLIC_KEY = process.env.WEB_PUSH_PUBLIC_KEY;
const VAPID_PRIVATE_KEY = process.env.WEB_PUSH_PRIVATE_KEY;
const VAPID_SUBJECT = process.env.VAPID_SUBJECT || 'mailto:admin@leadlocker.app';

if (VAPID_PUBLIC_KEY && VAPID_PRIVATE_KEY) {
  webpush.setVapidDetails(
    VAPID_SUBJECT,
    VAPID_PUBLIC_KEY,
    VAPID_PRIVATE_KEY
  );
  console.log('[Push:Trigger] Web Push configured with VAPID keys');
} else {
  console.warn('[Push:Trigger] VAPID keys not configured - push notifications disabled');
}

// ========================================
// VALIDATION SCHEMA
// ========================================

const triggerSchema = z.object({
  orgId: z.string().min(1, 'orgId is required'),
  eventType: z.string().min(1, 'eventType is required'),
  title: z.string().min(1, 'title is required'),
  message: z.string().min(1, 'message is required'),
  url: z.string().optional(),
  icon: z.string().optional(),
  badge: z.string().optional(),
  tag: z.string().optional(),
});

// ========================================
// POST /api/notifications/trigger
// ========================================

/**
 * Trigger push notifications for an organization
 * 
 * Required:
 * - Header: x-cron-secret (for admin/cron authentication)
 * - Body: { orgId, eventType, title, message, url?, icon?, badge?, tag? }
 * 
 * Returns:
 * - Success: { success: true, sent: number, failed: number }
 * - Error: { success: false, error: string }
 */
export async function POST(req: NextRequest) {
  try {
    console.log('[Push:Trigger] Request received');

    // ========================================
    // 1. Verify admin authentication
    // ========================================

    const cronSecret = req.headers.get('x-cron-secret');
    const expectedSecret = process.env.CRON_SECRET;

    if (!cronSecret || cronSecret !== expectedSecret) {
      console.error('[Push:Trigger] Auth failed - invalid or missing x-cron-secret');
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // ========================================
    // 2. Check if VAPID keys are configured
    // ========================================

    if (!VAPID_PUBLIC_KEY || !VAPID_PRIVATE_KEY) {
      console.error('[Push:Trigger] VAPID keys not configured');
      return NextResponse.json(
        { success: false, error: 'Push notifications not configured' },
        { status: 503 }
      );
    }

    // ========================================
    // 3. Parse and validate request body
    // ========================================

    const body = await req.json();
    const validation = triggerSchema.safeParse(body);

    if (!validation.success) {
      console.error('[Push:Trigger] Validation failed:', validation.error.errors);
      return NextResponse.json(
        { success: false, error: 'Invalid request data' },
        { status: 400 }
      );
    }

    const { orgId, eventType, title, message, url, icon, badge, tag } = validation.data;

    console.log('[Push:Trigger] Triggering notifications for orgId:', orgId);
    console.log('[Push:Trigger] Event type:', eventType);
    console.log('[Push:Trigger] Title:', title);

    // ========================================
    // 4. Fetch all subscriptions for this org
    // ========================================

    const { data: subscriptions, error: fetchError } = await supabaseAdmin
      .from('push_subscriptions')
      .select('id, endpoint, p256dh, auth')
      .eq('org_id', orgId);

    if (fetchError) {
      console.error('[Push:Trigger] Error fetching subscriptions:', fetchError);
      return NextResponse.json(
        { success: false, error: 'Database error' },
        { status: 500 }
      );
    }

    if (!subscriptions || subscriptions.length === 0) {
      console.log('[Push:Trigger] No subscriptions found for orgId:', orgId);
      return NextResponse.json({
        success: true,
        sent: 0,
        failed: 0,
        message: 'No subscriptions to send to',
      });
    }

    console.log('[Push:Trigger] Found', subscriptions.length, 'subscription(s)');

    // ========================================
    // 5. Prepare notification payload
    // ========================================

    const payload = JSON.stringify({
      title,
      message,
      url: url || `/client/${orgId}`,
      icon: icon || '/icons/icon-192.png',
      badge: badge || '/icons/icon-192.png',
      tag: tag || eventType,
      timestamp: Date.now(),
      data: {
        orgId,
        eventType,
        url: url || `/client/${orgId}`,
      },
    });

    console.log('[Push:Trigger] Payload prepared');

    // ========================================
    // 6. Send push notifications to all subscriptions
    // ========================================

    let sent = 0;
    let failed = 0;
    const failedEndpoints: string[] = [];

    const sendPromises = subscriptions.map(async (subscription) => {
      try {
        const pushSubscription = {
          endpoint: subscription.endpoint,
          keys: {
            p256dh: subscription.p256dh,
            auth: subscription.auth,
          },
        };

        await webpush.sendNotification(pushSubscription, payload);
        sent++;
        console.log('[Push:Trigger] Sent to:', subscription.endpoint.substring(0, 50) + '...');

      } catch (error: any) {
        failed++;
        console.error('[Push:Trigger] Failed to send to:', subscription.endpoint.substring(0, 50), error.message);

        // Track failed endpoints for cleanup
        if (error.statusCode === 410 || error.statusCode === 404) {
          // Subscription no longer valid (Gone or Not Found)
          failedEndpoints.push(subscription.endpoint);
        }
      }
    });

    await Promise.allSettled(sendPromises);

    console.log('[Push:Trigger] Sent:', sent, 'Failed:', failed);

    // ========================================
    // 7. Clean up invalid subscriptions
    // ========================================

    if (failedEndpoints.length > 0) {
      console.log('[Push:Trigger] Cleaning up', failedEndpoints.length, 'invalid subscription(s)');

      const { error: cleanupError } = await supabaseAdmin
        .from('push_subscriptions')
        .delete()
        .in('endpoint', failedEndpoints);

      if (cleanupError) {
        console.error('[Push:Trigger] Cleanup error:', cleanupError);
      } else {
        console.log('[Push:Trigger] Cleanup complete');
      }
    }

    // ========================================
    // 8. Log event to events table
    // ========================================

    await supabaseAdmin.from('events').insert({
      event_type: 'push.sent',
      org_id: orgId,
      metadata: {
        title,
        message,
        event_type: eventType,
        sent_count: sent,
        failed_count: failed,
        total_subscriptions: subscriptions.length,
      },
    });

    console.log('[Push:Trigger] Event logged: push.sent');

    // ========================================
    // 9. Return success response
    // ========================================

    return NextResponse.json({
      success: true,
      sent,
      failed,
      total: subscriptions.length,
      cleaned: failedEndpoints.length,
      message: `Sent ${sent} notification(s), ${failed} failed`,
    });

  } catch (error: any) {
    console.error('[Push:Trigger] Unexpected error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// ========================================
// GET /api/notifications/trigger
// ========================================

/**
 * Get push notification status and configuration
 * (For debugging/testing purposes)
 */
export async function GET(req: NextRequest) {
  try {
    const cronSecret = req.headers.get('x-cron-secret');
    const expectedSecret = process.env.CRON_SECRET;

    if (!cronSecret || cronSecret !== expectedSecret) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    return NextResponse.json({
      success: true,
      configured: !!(VAPID_PUBLIC_KEY && VAPID_PRIVATE_KEY),
      publicKey: VAPID_PUBLIC_KEY ? VAPID_PUBLIC_KEY.substring(0, 20) + '...' : 'Not set',
      subject: VAPID_SUBJECT,
    });

  } catch (error: any) {
    console.error('[Push:Trigger] GET error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}

