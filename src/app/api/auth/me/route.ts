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

      // Generate unique slug with timestamp to avoid conflicts
      const uniqueSlug = `${slug}-${Date.now()}-${Math.random().toString(36).substring(7)}`;
      
      const insertData = {
        id: `client_${crypto.randomUUID()}`,
        user_id: userId,
        slug: uniqueSlug,
        name: businessName, // Required field - matches signup route
        business_name: businessName,
        owner_name: businessName,
        contact_email: userEmail,
        sms_number: "", // Can be updated later
        inbound_email: `${uniqueSlug}@mg.leadlocker.app`,
        api_key: crypto.randomBytes(32).toString("hex"),
      };

      console.log("[AUTH_ME] Attempting to create client with data:", {
        ...insertData,
        api_key: "[REDACTED]",
      });

      const { data: newClient, error: createError } = await admin
        .from("clients")
        .insert(insertData)
        .select()
        .single();

      if (createError) {
        console.error("[AUTH_ME] Failed to auto-create client:", {
          error: createError,
          message: createError.message,
          details: createError.details,
          hint: createError.hint,
          code: createError.code,
          insertData: {
            ...insertData,
            api_key: "[REDACTED]",
          },
        });
        
        // Return the actual error so we can debug it
        return NextResponse.json(
          {
            error: "Account setup incomplete. Please contact support.",
            details: createError.message,
            code: createError.code,
            hint: createError.hint,
          },
          { status: 500 }
        );
      }

      if (!newClient) {
        console.error("[AUTH_ME] Client insert returned no data");
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

export async function PATCH(req: Request) {
  try {
    const cookieStore = await cookies();
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
    const body = await req.json();

    // Update client row
    const { data: client, error: updateError } = await admin
      .from("clients")
      .update({
        owner_name: body.owner_name,
        sms_number: body.sms_number,
      })
      .eq("user_id", userId)
      .select()
      .single();

    if (updateError || !client) {
      return NextResponse.json(
        { error: updateError?.message || "Failed to update client" },
        { status: 500 }
      );
    }

    return NextResponse.json({ client, success: true });
  } catch (err) {
    console.error("AUTH_ME_PATCH_ERR:", err);
    return NextResponse.json(
      { error: "Server error" },
      { status: 500 }
    );
  }
}


