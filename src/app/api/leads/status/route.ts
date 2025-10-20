import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { supabaseAdmin } from '@/libs/supabaseAdmin';
import { log } from '@/libs/log';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

const LeadStatus = z.enum(['NEW', 'APPROVED', 'COMPLETED']);

const UpdateStatusPayload = z.object({
  id: z.string().uuid(),
  status: LeadStatus,
});

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

    // Update lead status to DONE (legacy for SMS links)
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

    // Log event (silent failure)
    try {
      const actorId = data.user_id && typeof data.user_id === "string" ? data.user_id : null;
      
      await supabaseAdmin.from("events").insert({
        event_type: "lead.status_updated",
        lead_id: data.id,
        actor_id: actorId,
        metadata: {
          old_status: data.status, // Note: data already has new status, this is a legacy endpoint
          new_status: "DONE",
          updated_via: "sms_link",
        },
      });
    } catch (eventError) {
      console.error("[EventLayer] GET /api/leads/status - Event logging failed:", eventError);
    }

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

export async function PATCH(request: NextRequest) {
  try {
    const body = await request.json();
    const payload = UpdateStatusPayload.parse(body);
    
    log("PATCH /api/leads/status - Update request", payload.id, payload.status);

    // Get current lead
    const { data: currentLead, error: fetchError } = await supabaseAdmin
      .from('leads')
      .select('*')
      .eq('id', payload.id)
      .single();

    if (fetchError || !currentLead) {
      log("PATCH /api/leads/status - Lead not found", payload.id);
      return NextResponse.json(
        { success: false, error: 'Lead not found' },
        { status: 404 }
      );
    }

    // If target status equals current status, return no-op
    if (currentLead.status === payload.status) {
      log("PATCH /api/leads/status - Status already set", payload.id, payload.status);
      return NextResponse.json({ success: true, lead: currentLead });
    }

    // Validate allowed transitions
    const allowedTransitions: Record<string, string[]> = {
      'NEW': ['APPROVED', 'COMPLETED'],
      'APPROVED': ['COMPLETED'],
      'COMPLETED': [],
    };

    const allowed = allowedTransitions[currentLead.status] || [];
    if (!allowed.includes(payload.status)) {
      log("PATCH /api/leads/status - Invalid transition", currentLead.status, payload.status);
      return NextResponse.json(
        { success: false, error: `Cannot transition from ${currentLead.status} to ${payload.status}` },
        { status: 400 }
      );
    }

    // Update lead status
    const { data, error } = await supabaseAdmin
      .from('leads')
      .update({ status: payload.status })
      .eq('id', payload.id)
      .select()
      .single();

    if (error) {
      log("PATCH /api/leads/status - Supabase error", error.message);
      return NextResponse.json(
        { success: false, error: 'Failed to update lead status' },
        { status: 500 }
      );
    }

    log("PATCH /api/leads/status - Status updated successfully", payload.id, payload.status);

    // Log event (silent failure)
    try {
      const actorId = data.user_id && typeof data.user_id === "string" ? data.user_id : null;
      
      await supabaseAdmin.from("events").insert({
        event_type: "lead.status_updated",
        lead_id: data.id,
        actor_id: actorId,
        metadata: {
          old_status: currentLead.status,
          new_status: payload.status,
          updated_via: "dashboard",
        },
      });
    } catch (eventError) {
      console.error("[EventLayer] PATCH /api/leads/status - Event logging failed:", eventError);
    }

    return NextResponse.json({ success: true, lead: data });
  } catch (error) {
    if (error instanceof z.ZodError) {
      log("PATCH /api/leads/status - Validation error", error.errors);
      return NextResponse.json(
        { success: false, error: 'Invalid request data', details: error.errors },
        { status: 400 }
      );
    }

    log("PATCH /api/leads/status - Unexpected error", error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}

