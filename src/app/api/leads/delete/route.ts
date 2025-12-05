import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { supabaseAdmin } from "@/libs/supabaseAdmin";
import { log } from "@/libs/log";
import { verifyClientSession } from "../_lib/verifyClientSession";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

const DeletePayload = z.object({
  id: z.string().uuid(),
});

export async function POST(request: NextRequest) {
  try {
    // Authenticate user
    const verification = await verifyClientSession(request);
    if (verification.error) {
      log("POST /api/leads/delete - Auth error", verification.error);
      return NextResponse.json(
        { success: false, error: verification.error },
        { status: 401 }
      );
    }

    if (!verification.user || !verification.user.id) {
      return NextResponse.json(
        { success: false, error: "Invalid session" },
        { status: 401 }
      );
    }

    const body = await request.json();
    const payload = DeletePayload.parse(body);

    log("POST /api/leads/delete - Delete request", payload.id, "for user", verification.user.id);

    // Resolve client_id for this user
    let clientId = verification.orgId;
    if (!clientId || typeof clientId !== "string") {
      const { data: clientRow, error: clientRowError } = await supabaseAdmin
        .from("clients")
        .select("id")
        .eq("user_id", verification.user.id)
        .maybeSingle();

      if (clientRowError || !clientRow) {
        log("POST /api/leads/delete - Client not found for user", verification.user.id);
        return NextResponse.json(
          { success: false, error: "Client not found" },
          { status: 404 }
        );
      }
      clientId = clientRow.id;
    }

    // Verify the lead belongs to this client before deleting
    const { data: lead, error: fetchError } = await supabaseAdmin
      .from("leads")
      .select("id, client_id")
      .eq("id", payload.id)
      .maybeSingle();

    if (fetchError) {
      log("POST /api/leads/delete - Error fetching lead", fetchError.message);
      return NextResponse.json(
        { success: false, error: "Failed to verify lead ownership" },
        { status: 500 }
      );
    }

    if (!lead) {
      log("POST /api/leads/delete - Lead not found", payload.id);
      return NextResponse.json(
        { success: false, error: "Lead not found" },
        { status: 404 }
      );
    }

    if (lead.client_id !== clientId) {
      log("POST /api/leads/delete - Unauthorized: lead belongs to different client", {
        leadClientId: lead.client_id,
        userClientId: clientId,
      });
      return NextResponse.json(
        { success: false, error: "Unauthorized: lead does not belong to your account" },
        { status: 403 }
      );
    }

    // Delete the lead
    const { error } = await supabaseAdmin
      .from("leads")
      .delete()
      .eq("id", payload.id)
      .eq("client_id", clientId); // Extra safety: ensure we only delete leads from this client

    if (error) {
      log("POST /api/leads/delete - Supabase error", error.message);
      return NextResponse.json(
        { success: false, error: "Failed to delete lead" },
        { status: 500 }
      );
    }

    log("POST /api/leads/delete - Lead deleted successfully", payload.id);
    return NextResponse.json({ success: true });
  } catch (error) {
    if (error instanceof z.ZodError) {
      log("POST /api/leads/delete - Validation error", error.errors);
      return NextResponse.json(
        { success: false, error: "Invalid request data", details: error.errors },
        { status: 400 }
      );
    }

    log("POST /api/leads/delete - Unexpected error", error);
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 }
    );
  }
}


