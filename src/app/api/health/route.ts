import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export async function GET() {
  const result: Record<string, any> = {};

  // --- Supabase check ---
  try {
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );
    const { data, error } = await supabase.from("leads").select("id").limit(1);
    if (error) throw error;
    result.supabase = "ok";
  } catch (e: any) {
    result.supabase = `fail: ${e.message}`;
  }

  // --- Twilio check (just auth, no SMS) ---
  try {
    const sid = process.env.TWILIO_ACCOUNT_SID;
    const token = process.env.TWILIO_AUTH_TOKEN;
    if (sid && token) result.twilio = "ok";
    else throw new Error("missing credentials");
  } catch (e: any) {
    result.twilio = `fail: ${e.message}`;
  }

  // --- Env sanity ---
  const required = ["NEXT_PUBLIC_SUPABASE_URL", "SUPABASE_SERVICE_ROLE_KEY", "TWILIO_ACCOUNT_SID"];
  const missing = required.filter((v) => !process.env[v]);
  result.env = missing.length ? `missing: ${missing.join(", ")}` : "ok";

  const ok = Object.values(result).every((v) => v === "ok");
  return NextResponse.json({ ok, result }, { status: ok ? 200 : 500 });
}
