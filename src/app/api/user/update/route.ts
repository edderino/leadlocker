import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/libs/supabaseAdmin";
import { verifyClientSession } from "../../_lib/verifyClientSession";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: NextRequest) {
  try {
    const verification = await verifyClientSession(request);

    if (verification.error) {
      return NextResponse.json({ error: verification.error }, { status: 401 });
    }

    // HARD GUARD — required by TS + prevents runtime crash
    if (!verification || !verification.user || !verification.user.id) {
      return NextResponse.json(
        { success: false, error: "Invalid session" },
        { status: 401 }
      );
    }

    const { name, phone } = await request.json();
    const updates: Record<string, string> = {};

    if (typeof name === "string" && name.trim().length > 0) {
      updates.name = name.trim();
    }

    if (typeof phone === "string" && phone.trim().length > 0) {
      updates.phone = phone.trim();
    }

    if (Object.keys(updates).length === 0) {
      return NextResponse.json({ error: "Nothing to update" }, { status: 400 });
    }

    const { error } = await supabaseAdmin
      .from("users")
      .update(updates)
      .eq("auth_id", verification.user.id);

    if (error) {
      throw error;
    }

    return NextResponse.json({ success: true });
  } catch (err: any) {
    console.error("[UserUpdate] Error:", err?.message || err);
    return NextResponse.json({ error: err?.message || "Failed to update profile" }, { status: 500 });
  }
}

