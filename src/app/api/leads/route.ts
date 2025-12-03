import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/libs/supabaseAdmin";
import { log } from "@/libs/log";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function GET(request: NextRequest) {
  try {
    console.log("📋 Fetching leads via API route");

    // ---------------------------------------------
    // 1. Resolve current user from cookies (session)
    // ---------------------------------------------
    const token =
      request.cookies.get("ll_session")?.value ||
      request.cookies.get("sb-access-token")?.value;

    if (!token) {
      return NextResponse.json(
        { error: "Not authenticated" },
        { status: 401 }
      );
    }

    const {
      data: authData,
      error: authError,
    } = await supabaseAdmin.auth.getUser(token);

    if (authError || !authData?.user) {
      log("GET /api/leads - Invalid session", authError || "no user");
      return NextResponse.json(
        { error: "Invalid session" },
        { status: 401 }
      );
    }

    const userId = authData.user.id;

    // ---------------------------------------------
    // 2. Find client row for this user
    // ---------------------------------------------
    const { data: client, error: clientError } = await supabaseAdmin
      .from("clients")
      .select("id")
      .eq("user_id", userId)
      .maybeSingle();

    if (clientError || !client) {
      log("GET /api/leads - Client not found for user", userId);
      return NextResponse.json(
        { error: "Client not found" },
        { status: 404 }
      );
    }

    // ---------------------------------------------
    // 3. Fetch leads for this client only
    // ---------------------------------------------
    const { data: leads, error } = await supabaseAdmin
      .from("leads")
      .select("*")
      .eq("client_id", client.id)
      .order("created_at", { ascending: false });

    if (error) {
      log("GET /api/leads - Supabase error", error.message);
      return NextResponse.json(
        { error: "Failed to fetch leads" },
        { status: 500 }
      );
    }

    log("GET /api/leads - Successfully fetched leads", leads?.length || 0);
    return NextResponse.json(leads || []);
  } catch (error) {
    log("GET /api/leads - Unexpected error", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

