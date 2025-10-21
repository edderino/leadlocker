import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { supabaseAdmin } from '@/libs/supabaseAdmin';
import { z } from 'zod';

// ========================================
// VALIDATION SCHEMA
// ========================================

const subscribeSchema = z.object({
  orgId: z.string().min(1, 'orgId is required'),
  subscription: z.object({
    endpoint: z.string().url('Invalid endpoint URL'),
    keys: z.object({
      p256dh: z.string().min(1, 'p256dh key is required'),
      auth: z.string().min(1, 'auth key is required'),
    }),
  }),
});

// ========================================
// POST /api/notifications/subscribe
// ========================================

/**
 * Subscribe to push notifications
 * 
 * Required:
 * - Cookie: ll_client_org must match the orgId
 * - Body: { orgId, subscription }
 * 
 * Returns:
 * - Success: { success: true, subscriptionId }
 * - Error: { success: false, error: string }
 */
export async function POST(req: NextRequest) {
  try {
    console.log('[Push:Subscribe] Request received');

    // ========================================
    // 1. Parse and validate request body
    // ========================================

    const body = await req.json();
    const validation = subscribeSchema.safeParse(body);

    if (!validation.success) {
      console.error('[Push:Subscribe] Validation failed:', validation.error.errors);
      return NextResponse.json(
        { success: false, error: 'Invalid request data' },
        { status: 400 }
      );
    }

    const { orgId, subscription } = validation.data;
    const { endpoint, keys } = subscription;

    console.log('[Push:Subscribe] Subscription request for orgId:', orgId);
    console.log('[Push:Subscribe] Endpoint:', endpoint.substring(0, 50) + '...');

    // ========================================
    // 2. Verify authentication (cookie must match orgId)
    // ========================================

    const cookieStore = await cookies();
    const clientOrgCookie = cookieStore.get('ll_client_org');

    if (!clientOrgCookie || clientOrgCookie.value !== orgId) {
      console.error('[Push:Subscribe] Auth failed - cookie mismatch');
      return NextResponse.json(
        { success: false, error: 'Unauthorized - invalid session' },
        { status: 401 }
      );
    }

    console.log('[Push:Subscribe] Auth verified for orgId:', orgId);

    // ========================================
    // 3. Check if subscription already exists
    // ========================================

    const { data: existing, error: checkError } = await supabaseAdmin
      .from('push_subscriptions')
      .select('id, org_id')
      .eq('endpoint', endpoint)
      .maybeSingle();

    if (checkError) {
      console.error('[Push:Subscribe] Database check error:', checkError);
      return NextResponse.json(
        { success: false, error: 'Database error' },
        { status: 500 }
      );
    }

    // ========================================
    // 4. Update existing or insert new subscription
    // ========================================

    if (existing) {
      console.log('[Push:Subscribe] Subscription exists, updating org_id if needed');

      // If subscription exists but for different org, update it
      if (existing.org_id !== orgId) {
        const { error: updateError } = await supabaseAdmin
          .from('push_subscriptions')
          .update({
            org_id: orgId,
            p256dh: keys.p256dh,
            auth: keys.auth,
            updated_at: new Date().toISOString(),
          })
          .eq('endpoint', endpoint);

        if (updateError) {
          console.error('[Push:Subscribe] Update error:', updateError);
          return NextResponse.json(
            { success: false, error: 'Failed to update subscription' },
            { status: 500 }
          );
        }

        console.log('[Push:Subscribe] Subscription updated:', existing.id);
      } else {
        console.log('[Push:Subscribe] Subscription already exists for this org:', existing.id);
      }

      // Log event
      await supabaseAdmin.from('events').insert({
        event_type: 'push.subscribed',
        org_id: orgId,
        metadata: {
          subscription_id: existing.id,
          endpoint_preview: endpoint.substring(0, 50),
          action: 'resubscribed',
        },
      });

      return NextResponse.json({
        success: true,
        subscriptionId: existing.id,
        message: 'Subscription updated',
      });
    }

    // ========================================
    // 5. Insert new subscription
    // ========================================

    const { data: newSubscription, error: insertError } = await supabaseAdmin
      .from('push_subscriptions')
      .insert({
        org_id: orgId,
        endpoint: endpoint,
        p256dh: keys.p256dh,
        auth: keys.auth,
      })
      .select('id')
      .single();

    if (insertError) {
      console.error('[Push:Subscribe] Insert error:', insertError);
      return NextResponse.json(
        { success: false, error: 'Failed to save subscription' },
        { status: 500 }
      );
    }

    console.log('[Push:Subscribe] New subscription created:', newSubscription.id);

    // ========================================
    // 6. Log event to events table
    // ========================================

    await supabaseAdmin.from('events').insert({
      event_type: 'push.subscribed',
      org_id: orgId,
      metadata: {
        subscription_id: newSubscription.id,
        endpoint_preview: endpoint.substring(0, 50),
        action: 'new',
      },
    });

    console.log('[Push:Subscribe] Event logged: push.subscribed');

    // ========================================
    // 7. Return success response
    // ========================================

    return NextResponse.json({
      success: true,
      subscriptionId: newSubscription.id,
      message: 'Successfully subscribed to push notifications',
    });

  } catch (error: any) {
    console.error('[Push:Subscribe] Unexpected error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// ========================================
// DELETE /api/notifications/subscribe
// ========================================

/**
 * Unsubscribe from push notifications
 * 
 * Required:
 * - Cookie: ll_client_org must match the orgId
 * - Body: { orgId, endpoint }
 * 
 * Returns:
 * - Success: { success: true }
 * - Error: { success: false, error: string }
 */
export async function DELETE(req: NextRequest) {
  try {
    console.log('[Push:Unsubscribe] Request received');

    // ========================================
    // 1. Parse request body
    // ========================================

    const body = await req.json();
    const { orgId, endpoint } = body;

    if (!orgId || !endpoint) {
      return NextResponse.json(
        { success: false, error: 'Missing orgId or endpoint' },
        { status: 400 }
      );
    }

    console.log('[Push:Unsubscribe] Unsubscribe request for orgId:', orgId);

    // ========================================
    // 2. Verify authentication
    // ========================================

    const cookieStore = await cookies();
    const clientOrgCookie = cookieStore.get('ll_client_org');

    if (!clientOrgCookie || clientOrgCookie.value !== orgId) {
      console.error('[Push:Unsubscribe] Auth failed - cookie mismatch');
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // ========================================
    // 3. Delete subscription
    // ========================================

    const { error: deleteError } = await supabaseAdmin
      .from('push_subscriptions')
      .delete()
      .eq('endpoint', endpoint)
      .eq('org_id', orgId);

    if (deleteError) {
      console.error('[Push:Unsubscribe] Delete error:', deleteError);
      return NextResponse.json(
        { success: false, error: 'Failed to unsubscribe' },
        { status: 500 }
      );
    }

    console.log('[Push:Unsubscribe] Subscription deleted');

    // ========================================
    // 4. Log event
    // ========================================

    await supabaseAdmin.from('events').insert({
      event_type: 'push.unsubscribed',
      org_id: orgId,
      metadata: {
        endpoint_preview: endpoint.substring(0, 50),
      },
    });

    console.log('[Push:Unsubscribe] Event logged: push.unsubscribed');

    // ========================================
    // 5. Return success
    // ========================================

    return NextResponse.json({
      success: true,
      message: 'Successfully unsubscribed from push notifications',
    });

  } catch (error: any) {
    console.error('[Push:Unsubscribe] Unexpected error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}

