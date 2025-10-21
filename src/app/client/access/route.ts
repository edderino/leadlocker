import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/libs/supabaseAdmin';
import { verifyInviteToken } from '@/libs/signing';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

/**
 * GET /client/access?token=XXX
 * 
 * Validates invite token, sets authentication cookie, and redirects to client portal.
 */
export async function GET(request: NextRequest) {
  try {
    // 1. Get token from query params
    const searchParams = request.nextUrl.searchParams;
    const token = searchParams.get('token');

    if (!token) {
      console.error('[ClientPortal] Missing token parameter');
      return NextResponse.json(
        { success: false, error: 'Missing invite token' },
        { status: 400 }
      );
    }

    console.log('[ClientPortal] Validating invite token...');

    // 2. Verify token signature and expiration
    const verified = verifyInviteToken(token);

    if (!verified) {
      console.error('[ClientPortal] Invalid or expired token');
      return NextResponse.json(
        { success: false, error: 'Invalid or expired invite token' },
        { status: 401 }
      );
    }

    const { orgId } = verified;
    console.log('[ClientPortal] Token valid for orgId:', orgId);

    // 3. Log invite.accepted event
    const userId = 'c96933ac-8a2b-484b-b9df-8e25d04e7f29'; // System admin
    
    try {
      const { error: eventError } = await supabaseAdmin.from('events').insert({
        event_type: 'invite.accepted',
        lead_id: null,
        actor_id: userId,
        metadata: {
          orgId,
          acceptedAt: new Date().toISOString(),
          userAgent: request.headers.get('user-agent'),
        },
      });

      if (eventError) {
        console.error('[ClientPortal] Failed to log invite.accepted event:', eventError);
      } else {
        console.log('[ClientPortal] Logged invite.accepted event');
      }
    } catch (eventError) {
      console.error('[ClientPortal] Event logging error:', eventError);
    }

    // 4. Set authentication cookie and redirect
    const redirectUrl = new URL(`/client/${orgId}`, request.url);
    const response = NextResponse.redirect(redirectUrl);

    // Set HTTP-only cookie for 7 days
    const isProduction = process.env.NODE_ENV === 'production';
    const cookieOptions = [
      `ll_client_org=${orgId}`,
      'Max-Age=604800', // 7 days
      'Path=/',
      'SameSite=Lax',
      'HttpOnly',
    ];

    // Add Secure flag in production
    if (isProduction) {
      cookieOptions.push('Secure');
    }

    response.headers.set('Set-Cookie', cookieOptions.join('; '));

    console.log('[ClientPortal] Cookie set, redirecting to /client/' + orgId);

    return response;

  } catch (error: any) {
    console.error('[ClientPortal] Unexpected error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}

