import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/libs/supabaseAdmin';
import { cookies } from 'next/headers';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

/**
 * GET /api/analytics/summary?orgId=XXX
 * 
 * Returns analytics data for a specific organization.
 * Reads orgId from query param or ll_client_org cookie.
 */
export async function GET(request: NextRequest) {
  try {
    // 1. Get orgId from query param or cookie
    const searchParams = request.nextUrl.searchParams;
    let orgId = searchParams.get('orgId');

    if (!orgId) {
      const cookieStore = await cookies();
      const clientOrgCookie = cookieStore.get('ll_client_org');
      orgId = clientOrgCookie?.value || null;
    }

    if (!orgId) {
      console.error('[Analytics] Missing orgId parameter and no cookie');
      return NextResponse.json(
        { success: false, error: 'Missing organization identifier' },
        { status: 400 }
      );
    }

    console.log('[Analytics] Fetching analytics for orgId:', orgId);

    // 2. Query total leads by status
    const { data: leads, error: leadsError } = await supabaseAdmin
      .from('leads')
      .select('id, status, created_at')
      .eq('org_id', orgId);

    if (leadsError) {
      console.error('[Analytics] Failed to fetch leads:', leadsError);
      return NextResponse.json(
        { success: false, error: 'Failed to fetch analytics' },
        { status: 500 }
      );
    }

    const allLeads = leads || [];
    const totalLeads = allLeads.length;
    const approved = allLeads.filter(l => l.status === 'APPROVED').length;
    const completed = allLeads.filter(l => l.status === 'COMPLETED').length;
    const newStatus = allLeads.filter(l => l.status === 'NEW').length;

    // 3. Calculate "new this week" (last 7 days)
    const oneWeekAgo = new Date();
    oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
    
    const newThisWeek = allLeads.filter(l => {
      const createdAt = new Date(l.created_at);
      return createdAt >= oneWeekAgo;
    }).length;

    // 4. Build 7-day trend data
    const trend: { date: string; count: number }[] = [];
    const today = new Date();
    
    for (let i = 6; i >= 0; i--) {
      const date = new Date(today);
      date.setDate(date.getDate() - i);
      date.setHours(0, 0, 0, 0);
      
      const nextDate = new Date(date);
      nextDate.setDate(nextDate.getDate() + 1);
      
      const count = allLeads.filter(l => {
        const createdAt = new Date(l.created_at);
        return createdAt >= date && createdAt < nextDate;
      }).length;
      
      trend.push({
        date: date.toISOString().split('T')[0], // YYYY-MM-DD format
        count,
      });
    }

    console.log('[Analytics] Generated analytics:', { totalLeads, approved, completed, newThisWeek });

    return NextResponse.json({
      success: true,
      orgId,
      totalLeads,
      approved,
      completed,
      newStatus,
      newThisWeek,
      trend,
    });

  } catch (error: any) {
    console.error('[Analytics] Unexpected error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}

