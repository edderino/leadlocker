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
    let verification;
    try {
      verification = await verifyClientSession(request);
    } catch (authErr) {
      console.error("POST /api/leads/delete - verifyClientSession threw exception:", authErr);
      const errorMsg = authErr instanceof Error ? authErr.message : String(authErr);
      return NextResponse.json(
        { success: false, error: "Authentication failed", details: errorMsg },
        { status: 500 }
      );
    }

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

    console.log("POST /api/leads/delete - Lead found:", { 
      leadId: lead.id, 
      leadClientId: lead.client_id, 
      leadClientIdType: typeof lead.client_id,
      userClientId: clientId,
      userClientIdType: typeof clientId,
      areEqual: lead.client_id === clientId,
      areEqualStrict: String(lead.client_id) === String(clientId)
    });

    // Compare as strings to handle UUID comparison issues
    const leadClientIdStr = String(lead.client_id || "");
    const userClientIdStr = String(clientId || "");

    if (leadClientIdStr !== userClientIdStr || !lead.client_id || !clientId) {
      console.error("POST /api/leads/delete - Unauthorized: lead belongs to different client", {
        leadClientId: lead.client_id,
        leadClientIdStr,
        userClientId: clientId,
        userClientIdStr,
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

    // Delete related events first (foreign key constraint)
    console.log("POST /api/leads/delete - Deleting related events for lead", payload.id);
    const { error: eventsDeleteError } = await supabaseAdmin
      .from("events")
      .delete()
      .eq("lead_id", payload.id);

    if (eventsDeleteError) {
      console.error("POST /api/leads/delete - Error deleting events:", eventsDeleteError);
      log("POST /api/leads/delete - Error deleting events", eventsDeleteError.message);
      // Continue anyway - maybe there are no events
    } else {
      console.log("POST /api/leads/delete - Events deleted successfully");
    }

    // Delete the lead - use the client_id we already verified
    console.log("POST /api/leads/delete - Deleting lead", payload.id, "for client", clientId);
    const { error: deleteError } = await supabaseAdmin
      .from("leads")
      .delete()
      .eq("id", payload.id)
      .eq("client_id", clientId); // Extra safety: ensure we only delete leads from this client

    if (deleteError) {
      console.error("POST /api/leads/delete - Supabase delete error:", deleteError);
      log("POST /api/leads/delete - Supabase error", deleteError.message);
      return NextResponse.json(
        { success: false, error: "Failed to delete lead", details: deleteError.message },
        { status: 500 }
      );
    }

    // Verify the lead was actually deleted by checking if it still exists
    const { data: verifyLead, error: verifyError } = await supabaseAdmin
      .from("leads")
      .select("id")
      .eq("id", payload.id)
      .maybeSingle();

    if (verifyError) {
      console.error("POST /api/leads/delete - Error verifying deletion:", verifyError);
      // Don't fail here - the delete might have worked but verification failed
    }

    if (verifyLead) {
      console.error("POST /api/leads/delete - Lead still exists after delete attempt");
      return NextResponse.json(
        { success: false, error: "Lead was not deleted. It may not belong to your account." },
        { status: 500 }
      );
    }

    console.log("POST /api/leads/delete - Lead deleted successfully:", payload.id);
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


