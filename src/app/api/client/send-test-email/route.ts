import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { createClient } from "@supabase/supabase-js";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST() {
  try {
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

    // Get user and client
    const {
      data: userRes,
      error: userErr,
    } = await supabase.auth.getUser(token);

    if (userErr || !userRes?.user) {
      return NextResponse.json({ error: "Invalid session" }, { status: 401 });
    }

    const { data: client, error: clientError } = await supabase
      .from("clients")
      .select("inbound_email, contact_email")
      .eq("user_id", userRes.user.id)
      .maybeSingle();

    if (clientError || !client) {
      return NextResponse.json(
        { error: "Client not found" },
        { status: 404 }
      );
    }

    // Send test email to the client's inbound_email address
    // This will be processed by the inbound email handler and create a test lead
    const testEmailTo = client.inbound_email;

    // Use Resend if available, otherwise log for manual testing
    if (process.env.RESEND_API_KEY) {
      const { Resend } = await import("resend");
      const resend = new Resend(process.env.RESEND_API_KEY);

      await resend.emails.send({
        from: "LeadLocker Test <noreply@leadlocker.app>",
        to: testEmailTo,
        subject: "LeadLocker Test Email",
        html: `
          <p>This is a test email from LeadLocker.</p>
          <p>If you've received this, forwarding is working!</p>
          <p>Name: Test User<br>Phone: +61400000000<br>Message: This is a test email to verify email forwarding is configured correctly.</p>
        `,
        text: "This is a test email from LeadLocker. If you've received this, forwarding is working! Name: Test User, Phone: +61400000000, Message: This is a test email to verify email forwarding is configured correctly.",
      });
    } else {
      // Fallback: Log the test email details for manual testing
      console.log("📧 [TEST EMAIL] Would send to:", testEmailTo);
      console.log("📧 [TEST EMAIL] Install Resend package: npm install resend");
      console.log("📧 [TEST EMAIL] Set RESEND_API_KEY environment variable");
      
      // For now, return success but note that Resend is not configured
      return NextResponse.json({
        ok: true,
        message: "Resend not configured. Please install 'resend' package and set RESEND_API_KEY.",
        testEmailTo,
      });
    }

    return NextResponse.json({ ok: true, message: "Test email sent successfully" });
  } catch (err: any) {
    console.error("❌ [SendTestEmail] Error:", err);
    
    // If Resend is not installed, provide helpful error
    if (err.message?.includes("Cannot find module 'resend'")) {
      return NextResponse.json(
        {
          error: "Resend package not installed",
          message: "Please install Resend: npm install resend",
        },
        { status: 500 }
      );
    }

    return NextResponse.json(
      { error: "Failed to send test email", details: err.message },
      { status: 500 }
    );
  }
}

