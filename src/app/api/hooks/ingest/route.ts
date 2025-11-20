"use server";

import { NextResponse } from "next/server";
import { createClient } from "@/utils/supabase/server";

export async function POST(req: Request) {
  try {
    const supabase = await createClient();
    const body = await req.json();

    // Basic validation
    const { orgKey, name, phone, description, source } = body;
    if (!orgKey || !name || !phone) {
      return NextResponse.json(
        { success: false, error: "Missing required fields" },
        { status: 400 }
      );
    }

    // Verify orgKey maps to an org
    const { data: org, error: orgErr } = await supabase
      .from("client_orgs")
      .select("id")
      .eq("api_key", orgKey)
      .maybeSingle();

    if (orgErr || !org) {
      return NextResponse.json(
        { success: false, error: "Invalid orgKey" },
        { status: 403 }
      );
    }

    // Insert lead
    const { data, error } = await supabase
      .from("leads")
      .insert({
        client_id: org.id,
        name,
        phone,
        description: description ?? null,
        status: "NEW",
        source: source ?? "webhook",
      })
      .select()
      .maybeSingle();

    if (error) throw error;

    return NextResponse.json(
      { success: true, lead: data },
      { status: 200 }
    );
  } catch (err: any) {
    console.error("INGEST ERROR:", err);
    return NextResponse.json(
      { success: false, error: err.message },
      { status: 500 }
    );
  }
}

