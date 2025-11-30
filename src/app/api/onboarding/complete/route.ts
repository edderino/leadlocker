import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { createClient } from "@supabase/supabase-js";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type CompleteBody = {
  phone?: string;
};

export async function POST(req: Request) {
  try {
    const body = (await req.json()) as CompleteBody;
    const { phone } = body;

    if (!phone || !phone.trim()) {
      return NextResponse.json(
        { error: "Phone number is required" },
        { status: 400 }
      );
    }

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

    // Update client with phone number and mark onboarding as complete
    const { data: client, error: updateError } = await admin
      .from("clients")
      .update({
        sms_number: phone.trim(),
        onboarding_complete: true, // Assuming this column exists
      })
      .eq("user_id", userId)
      .select()
      .single();

    if (updateError) {
      console.error("[Onboarding] Error updating client:", updateError);
      
      // If onboarding_complete column doesn't exist, just update phone
      if (updateError.message?.includes("onboarding_complete")) {
        const { data: fallbackClient, error: fallbackError } = await admin
          .from("clients")
          .update({
            sms_number: phone.trim(),
          })
          .eq("user_id", userId)
          .select()
          .single();

        if (fallbackError) {
          return NextResponse.json(
            { error: "Failed to save phone number", details: fallbackError.message },
            { status: 500 }
          );
        }

        return NextResponse.json({ success: true, client: fallbackClient });
      }

      return NextResponse.json(
        { error: "Failed to complete onboarding", details: updateError.message },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true, client });
  } catch (err) {
    console.error("[Onboarding] Server error:", err);
    return NextResponse.json(
      { error: "Server error" },
      { status: 500 }
    );
  }
}

