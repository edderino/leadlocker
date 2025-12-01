import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { createClient } from "@supabase/supabase-js";
import { verifyClientSession } from "@/app/api/_lib/verifyClientSession";

export async function POST(req: Request) {
  try {
    // 1. Verify session
    const verification = await verifyClientSession(req as any);
    if (verification.error || !verification.user) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    const userId = verification.user.id;

    // 2. Supabase admin client
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    // 3. Find client row
    const { data: client, error: fetchErr } = await supabase
      .from("clients")
      .select("*")
      .eq("user_id", userId)
      .maybeSingle();

    if (fetchErr || !client) {
      return NextResponse.json(
        { error: "Client row not found." },
        { status: 404 }
      );
    }

    // 4. Update onboarding_complete
    const { error: updateErr } = await supabase
      .from("clients")
      .update({ onboarding_complete: true })
      .eq("id", client.id);

    if (updateErr) {
      return NextResponse.json(
        { error: "Failed to update onboarding status." },
        { status: 500 }
      );
    }

    return NextResponse.json({ ok: true });
  } catch (err) {
    return NextResponse.json(
      { error: "Unexpected error", detail: `${err}` },
      { status: 500 }
    );
  }
}
