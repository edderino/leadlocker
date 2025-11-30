import { NextResponse } from "next/server";
import { NextRequest } from "next/server";
import { verifyClientSession } from "@/app/api/_lib/verifyClientSession";
import { createClient } from "@supabase/supabase-js";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  try {
    const session = await verifyClientSession(req);

    if (session.error || !session.user) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
      {
        auth: { persistSession: false },
      }
    );

    // Get client by user_id
    const { data: client, error: clientError } = await supabase
      .from("clients")
      .select("id")
      .eq("user_id", session.user.id)
      .maybeSingle();

    if (clientError || !client) {
      return NextResponse.json(
        { error: "Client not found" },
        { status: 404 }
      );
    }

    // Update client to mark onboarding complete
    const { error } = await supabase
      .from("clients")
      .update({ onboarding_complete: true })
      .eq("id", client.id);

    if (error) {
      console.error("[OnboardingComplete] DB error:", error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ ok: true });
  } catch (err: any) {
    console.error("[OnboardingComplete] Server error:", err);
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}
