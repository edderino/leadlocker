import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { supabaseAdmin } from "@/libs/supabaseAdmin";
import { log } from "@/libs/log";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

const DeletePayload = z.object({
  id: z.string().uuid(),
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const payload = DeletePayload.parse(body);

    log("POST /api/leads/delete - Delete request", payload.id);

    const { error } = await supabaseAdmin
      .from("leads")
      .delete()
      .eq("id", payload.id);

    if (error) {
      log("POST /api/leads/delete - Supabase error", error.message);
      return NextResponse.json(
        { success: false, error: "Failed to delete lead" },
        { status: 500 }
      );
    }

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


