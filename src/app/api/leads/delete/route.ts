import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { supabaseAdmin } from "@/libs/supabaseAdmin";
import { log } from "@/libs/log";
import { verifyClientSession } from "../../_lib/verifyClientSession";

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
      console.error("POST /api/leads/delete - Auth error:", verification.error);
      log("POST /api/leads/delete - Auth error", verification.error);
      return NextResponse.json(
        { success: false, error: verification.error },
        { status: 401 }
      );
    }

    if (!verification.user || !verification.user.id) {
      console.error("POST /api/leads/delete - Invalid session: no user");
      return NextResponse.json(
        { success: false, error: "Invalid session" },
        { status: 401 }
      );
    }

    let body;
    try {
      body = await request.json();
    } catch (err) {
      console.error("POST /api/leads/delete - Failed to parse request body:", err);
      return NextResponse.json(
        { success: false, error: "Invalid request body" },
        { status: 400 }
      );
    }

    let payload;
    try {
      payload = DeletePayload.parse(body);
    } catch (err) {
      console.error("POST /api/leads/delete - Validation error:", err);
      return NextResponse.json(
        { success: false, error: "Invalid request data", details: err instanceof z.ZodError ? err.errors : String(err) },
        { status: 400 }
      );
    }

    console.log("POST /api/leads/delete - Delete request", payload.id, "for user", verification.user.id);
    log("POST /api/leads/delete - Delete request", payload.id, "for user", verification.user.id);

    // Resolve client_id for this user
    let clientId = verification.orgId;
    if (!clientId || typeof clientId !== "string") {
      console.log("POST /api/leads/delete - orgId not found, looking up client for user", verification.user.id);
      const { data: clientRow, error: clientRowError } = await supabaseAdmin
        .from("clients")
        .select("id")
        .eq("user_id", verification.user.id)
        .maybeSingle();

      if (clientRowError) {
        console.error("POST /api/leads/delete - Error querying clients:", clientRowError);
        log("POST /api/leads/delete - Error querying clients", clientRowError);
        return NextResponse.json(
          { success: false, error: "Database error resolving client" },
          { status: 500 }
        );
      }

      if (!clientRow) {
        console.error("POST /api/leads/delete - Client not found for user", verification.user.id);
        log("POST /api/leads/delete - Client not found for user", verification.user.id);
        return NextResponse.json(
          { success: false, error: "Client not found" },
          { status: 404 }
        );
      }
      clientId = clientRow.id;
      console.log("POST /api/leads/delete - Resolved clientId:", clientId);
    } else {
      console.log("POST /api/leads/delete - Using orgId as clientId:", clientId);
    }

    // Verify the lead belongs to this client before deleting
    console.log("POST /api/leads/delete - Fetching lead", payload.id);
    const { data: lead, error: fetchError } = await supabaseAdmin
      .from("leads")
      .select("id, client_id")
      .eq("id", payload.id)
      .maybeSingle();

    if (fetchError) {
      console.error("POST /api/leads/delete - Error fetching lead:", fetchError);
      log("POST /api/leads/delete - Error fetching lead", fetchError.message);
      return NextResponse.json(
        { success: false, error: "Failed to verify lead ownership", details: fetchError.message },
        { status: 500 }
      );
    }

    if (!lead) {
      console.error("POST /api/leads/delete - Lead not found:", payload.id);
      log("POST /api/leads/delete - Lead not found", payload.id);
      return NextResponse.json(
        { success: false, error: "Lead not found" },
        { status: 404 }
      );
    }

    console.log("POST /api/leads/delete - Lead found:", { leadId: lead.id, leadClientId: lead.client_id, userClientId: clientId });

    if (lead.client_id !== clientId) {
      console.error("POST /api/leads/delete - Unauthorized: lead belongs to different client", {
        leadClientId: lead.client_id,
        userClientId: clientId,
      });
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
    console.log("POST /api/leads/delete - Deleting lead", payload.id, "for client", clientId);
    const { error, data } = await supabaseAdmin
      .from("leads")
      .delete()
      .eq("id", payload.id)
      .eq("client_id", clientId) // Extra safety: ensure we only delete leads from this client
      .select();

    if (error) {
      console.error("POST /api/leads/delete - Supabase delete error:", error);
      log("POST /api/leads/delete - Supabase error", error.message);
      return NextResponse.json(
        { success: false, error: "Failed to delete lead", details: error.message },
        { status: 500 }
      );
    }

    console.log("POST /api/leads/delete - Lead deleted successfully:", payload.id, "deleted rows:", data?.length || 0);
    log("POST /api/leads/delete - Lead deleted successfully", payload.id);
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("POST /api/leads/delete - Unexpected error:", error);
    if (error instanceof z.ZodError) {
      log("POST /api/leads/delete - Validation error", error.errors);
      return NextResponse.json(
        { success: false, error: "Invalid request data", details: error.errors },
        { status: 400 }
      );
    }

    const errorMessage = error instanceof Error ? error.message : String(error);
    const errorStack = error instanceof Error ? error.stack : undefined;
    console.error("POST /api/leads/delete - Error stack:", errorStack);
    log("POST /api/leads/delete - Unexpected error", errorMessage);
    return NextResponse.json(
      { success: false, error: "Internal server error", details: errorMessage },
      { status: 500 }
    );
  }
}


