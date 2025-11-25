import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export async function POST(req: Request) {
  console.log("📩 [INBOUND] Mailgun hit endpoint");

  // Mailgun sends data as form-urlencoded, not JSON
  const form = await req.formData();
  const payload: Record<string, any> = {};

  for (const [key, value] of form.entries()) {
    payload[key] = value;
  }

  console.log("📩 [INBOUND] Parsed payload:", payload);

  // Extract the fields we care about
  const from_email = payload.sender || payload.From || payload.from || "";
  const to_email = payload.recipient || payload.Recipient || payload.to || "";
  const subject = payload.subject || "";
  const body_plain = payload["body-plain"] || payload["stripped-text"] || "";
  const external_id = payload["Message-Id"] || "";
  const source = "email";

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  // Insert into inbound_emails
  const { error } = await supabase.from("inbound_emails").insert({
    source,
    external_id,
    subject,
    from_email,
    to_email,
    payload,
  });

  if (error) {
    console.error("❌ Error storing inbound email", error);
    return NextResponse.json({ ok: false, error: error.message }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
