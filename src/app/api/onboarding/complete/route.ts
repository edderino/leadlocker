import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const phone = (body.phone || "").trim();

    if (!phone) {
      return NextResponse.json(
        { error: "Phone number required" },
        { status: 400 }
      );
    }

    // Read token from Cookie or Authorization header
    const cookieHeader = req.headers.get("cookie") || "";
    const authHeader = req.headers.get("authorization") || "";

    let token = null;

    // First priority: Authorization: Bearer <token>
    if (authHeader.toLowerCase().startsWith("bearer ")) {
      token = authHeader.slice(7);
    }

    // Fallback: sb-access-token cookie
    if (!token) {
      const match = cookieHeader.match(/sb-access-token=([^;]+)/);
      if (match) token = match[1];
    }

    if (!token) {
      return NextResponse.json(
        { error: "No session token found" },
        { status: 401 }
      );
    }

    // Supabase admin client (service role)
    const supabaseAdmin = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    // Validate user
    const {
      data: { user },
      error: userErr,
    } = await supabaseAdmin.auth.getUser(token);

    if (userErr || !user) {
      return NextResponse.json({ error: "Invalid session" }, { status: 401 });
    }

    // Lookup this user's client row
    const { data: client, error: clientErr } = await supabaseAdmin
      .from("clients")
      .select("*")
      .eq("user_id", user.id)
      .maybeSingle();

    if (clientErr || !client) {
      return NextResponse.json(
        { error: "Client row not found" },
        { status: 404 }
      );
    }

    // Update client with phone + onboarding flag
    const { error: updateErr } = await supabaseAdmin
      .from("clients")
      .update({
        sms_number: phone,
        onboarding_complete: true,
      })
      .eq("id", client.id);

    if (updateErr) {
      return NextResponse.json(
        { error: updateErr.message },
        { status: 500 }
      );
    }

    return NextResponse.json({ ok: true });
  } catch (err: any) {
    console.error("❌ Onboarding error:", err);
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}
