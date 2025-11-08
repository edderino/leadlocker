import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

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

    const { error } = await supabase.from("leads").insert([
      {
        name,
        phone,
        source: source || "manual",
        message: message || "",
        status: "NEEDS_ATTENTION",
        org_id,
      },
    ]);

    if (error) throw error;
    return NextResponse.json({ success: true });
  } catch (err: any) {
    console.error("Lead intake error:", err.message);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
