import { NextResponse } from "next/server";
import { NextRequest } from "next/server";
import { supabaseAdmin } from "@/libs/supabaseAdmin";
import { verifyClientSession } from "@/app/api/_lib/verifyClientSession";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  try {
    const verification = await verifyClientSession(req);

    if (verification.error || !verification.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const { code } = body;

    if (!code || typeof code !== "string" || code.trim().length === 0) {
      return NextResponse.json({ error: "Missing code" }, { status: 400 });
    }

    // Get client ID from user
    const { data: client, error: clientError } = await supabaseAdmin
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
    const { error: updateError } = await supabaseAdmin
      .from("clients")
      .update({
        gmail_forwarding_code: code.trim(),
        gmail_forwarding_verified: true,
      })
      .eq("id", client.id);

    if (updateError) {
      console.error("[ForwardingVerify] DB error:", updateError);
      return NextResponse.json(
        { error: "Database error", details: updateError.message },
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

