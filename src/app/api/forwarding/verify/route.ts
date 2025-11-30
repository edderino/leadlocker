import { NextResponse } from "next/server";
import { NextRequest } from "next/server";
import { verifyClientSession } from "@/app/api/_lib/verifyClientSession";
import { createClient } from "@supabase/supabase-js";
import { AUTO_GMAIL_VERIFICATION_ENABLED } from "@/config/leadlocker";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  if (!AUTO_GMAIL_VERIFICATION_ENABLED) {
    console.log("🔒 Gmail auto-verification disabled (forwarding/verify)");
    return NextResponse.json(
      { ok: false, disabled: true },
      { status: 200 }
    );
  }

  try {
    const verification = await verifyClientSession(req);

    if (verification.error || !verification.user) {
      return NextResponse.json(
        { error: "Invalid session" },
        { status: 401 }
      );
    }

    const body = await req.json();
    const { code } = body;

    if (!code || typeof code !== "string" || code.trim().length === 0) {
      return NextResponse.json({ error: "Missing code" }, { status: 400 });
    }

    // Get client ID from user
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
      {
        auth: { persistSession: false },
      }
    );

    const { data: client, error: clientError } = await supabase
      .from("clients")
      .select("id")
      .eq("user_id", verification.user.id)
      .maybeSingle();

    if (clientError || !client) {
      return NextResponse.json(
        { error: "Client not found" },
        { status: 404 }
      );
    }

    // Update client with the verification code
    const { error: updateError } = await supabase
      .from("clients")
      .update({
        gmail_forwarding_code: code.trim(),
        gmail_forwarding_verified: true,
      })
      .eq("id", client.id);

    if (updateError) {
      console.error("[ForwardingVerify] DB error:", updateError);
      return NextResponse.json(
        { ok: false, error: updateError.message },
        { status: 500 }
      );
    }

    return NextResponse.json({ ok: true });
  } catch (err: any) {
    console.error("[ForwardingVerify] Server error:", err);
    return NextResponse.json(
      { error: "Server error", details: err.message },
      { status: 500 }
    );
  }
}

