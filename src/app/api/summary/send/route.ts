import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/libs/supabaseAdmin";
import { sendSMS } from "@/libs/twilio";
import { log } from "@/libs/log";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

// Legacy single-user ID used for Phase 1
const LEGACY_USER_ID = "c96933ac-8a2b-484b-b9df-8e25d04e7f29";

export async function GET(request: NextRequest) {
  return handleSummary(request);
}

export async function POST(request: NextRequest) {
  return handleSummary(request);
}

async function handleSummary(request: NextRequest) {
  try {
    const period = request.nextUrl.searchParams.get("period") || "day"; // day | week | month
    log("POST/GET /api/summary/send - Summary request", { period });

    const userId = LEGACY_USER_ID;

    // Resolve client for this user (Phase 1 is single-client)
    const { data: client, error: clientError } = await supabaseAdmin
      .from("clients")
      .select("id, twilio_to")
      .eq("user_id", userId)
      .maybeSingle();

    if (clientError || !client) {
      log("POST/GET /api/summary/send - Client not found for user", userId);
      return NextResponse.json(
        { success: false, error: "Client not found for summary" },
        { status: 404 }
      );
    }

    // Determine time window
    const now = new Date();
    const from = new Date();

    if (period === "week") {
      from.setDate(from.getDate() - 7);
      from.setHours(0, 0, 0, 0);
    } else if (period === "month") {
      from.setDate(from.getDate() - 30);
      from.setHours(0, 0, 0, 0);
    } else {
      // default: today
      from.setHours(0, 0, 0, 0);
    }

    const { data: leads, error } = await supabaseAdmin
      .from("leads")
      .select("*")
      .eq("client_id", client.id)
      .gte("created_at", from.toISOString())
      .lte("created_at", now.toISOString())
      .order("created_at", { ascending: false });

    if (error) {
      log("POST/GET /api/summary/send - Supabase error", error.message);
      return NextResponse.json(
        { success: false, error: "Failed to fetch leads" },
        { status: 500 }
      );
    }

    // Format summary
    const total = leads?.length || 0;
    const newCount = leads?.filter((l) => l.status === "NEW").length || 0;
    const approvedCount =
      leads?.filter((l) => l.status === "APPROVED").length || 0;
    const completedCount =
      leads?.filter((l) => l.status === "COMPLETED").length || 0;

    const byStatus = {
      NEW: newCount,
      APPROVED: approvedCount,
      COMPLETED: completedCount,
    };

    log("POST/GET /api/summary/send - Summary generated", {
      total,
      byStatus,
      period,
    });

    // Send SMS (keep it <= 140 chars)
    const label =
      period === "week" ? "this week" : period === "month" ? "this month" : "today";
    const smsBody = `Leads ${label}: ${total} (new ${newCount}, ok ${approvedCount}, done ${completedCount})`;

    const recipient =
      client.twilio_to || process.env.LL_DEFAULT_USER_PHONE || null;
    if (recipient) {
      await sendSMS(recipient, smsBody);
      log("POST/GET /api/summary/send - SMS sent", {
        length: smsBody.length,
        recipient,
      });

      // Log SMS event (silent failure)
      try {
        await supabaseAdmin.from("events").insert({
          event_type: "sms.sent",
          lead_id: null, // No specific lead for summary
          actor_id: userId,
          metadata: {
            recipient,
            message_type: `${period}_summary`,
            body_length: smsBody.length,
            summary_data: { total, byStatus },
          },
        });
      } catch (eventError) {
        console.error("[EventLayer] /api/summary/send - SMS event logging failed:", eventError);
      }
    }

    // Log summary.sent event (silent failure)
    try {
      await supabaseAdmin
        .from("events")
        .insert({
          event_type: "summary.sent",
          lead_id: null,
          actor_id: userId,
          metadata: {
            date: from.toISOString().split("T")[0],
            total,
            byStatus,
            recipient: recipient || null,
            period,
          },
        });
    } catch (eventError) {
      console.error("[EventLayer] /api/summary/send - Summary event logging failed:", eventError);
    }

    log("POST/GET /api/summary/send - Summary sent successfully");
    return NextResponse.json({
      success: true,
      total,
      byStatus,
      period,
    });
  } catch (error) {
    log("POST/GET /api/summary/send - Unexpected error", error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}

