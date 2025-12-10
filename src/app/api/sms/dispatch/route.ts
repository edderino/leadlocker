import { NextRequest, NextResponse } from "next/server";
import { sendSMS } from "@/libs/twilio";
import { log } from "@/libs/log";

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { type, name, email, phone, lead_id } = body;

    log("POST /api/sms/dispatch - SMS dispatch request", { type, name, phone, lead_id });

    // Get default phone number
    const defaultPhone = process.env.LL_DEFAULT_USER_PHONE;
    if (!defaultPhone) {
      log("POST /api/sms/dispatch - No default phone configured");
      return NextResponse.json(
        { error: "SMS recipient not configured" },
        { status: 500 }
      );
    }

    // Build SMS message based on type
    const rawUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
    const baseUrl = rawUrl.startsWith('http') ? rawUrl : `http://${rawUrl}`;
    
    let smsBody = "";
    
    if (type === "facebook_lead") {
      smsBody = [
        `🔔 New Lead — Facebook`,
        `Name: ${name}`,
        email ? `Email: ${email}` : undefined,
        `Call: ${phone}`,
        lead_id ? `Mark done: ${baseUrl}/api/leads/status?id=${lead_id}` : undefined,
      ].filter(Boolean).join('\n');
    } else {
      // Generic format for other types
      smsBody = [
        `🔔 New Lead — ${type || "Unknown"}`,
        name ? `Name: ${name}` : undefined,
        email ? `Email: ${email}` : undefined,
        phone ? `Call: ${phone}` : undefined,
        lead_id ? `Mark done: ${baseUrl}/api/leads/status?id=${lead_id}` : undefined,
      ].filter(Boolean).join('\n');
    }

    // Send SMS
    await sendSMS(defaultPhone, smsBody);

    log("POST /api/sms/dispatch - SMS sent successfully");

    return NextResponse.json({ ok: true, sent: true });
  } catch (err) {
    log("POST /api/sms/dispatch - Error", err);
    return NextResponse.json(
      { error: "Failed to send SMS" },
      { status: 500 }
    );
  }
}
