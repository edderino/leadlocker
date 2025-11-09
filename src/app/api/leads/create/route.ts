import { NextResponse } from "next/server";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

async function resolveDefaultUserId(supabase: SupabaseClient) {
  if (process.env.LL_DEFAULT_USER_ID) return process.env.LL_DEFAULT_USER_ID;

  const { data, error } = await supabase
    .from("users")
    .select("id")
    .order("created_at", { ascending: true })
    .limit(1)
    .maybeSingle();

  if (error) {
    throw new Error(`Failed to resolve default user: ${error.message}`);
  }

  if (!data?.id) {
    throw new Error("No users found. Configure LL_DEFAULT_USER_ID or create a user.");
  }

  return data.id as string;
}

// ✅ secure endpoint replacing Zapier
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { client_api_key, name, phone, source, message, org_id } = body;

    // check API key
    if (!client_api_key || client_api_key !== process.env.CLIENT_PORTAL_SECRET) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // basic validation
    if (!name || !phone || !org_id) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    // service-role client bypasses RLS safely
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    const userId = await resolveDefaultUserId(supabase);

    const { error } = await supabase.from("leads").insert([
      {
        name,
        phone,
        source: source || "manual",
        description: message || "",
        status: "NEW",
        org_id,
        user_id: userId,
      },
    ]);

    if (error) throw error;
    return NextResponse.json({ success: true });
  } catch (err: any) {
    console.error("Lead intake error:", err.message);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
