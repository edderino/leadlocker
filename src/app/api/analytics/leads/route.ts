import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/libs/supabaseAdmin';
import { verifyClientSession } from '../../_lib/verifyClientSession';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const orgId = request.nextUrl.searchParams.get('orgId');

    if (!orgId) {
      return NextResponse.json({ success: false, error: 'Missing orgId parameter' }, { status: 400 });
    }

    const verification = await verifyClientSession(request);

    if (verification.error) {
      return NextResponse.json({ success: false, error: verification.error }, { status: 401 });
    }

    if (verification.orgId !== orgId) {
      return NextResponse.json({ success: false, error: 'Forbidden' }, { status: 403 });
    }

    const { data, error } = await supabaseAdmin
      .from('leads')
      .select('status, source')
      .eq('org_id', orgId);

    if (error) {
      console.error('[AnalyticsAPI] Failed to fetch analytics leads:', error);
      return NextResponse.json({ success: false, error: 'Failed to fetch analytics data' }, { status: 500 });
    }

    return NextResponse.json({ success: true, leads: data ?? [] });
  } catch (error: any) {
    console.error('[AnalyticsAPI] Unexpected error:', error);
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 });
  }
}

