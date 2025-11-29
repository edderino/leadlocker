import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { createClient } from "@supabase/supabase-js";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const cookieStore = await cookies();
    // Check both cookies, matching middleware and layout logic
    const token =
      cookieStore.get("ll_session")?.value ||
      cookieStore.get("sb-access-token")?.value;

    if (!token) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
    const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

    if (!supabaseUrl || !serviceKey) {
      return NextResponse.json(
        { error: "Server auth not configured" },
        { status: 500 }
      );
    }

    // Admin client: verify user from access token
    const admin = createClient(supabaseUrl, serviceKey, {
      auth: { persistSession: false },
    });

    const {
      data: userRes,
      error: userErr,
    } = await admin.auth.getUser(token);

    if (userErr || !userRes?.user) {
      return NextResponse.json({ error: "Invalid session" }, { status: 401 });
    }

    const userId = userRes.user.id;

    // Fetch client row for this auth user
    const { data: client, error } = await admin
      .from("clients")
      .select("*")
      .eq("user_id", userId)
      .maybeSingle();

    if (error || !client) {
      return NextResponse.json({ error: "No client for user" }, { status: 401 });
    }

    return NextResponse.json({ client });
  } catch (err) {
    console.error("AUTH_ME_ERR:", err);
    return NextResponse.json(
      { error: "Server error" },
      { status: 500 }
    );
  }
}


