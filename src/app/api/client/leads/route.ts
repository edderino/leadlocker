// src/app/api/client/leads/route.ts

import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { createServerClient } from "@supabase/ssr";
import { createClient as createSupabaseClient } from "@supabase/supabase-js";
import { supabaseAdmin } from "@/libs/supabaseAdmin";

// Ensure this runs on Node runtime and never caches
export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const revalidate = 0;
export const fetchCache = "force-no-store";

function j(data: any, init?: number | ResponseInit) {
  return NextResponse.json(data, typeof init === "number" ? { status: init } : init);
}

export async function GET(req: Request) {
  console.log("➡️  /api/client/leads HIT", new Date().toISOString());

  const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const SUPABASE_ANON = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

  // 1) Try cookie-based session (SSR client) - Next.js 15 requires await
  const cookieStore = await cookies();
  const supabaseSSR = createServerClient(SUPABASE_URL, SUPABASE_ANON, {
    cookies: {
      get(name) {
        return cookieStore.get(name)?.value;
      },
      set(name, value, options) {
        // keep SSR client happy; let Next manage persistence
        try {
          cookieStore.set({ name, value, ...options });
        } catch (e) {
          // Ignore cookie setting errors in API routes
        }
      },
      remove(name, options) {
        try {
          cookieStore.set({ name, value: "", ...options });
        } catch (e) {
          // Ignore cookie removal errors
        }
      },
    },
  });

  let {
    data: { session },
  } = await supabaseSSR.auth.getSession();

  // 2) Fallback to Authorization: Bearer <token> header (SPA fetch)
  let token: string | undefined = session?.access_token;
  if (!token) {
    const rawAuth =
      req.headers.get("authorization") || req.headers.get("Authorization") || "";
    if (rawAuth.toLowerCase().startsWith("bearer ")) {
      token = rawAuth.slice(7).trim();
    }
  }

  console.log("🔐 Auth Header Received:", token ? "✅ Yes" : "❌ No");
  if (token) {
    console.log("🔐 Token (first 30 chars):", token.substring(0, 30) + "...");
  }

  if (!token) {
    return j({ success: false, error: "Missing token" }, { status: 401 });
  }

  // 3) Build a user-scoped client that forwards the JWT (RLS will apply)
  const userClient = createSupabaseClient(SUPABASE_URL, SUPABASE_ANON, {
    global: { headers: { Authorization: `Bearer ${token}` } },
  });

  const { data: userRes, error: userErr } = await userClient.auth.getUser();
  if (userErr || !userRes?.user) {
    console.error("❌ Invalid token:", userErr?.message);
    return j({ success: false, error: "Invalid token" }, { status: 401 });
  }

  // 4) Resolve org_id from metadata or users table (same fallback logic as before)
  let orgId =
    (userRes.user.user_metadata as any)?.org_id ||
    (userRes.user.app_metadata as any)?.org_id;

  // Fallback: query users table if org_id not in metadata
  if (!orgId || typeof orgId !== "string") {
    const { data: userRow, error: userRowError } = await supabaseAdmin
      .from("users")
      .select("client_id")
      .eq("auth_id", userRes.user.id)
      .maybeSingle();

    if (userRowError || !userRow?.client_id) {
      // Try by email as fallback
      if (userRes.user.email) {
        const { data: userByEmail } = await supabaseAdmin
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
    return j({ success: false, error: "No org_id on user" }, { status: 403 });
  }

  console.log("📋 Resolved org_id:", orgId);

  // 5) Fetch leads using user-scoped client (RLS will enforce org_id if policies are set)
  // For now, we'll still filter by org_id defensively since RLS might allow all
  const { data: leads, error } = await userClient
    .from("leads")
    .select("id,name,phone,source,description,status,created_at,org_id")
    .eq("org_id", orgId) // Defensive filter (RLS should also enforce this)
    .order("created_at", { ascending: false })
    .limit(200);

  if (error) {
    console.error("❌ Database error:", error.message);
    return j({ success: false, error: error.message }, { status: 500 });
  }

  console.log("📊 Fetched leads count:", leads?.length || 0, "for org:", orgId);

  return j({ success: true, orgId, leads });
}
