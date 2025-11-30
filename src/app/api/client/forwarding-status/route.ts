import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { cookies } from "next/headers";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const clientId = searchParams.get("client_id");

    if (!clientId) {
      return NextResponse.json({ status: "none" });
    }

    // Verify session
    const cookieStore = await cookies();
    const token =
      cookieStore.get("ll_session")?.value ||
      cookieStore.get("sb-access-token")?.value;

    if (!token) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
      {
        auth: { persistSession: false },
      }
    );

    // Verify user owns this client
    const {
      data: userRes,
      error: userErr,
    } = await supabase.auth.getUser(token);

    if (userErr || !userRes?.user) {
      return NextResponse.json({ error: "Invalid session" }, { status: 401 });
    }

    const { data: client } = await supabase
      .from("clients")
      .select("id, user_id")
      .eq("id", clientId)
      .eq("user_id", userRes.user.id)
      .maybeSingle();

    if (!client) {
      return NextResponse.json({ error: "Client not found" }, { status: 404 });
    }

    // Check if there are any leads for this client (indicates forwarding is working)
    // Check both client_id and org_id (which is the client's id)
    const { data: leads, error: leadsError } = await supabase
      .from("leads")
      .select("id")
      .or(`client_id.eq.${clientId},org_id.eq.${clientId}`)
      .order("created_at", { ascending: false })
      .limit(1);

    if (leadsError) {
      console.error("[ForwardingStatus] Error checking leads:", leadsError);
      return NextResponse.json({ status: "none" });
    }

    // If we have leads, forwarding is working
    if (leads && leads.length > 0) {
      return NextResponse.json({ status: "working" });
    }

    // Check inbound_emails table as fallback
    const { data: inboundEmails } = await supabase
      .from("inbound_emails")
      .select("id")
      .eq("status", "done")
      .order("created_at", { ascending: false })
      .limit(1);

    // If we have processed inbound emails, forwarding might be working but no leads yet
    if (inboundEmails && inboundEmails.length > 0) {
      return NextResponse.json({ status: "pending" });
    }

    return NextResponse.json({ status: "none" });
  } catch (err) {
    console.error("[ForwardingStatus] Server error:", err);
    return NextResponse.json({ status: "none" });
  }
}

