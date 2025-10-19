import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/libs/supabaseAdmin';
import { log } from '@/libs/log';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const id = searchParams.get('id');
    log("GET /api/leads/status - Status update request", id);

    if (!id) {
      log("GET /api/leads/status - Missing lead ID");
      return NextResponse.json(
        { error: 'Missing lead ID' },
        { status: 400 }
      );
    }

    // Update lead status to DONE
    const { data, error } = await supabaseAdmin
      .from('leads')
      .update({ status: 'DONE' })
      .eq('id', id)
      .select()
      .single();

    if (error) {
      log("GET /api/leads/status - Supabase error", error.message);
      return NextResponse.json(
        { error: 'Failed to update lead status' },
        { status: 500 }
      );
    }

    log("GET /api/leads/status - Lead status updated successfully", id);
    return NextResponse.json(
      { success: true, lead: data },
      { status: 200 }
    );
  } catch (error) {
    log("GET /api/leads/status - Unexpected error", error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

