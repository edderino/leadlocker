import { NextRequest, NextResponse } from 'next/server';
import { createClient } from "@supabase/supabase-js";
import { verifyClientSession } from '../../_lib/verifyClientSession';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

/**
 * GET /api/client/leads?orgId=XXX
 *
 * Returns leads for a specific organization.
 * Requires Authorization: Bearer <access_token> header.
 */
export async function GET(request: NextRequest) {
  try {
    const authHeader = request.headers.get('authorization');

    if (!authHeader?.toLowerCase().startsWith('bearer ')) {
      return NextResponse.json(
        { success: false, error: 'Missing authorization header' },
        { status: 401 }
      );
    }

    const token = authHeader.slice('Bearer '.length).trim();

    if (!token) {
      return NextResponse.json(
        { success: false, error: 'Invalid authorization header' },
        { status: 401 }
      );
    }

    const searchParams = request.nextUrl.searchParams;
    const orgId = searchParams.get('orgId');

    if (!orgId) {
      return NextResponse.json(
        { success: false, error: 'Missing orgId parameter' },
        { status: 400 }
      );
    }

    const verification = await verifyClientSession(token);

    if (!verification.ok) {
      return NextResponse.json(
        { success: false, error: verification.error },
        { status: verification.status }
      );
    }

    if (verification.clientId !== orgId) {
      return NextResponse.json(
        { success: false, error: 'Forbidden' },
        { status: 403 }
      );
    }

    const { data: leads, error } = await supabase
      .from('leads')
      .select('id, name, phone, source, description, status, created_at')
      .eq('org_id', orgId)
      .order('created_at', { ascending: false })
      .limit(100);

    if (error) {
      console.error('[ClientAPI] Failed to fetch leads:', error);
      return NextResponse.json(
        { success: false, error: 'Failed to fetch leads' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      orgId,
      total: leads?.length ?? 0,
      leads: leads ?? [],
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
