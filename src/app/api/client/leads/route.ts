// src/app/api/client/leads/route.ts

import { NextResponse } from "next/server";

import { createClient } from "@supabase/supabase-js";



export const dynamic = "force-dynamic";

export const revalidate = 0;

export const fetchCache = "force-no-store";

export const runtime = 'nodejs';



const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;

const SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!;



// Strict JSON response helper

function json(status: number, body: any) {

  return NextResponse.json(body, { status });

}



/**

 * Production-grade leads fetch:

 * - Requires Authorization: Bearer <supabase_jwt>

 * - Verifies the token against Supabase (no home-rolled auth)

 * - Derives org_id from the token's user_metadata

 * - Uses service role key for DB read (bypasses RLS safely on server)

 * - Filters by org_id to enforce tenant isolation

 */

export async function GET(req: Request) {
  console.log("➡️  /api/client/leads HIT", new Date().toISOString());
  
  const authHeader = req.headers.get("Authorization");
  console.log("🔐 Auth Header Received:", authHeader ? "✅ Yes" : "❌ No");
  if (authHeader) {
    console.log("🔐 Auth Header (first 30 chars):", authHeader.substring(0, 30) + "...");
  }

  try {

    // 1) Require Supabase JWT from the browser session
    if (!authHeader?.startsWith("Bearer ")) {
      return json(401, { success: false, error: "Missing or invalid Authorization header" });
    }

    const jwt = authHeader.split(" ")[1];



    // 2) Build admin client and verify user from JWT

    const admin = createClient(SUPABASE_URL, SERVICE_KEY, {

      auth: { persistSession: false }

    });



    const { data: userRes, error: userErr } = await admin.auth.getUser(jwt);

    if (userErr || !userRes?.user) {

      return json(401, { success: false, error: "Unauthorized" });

    }



    // 3) Resolve org from user metadata, or fall back to users table

    let orgId =

      (userRes.user.user_metadata as any)?.org_id ??

      (userRes.user.app_metadata as any)?.org_id;



    // Fallback: query users table if org_id not in metadata

    if (!orgId || typeof orgId !== "string") {

      const { data: userRow, error: userRowError } = await admin

        .from("users")

        .select("client_id")

        .eq("auth_id", userRes.user.id)

        .maybeSingle();



      if (userRowError || !userRow?.client_id) {

        // Try by email as fallback

        if (userRes.user.email) {

          const { data: userByEmail } = await admin

            .from("users")

            .select("client_id")

            .eq("email", userRes.user.email)

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

      return json(400, { success: false, error: "Missing org_id in user metadata or users table" });

    }



    // 4) Query leads for this org (service role bypasses RLS; still filter defensively)

    const { data: leads, error: leadsErr } = await admin

      .from("leads")

      .select("*")

      .eq("org_id", orgId)

      .order("created_at", { ascending: false });

    console.log("📊 Fetched leads count:", leads?.length || 0, "for org:", orgId);

    if (leadsErr) {

      console.error("❌ Database error:", leadsErr.message);

      return json(500, { success: false, error: "Database error", detail: leadsErr.message });

    }



    return json(200, { success: true, orgId, leads });

  } catch (e: any) {

    return json(500, { success: false, error: "Server error", detail: e?.message ?? String(e) });

  }

}
