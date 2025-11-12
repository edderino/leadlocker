// src/app/api/client/leads/route.ts

import { NextResponse } from "next/server";

import { createClient } from "@supabase/supabase-js";



export const dynamic = 'force-dynamic';

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

  try {

    // 1) Require Supabase JWT from the browser session

    const authHeader = req.headers.get("authorization");

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



    // 3) Resolve org from user metadata

    const orgId =

      (userRes.user.user_metadata as any)?.org_id ??

      (userRes.user.app_metadata as any)?.org_id;



    if (!orgId || typeof orgId !== "string") {

      return json(400, { success: false, error: "Missing org_id in user metadata" });

    }



    // 4) Query leads for this org (service role bypasses RLS; still filter defensively)

    const { data: leads, error: leadsErr } = await admin

      .from("leads")

      .select("*")

      .eq("org_id", orgId)

      .order("created_at", { ascending: false });



    if (leadsErr) {

      return json(500, { success: false, error: "Database error", detail: leadsErr.message });

    }



    return json(200, { success: true, orgId, leads });

  } catch (e: any) {

    return json(500, { success: false, error: "Server error", detail: e?.message ?? String(e) });

  }

}
