import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/utils/supabase/server";

export async function POST(req: NextRequest) {
  try {
    // 1. Optional security — verify Google secret
    const googleSecret = process.env.GOOGLE_WEBHOOK_SECRET;
    const incomingSecret = req.headers.get("x-goog-channel-token");

    if (googleSecret && incomingSecret !== googleSecret) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // 2. Parse Google Ads Lead Form payload
    const body = await req.json();
    console.log("🔵 [GOOGLE ADS WEBHOOK] Incoming payload:", body);

    const lead = body?.leadNotification?.lead;
    if (!lead) {
      return NextResponse.json({ error: "Invalid payload" }, { status: 400 });
    }

    // Extract common Google Ads lead fields
    const userData = lead.userProvidedData || {};

    const name =
      userData?.fullName?.value ||
      userData?.givenName?.value ||
      "Unknown";

    const phone =
      userData?.phoneNumber?.value ||
      null;

    const description =
      userData?.comments?.value ||
      null;

    // Default org for now
    const orgId = "demo-org";

    // 3. Insert into Supabase
    const supabase = await createClient();

    const { error: insertError } = await supabase
      .from("leads")
      .insert({
        org_id: orgId,
        name,
        phone,
        description,
        source: "GOOGLE_ADS",
        status: "NEW",
      });

    if (insertError) {
      console.error("❌ Supabase insert error", insertError);
      return NextResponse.json(
        { error: "DB insert failed" },
        { status: 500 }
      );
    }

    // 4. Optional event logging
    await supabase.from("events").insert({
      org_id: orgId,
      type: "lead_created_google_ads",
      payload: body,
    });

    console.log("✅ Google Ads lead inserted successfully");

    return NextResponse.json({ success: true }, { status: 200 });
  } catch (err) {
    console.error("❌ Google Ads Webhook Crash:", err);
    return NextResponse.json(
      { error: "Server error", details: String(err) },
      { status: 500 }
    );
  }
}
