// src/app/api/client/leads/route.ts

import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/libs/supabaseAdmin";
import { verifyClientSession } from "../../_lib/verifyClientSession";

// Ensure this runs on Node runtime and never caches
export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const revalidate = 0;
export const fetchCache = "force-no-store";

function j(data: any, init?: number | ResponseInit) {
  return NextResponse.json(data, typeof init === "number" ? { status: init } : init);
}

export async function GET(req: NextRequest) {
  console.log("➡️  /api/client/leads HIT", new Date().toISOString());

  const verification = await verifyClientSession(req);

  if (verification.error) {
    console.error("❌ Auth error:", verification.error);
    return j({ success: false, error: verification.error }, { status: 401 });
  }

  // FIX: hard guard to satisfy TS + runtime safety
  if (!verification || !verification.user || !verification.user.id) {
    return NextResponse.json(
      { success: false, error: "Invalid session" },
      { status: 401 }
    );
  }

  let orgId = verification.orgId;

  // Fallback: query users table if org_id not in metadata
  if (!orgId || typeof orgId !== "string") {
    const { data: userRow, error: userRowError } = await supabaseAdmin
      .from("users")
      .select("client_id")
      .eq("auth_id", verification.user.id)
      .maybeSingle();

    if (userRowError || !userRow?.client_id) {
      // Try by email as fallback
      if (verification.user.email) {
        const { data: userByEmail } = await supabaseAdmin
          .from("users")
          .select("client_id")
          .eq("email", verification.user.email)
          .maybeSingle();

        if (userByEmail?.client_id) {
          orgId = userByEmail.client_id;
        }
      }
    } else {
      orgId = userRow.client_id;
    }
  }

  if (!orgId || typeof orgId !== "string") {
    return j({ success: false, error: "No org_id on user" }, { status: 403 });
  }

  console.log("📋 Resolved org_id:", orgId);

  // Fetch leads using admin client (bypasses RLS, but we filter by org_id defensively)
  const { data: leads, error } = await supabaseAdmin
    .from("leads")
    .select("id,name,phone,source,description,status,created_at,org_id")
    .eq("org_id", orgId)
    .order("created_at", { ascending: false })
    .limit(200);

  if (error) {
    console.error("❌ Database error:", error.message);
    return j({ success: false, error: error.message }, { status: 500 });
  }

  console.log("📊 Fetched leads count:", leads?.length || 0, "for org:", orgId);

  return j({ success: true, orgId, leads });
}
