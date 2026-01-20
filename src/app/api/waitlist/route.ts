import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/libs/supabaseAdmin";

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { email } = body;

    // Validate email
    if (!email || typeof email !== "string") {
      return NextResponse.json(
        { success: false, error: "Email is required" },
        { status: 400 }
      );
    }

    // Basic email format validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return NextResponse.json(
        { success: false, error: "Invalid email format" },
        { status: 400 }
      );
    }

    // Normalize email (lowercase)
    const normalizedEmail = email.toLowerCase().trim();

    // Upsert to waitlist table (handles duplicates gracefully)
    const { data, error } = await supabaseAdmin
      .from("waitlist")
      .upsert(
        {
          email: normalizedEmail,
          created_at: new Date().toISOString(),
        },
        {
          onConflict: "email",
          ignoreDuplicates: false, // Update timestamp if exists
        }
      )
      .select()
      .single();

    if (error) {
      console.error("[Waitlist API] Error:", error);
      
      // Handle unique constraint violation gracefully
      if (error.code === "23505") {
        return NextResponse.json(
          { success: true, message: "You're already on the waitlist!" },
          { status: 200 }
        );
      }

      return NextResponse.json(
        { success: false, error: "Failed to add email to waitlist" },
        { status: 500 }
      );
    }

    return NextResponse.json(
      { success: true, message: "Successfully added to waitlist" },
      { status: 200 }
    );
  } catch (err: any) {
    console.error("[Waitlist API] Unexpected error:", err);
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 }
    );
  }
}
