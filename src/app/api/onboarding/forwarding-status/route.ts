import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/libs/supabaseAdmin";
import { cookies } from "next/headers";
import { createClient } from "@supabase/supabase-js";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
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

    const admin = createClient(supabaseUrl, serviceKey, {
      auth: { persistSession: false },
    });

    const { data: userRes, error: userErr } = await admin.auth.getUser(token);

    if (userErr || !userRes?.user) {
      return NextResponse.json({ error: "Invalid session" }, { status: 401 });
    }

    const userId = userRes.user.id;

    // Get client
    const { data: client, error: clientError } = await supabaseAdmin
      .from("clients")
      .select("*")
      .eq("user_id", userId)
      .maybeSingle();

    if (clientError || !client) {
      return NextResponse.json(
        { error: "Client not found" },
        { status: 404 }
      );
    }

    // Check recent events/leads to detect forwarding status
    const { data: recentLeads } = await supabaseAdmin
      .from("leads")
      .select("from_email, created_at")
      .eq("client_id", client.id)
      .order("created_at", { ascending: false })
      .limit(10);

    // Check for self-forwarding (from = to)
    const selfForwardingDetected = recentLeads?.some(
      (lead) => lead.from_email?.toLowerCase() === client.inbound_email?.toLowerCase()
    ) || false;

    // Check for self-forwarding flag in client record
    const selfForwardingFromClient = client.self_forwarding_detected || false;

    // Determine forwarding status
    const status = {
      waitingForVerificationEmail: !client.gmail_forwarding_code,
      addressAdded: !!client.gmail_forwarding_code,
      verificationClicked: !!client.gmail_forwarding_verified,
      forwardingEnabled: client.forwarding_confirmed || false,
      changesSaved: client.forwarding_confirmed || false,
      forwardingDisabled: client.gmail_forwarding_code && !client.forwarding_confirmed && !client.gmail_forwarding_verified,
      selfForwardingDetected: selfForwardingFromClient || selfForwardingDetected,
    };

    return NextResponse.json({ status, client });
  } catch (err) {
    console.error("[ForwardingStatus] Error:", err);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

