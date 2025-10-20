import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/libs/supabaseAdmin';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

/**
 * GET /api/events/recent
 * 
 * Fetches recent events for the activity feed.
 * Supports filtering by type and limiting results.
 * 
 * Query params:
 * - limit: number of events to return (default: 50, max: 100)
 * - type: filter by event_type (optional)
 */
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const limitParam = searchParams.get('limit');
    const typeFilter = searchParams.get('type');

    // Parse and validate limit
    let limit = 50;
    if (limitParam) {
      const parsed = parseInt(limitParam);
      if (!isNaN(parsed) && parsed > 0 && parsed <= 100) {
        limit = parsed;
      }
    }

    // Build query
    let query = supabaseAdmin
      .from('events')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(limit);

    // Add type filter if provided
    if (typeFilter) {
      query = query.eq('event_type', typeFilter);
    }

    const { data: events, error } = await query;

    if (error) {
      console.error('[Events API] Failed to fetch events:', error);
      return NextResponse.json(
        { success: false, error: 'Failed to fetch events' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      events: events || [],
      count: events?.length || 0,
    });

  } catch (error: any) {
    console.error('[Events API] Unexpected error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}

