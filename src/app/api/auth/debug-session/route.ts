import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { createClient } from "@supabase/supabase-js";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * Debug endpoint to check current session
 * Helps diagnose login issues
 */
export async function GET() {
  try {
    const cookieStore = await cookies();
    const token =
      cookieStore.get("ll_session")?.value ||
      cookieStore.get("sb-access-token")?.value;

    if (!token) {
      return NextResponse.json({
        hasSession: false,
        message: "No session token found in cookies",
        cookies: {
          ll_session: cookieStore.get("ll_session")?.value ? "present" : "missing",
          sb_access_token: cookieStore.get("sb-access-token")?.value ? "present" : "missing",
        },
      });
    }

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
    const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

    if (!supabaseUrl || !serviceKey) {
      return NextResponse.json({
        error: "Server auth not configured",
      }, { status: 500 });
    }

    const admin = createClient(supabaseUrl, serviceKey, {
      auth: { persistSession: false },
    });

    const {
      data: userRes,
      error: userErr,
    } = await admin.auth.getUser(token);

    if (userErr || !userRes?.user) {
      return NextResponse.json({
        hasSession: false,
        error: "Invalid token",
        tokenError: userErr?.message,
      });
    }

    const userId = userRes.user.id;
    const userEmail = userRes.user.email;

    // Get client data
    const { data: client } = await admin
      .from("clients")
      .select("*")
      .eq("user_id", userId)
      .maybeSingle();

    return NextResponse.json({
      hasSession: true,
      user: {
        id: userId,
        email: userEmail,
        created_at: userRes.user.created_at,
        providers: userRes.user.app_metadata?.providers || [],
      },
      client: client ? {
        id: client.id,
        business_name: client.business_name,
        owner_name: client.owner_name,
        contact_email: client.contact_email,
      } : null,
      cookies: {
        ll_session: cookieStore.get("ll_session")?.value ? "present" : "missing",
        sb_access_token: cookieStore.get("sb-access-token")?.value ? "present" : "missing",
      },
    });
  } catch (err: any) {
    return NextResponse.json({
      error: "Server error",
      message: err.message,
    }, { status: 500 });
  }
}

