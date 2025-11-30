import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { createClient } from "@supabase/supabase-js";
import crypto from "crypto";

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

    if (error) {
      console.error("[AUTH_ME] Database error fetching client:", error);
      return NextResponse.json(
        { error: "Database error", details: error.message },
        { status: 500 }
      );
    }

    if (!client) {
      console.log(
        "[AUTH_ME] No client found for user_id:",
        userId,
        "email:",
        userRes.user.email,
        "- auto-creating client row"
      );

      // Auto-create a client row for existing users who don't have one
      // This handles users created before the signup flow was implemented
      const userEmail = userRes.user.email || `user-${userId}@example.com`;
      const businessName = userEmail.split("@")[0] || "User";
      const slug = businessName.toLowerCase().replace(/[^a-z0-9]+/g, "-");

      const { data: newClient, error: createError } = await admin
        .from("clients")
        .insert({
          id: `client_${crypto.randomUUID()}`,
          user_id: userId,
          slug: `${slug}-${Date.now()}`, // Ensure uniqueness
          business_name: businessName,
          owner_name: businessName,
          contact_email: userEmail,
          sms_number: "", // Can be updated later
          inbound_email: `${slug}@mg.leadlocker.app`,
          api_key: crypto.randomBytes(32).toString("hex"),
        })
        .select()
        .single();

      if (createError || !newClient) {
        console.error("[AUTH_ME] Failed to auto-create client:", createError);
        return NextResponse.json(
          {
            error: "Account setup incomplete. Please contact support.",
          },
          { status: 500 }
        );
      }

      console.log("[AUTH_ME] Auto-created client row:", newClient.id);
      return NextResponse.json({ client: newClient });
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


