import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/libs/supabaseAdmin';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

/**
 * GET /api/client/leads?orgId=XXX
 * 
 * Returns leads for a specific organization.
 * Requires x-client-token header for authentication.
 */
export async function GET(request: NextRequest) {
  try {
    // 1. Verify CLIENT_PORTAL_SECRET
    const clientToken = request.headers.get('x-client-token');
    const expectedToken = process.env.CLIENT_PORTAL_SECRET;

    if (!expectedToken) {
      console.error('[ClientAPI] CLIENT_PORTAL_SECRET not configured in environment');
      return NextResponse.json(
        { success: false, error: 'Server configuration error' },
        { status: 500 }
      );
    }

    if (!clientToken || clientToken !== expectedToken) {
      console.error('[ClientAPI] Unauthorized access attempt - invalid or missing x-client-token');
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // 2. Get orgId from query params
    const searchParams = request.nextUrl.searchParams;
    const orgId = searchParams.get('orgId');

    if (!orgId) {
      console.error('[ClientAPI] Missing required parameter: orgId');
      return NextResponse.json(
        { success: false, error: 'Missing orgId parameter' },
        { status: 400 }
      );
    }

    console.log('[ClientAPI] Fetching leads for orgId:', orgId);

    // 3. Query leads (read-only)
    const { data: leads, error } = await supabaseAdmin
      .from('leads')
      .select('id, name, phone, source, description, status, created_at')
      .eq('client_id', orgId)
      .order('created_at', { ascending: false })
      .limit(100);

    if (error) {
      console.error('[ClientAPI] Failed to fetch leads:', error);
      return NextResponse.json(
        { success: false, error: 'Failed to fetch leads' },
        { status: 500 }
      );
    }

    const total = leads?.length || 0;
    console.log('[ClientAPI] Successfully fetched', total, 'leads for orgId:', orgId);

    return NextResponse.json({
      success: true,
      orgId,
      total,
      leads: leads || [],
    });

  } catch (error: any) {
    console.error('[ClientAPI] Unexpected error:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: 'Internal server error',
      },
      { status: 500 }
    );
  }
}

