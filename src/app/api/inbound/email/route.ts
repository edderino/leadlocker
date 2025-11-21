import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export async function POST(req: NextRequest) {
  try {
    const payload = await req.json();

    if (payload.type !== "email.received") {
      return NextResponse.json({ ok: true });
    }

    const received = payload.data;

    const from = received.from;
    const to = received.to?.[0];
    const subject = received.subject;
    const emailId = received.email_id;

    console.log("Inbound email received:", {
      from,
      to,
      subject,
      emailId,
    });

    // Fetch email body
    const emailRes = await fetch(`https://api.resend.com/emails/${emailId}`, {
      headers: {
        Authorization: `Bearer ${process.env.RESEND_API_KEY}`,
      },
    });

    const fullEmail = await emailRes.json();

    const textBody = fullEmail?.text ?? "";
    const htmlBody = fullEmail?.html ?? "";

    // Parse lead fields
    const { parseLeadFromEmail } = await import("@/libs/parseEmail");
    const parsed = parseLeadFromEmail(textBody || htmlBody || "");

    const fallbackName =
      received.from?.split("<")[0]?.trim().replace(/["']/g, "") || "Unknown";

    const lead = {
      name: parsed.name || fallbackName,
      email: parsed.email || null,
      phone: parsed.phone || null,
      description: parsed.message || "",
      raw: textBody || htmlBody || "",
    };

    console.log("Parsed lead:", lead);

    // --- FIX: use org_id not client_id ---
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    // Pick *any* client (we only have demo-org)
    const orgId = "demo-org";

    const { error } = await supabase.from("leads").insert({
      org_id: orgId,
      name: lead.name,
      phone: lead.phone,
      description: lead.description,
      status: "NEW",
      source: "email",
    });

    if (error) {
      console.error("Lead insert failed:", error);
      return NextResponse.json({ error: "DB insert failed" }, { status: 500 });
    }

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("Inbound email error:", err);
    return NextResponse.json({ error: true }, { status: 500 });
  }
}
