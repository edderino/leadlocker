import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/libs/supabaseAdmin';
import { sendSMS } from '@/libs/twilio';
import { createInviteToken } from '@/libs/signing';
import { z } from 'zod';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

const InviteRequestSchema = z.object({
  orgId: z.string().min(1, 'orgId is required'),
  phone: z.string().regex(/^\+[1-9]\d{1,14}$/, 'Phone must be in E.164 format (+1234567890)'),
  ttlHours: z.number().positive().optional().default(24),
});

/**
 * POST /api/client/invite
 * 
 * Generate a signed invite link for a client organization and send via SMS.
 * Requires admin authentication via x-admin-secret header.
 */
export async function POST(request: NextRequest) {
  try {
    // 1. Verify admin authentication
    const adminSecret = request.headers.get('x-admin-secret');
    const expectedSecret = process.env.CRON_SECRET; // Reusing CRON_SECRET for now

    if (!expectedSecret) {
      console.error('[ClientAPI] CRON_SECRET not configured');
      return NextResponse.json(
        { success: false, error: 'Server configuration error' },
        { status: 500 }
      );
    }

    if (!adminSecret || adminSecret !== expectedSecret) {
      console.error('[ClientAPI] Unauthorized invite attempt');
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // 2. Parse and validate request body
    const body = await request.json();
    const validation = InviteRequestSchema.safeParse(body);

    if (!validation.success) {
      console.error('[ClientAPI] Invalid request body:', validation.error.flatten());
      return NextResponse.json(
        { 
          success: false, 
          error: 'Invalid request',
          details: validation.error.flatten().fieldErrors,
        },
        { status: 400 }
      );
    }

    const { orgId, phone, ttlHours } = validation.data;

    console.log('[ClientAPI] Creating invite for orgId:', orgId, 'phone:', phone);

    // 3. Generate signed invite token
    let token: string;
    try {
      token = createInviteToken(orgId, ttlHours);
    } catch (error: any) {
      console.error('[ClientAPI] Failed to create token:', error);
      return NextResponse.json(
        { success: false, error: 'Failed to generate invite token' },
        { status: 500 }
      );
    }

    // 4. Build invite link
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
    const inviteLink = `${baseUrl}/client/access?token=${token}`;

    console.log('[ClientAPI] Generated invite link:', inviteLink);

    // 5. Send SMS
    const smsBody = `LeadLocker access: ${inviteLink} (expires in ${ttlHours}h)`;
    
    try {
      const smsResult = await sendSMS(phone, smsBody);
      
      if (smsResult && 'error' in smsResult) {
        console.error('[ClientAPI] SMS send failed:', smsResult.error);
        // Continue anyway - return the link even if SMS fails
      } else {
        console.log('[ClientAPI] SMS sent successfully to', phone);
      }
    } catch (smsError) {
      console.error('[ClientAPI] SMS error:', smsError);
      // Continue anyway
    }

    // 6. Log invite.sent event
    const userId = 'c96933ac-8a2b-484b-b9df-8e25d04e7f29'; // System admin
    
    try {
      const { error: eventError } = await supabaseAdmin.from('events').insert({
        event_type: 'invite.sent',
        lead_id: null,
        actor_id: userId,
        metadata: {
          orgId,
          phone,
          ttlHours,
          sentAt: new Date().toISOString(),
        },
      });

      if (eventError) {
        console.error('[ClientAPI] Failed to log invite.sent event:', eventError);
      } else {
        console.log('[ClientAPI] Logged invite.sent event');
      }
    } catch (eventError) {
      console.error('[ClientAPI] Event logging error:', eventError);
    }

    console.log('[ClientAPI] Invite created successfully');

    return NextResponse.json({
      success: true,
      link: inviteLink,
      orgId,
      expiresIn: `${ttlHours} hours`,
    });

  } catch (error: any) {
    console.error('[ClientAPI] Unexpected error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}

