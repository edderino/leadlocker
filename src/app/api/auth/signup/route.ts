import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import crypto from "crypto";
import { createClient as createSupabaseClient } from "@supabase/supabase-js";
import { supabaseAdmin } from "@/libs/supabaseAdmin";
import { Resend } from "resend";

/**
 * LeadLocker – Client Signup API
 *
 * Creates:
 * - Supabase auth user
 * - Clients row with unique slug
 * - Inbound email (slug@mg.leadlocker.app)
 * - API key
 * - Session + auth cookies (logs user in)
 */

export const runtime = "nodejs";

type SignupBody = {
  owner_name?: string;
  business_name?: string;
  contact_email?: string;
  sms_number?: string;
  password?: string;
};

function slugify(str: string): string {
  return str
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)+/g, "");
}

export async function POST(req: Request) {
  try {
    // ---------------------------------------------
    // -1. Guard: block signup if already authenticated
    // ---------------------------------------------
    const cookieStore = await cookies();
    const existingToken = cookieStore.get("sb-access-token")?.value;

    if (existingToken) {
      const { data: existingUser, error: existingErr } =
        await supabaseAdmin.auth.getUser(existingToken);

      if (existingUser?.user && !existingErr) {
        return NextResponse.json(
          {
            error:
              "Already signed in — cannot create another account.",
          },
          { status: 403 }
        );
      }
    }

    const body = (await req.json()) as SignupBody;

    const {
      owner_name,
      business_name,
      contact_email,
      sms_number,
      password,
    } = body;

    // ---------------------------------------------
    // 0. Basic validation
    // ---------------------------------------------
    if (
      !owner_name ||
      !business_name ||
      !contact_email ||
      !sms_number ||
      !password
    ) {
      return NextResponse.json(
        { error: "Missing required fields." },
        { status: 400 }
      );
    }

    const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
    const SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!;
    const ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

    if (!SUPABASE_URL || !SERVICE_KEY || !ANON_KEY) {
      return NextResponse.json(
        { error: "Server auth not fully configured." },
        { status: 500 }
      );
    }

    // ---------------------------------------------
    // 1. Prevent duplicate email or SMS in clients
    // ---------------------------------------------
    const { data: exists, error: existsError } = await supabaseAdmin
      .from("clients")
      .select("id")
      .or(
        `contact_email.eq.${contact_email},sms_number.eq.${sms_number}` as any
      )
      .maybeSingle();

    if (existsError) {
      console.error("[Signup] duplicate check failed:", existsError);
      return NextResponse.json(
        { error: "Unable to verify existing account." },
        { status: 500 }
      );
    }

    if (exists) {
      return NextResponse.json(
        {
          error: "An account already exists with this email or phone number.",
        },
        { status: 409 }
      );
    }

    // ---------------------------------------------
    // 2. Create Auth user (service role)
    // ---------------------------------------------
    const {
      data: authUser,
      error: authError,
    } = await supabaseAdmin.auth.admin.createUser({
      email: contact_email,
      password,
      email_confirm: true,
      user_metadata: {
        full_name: owner_name,
        name: owner_name,
        phone: sms_number,
      },
      phone: sms_number, // Also set phone directly for Auth dashboard
    });

    if (authError || !authUser?.user) {
      console.error("[Signup] createUser failed:", authError);
      return NextResponse.json(
        { error: authError?.message || "Failed to create user." },
        { status: 500 }
      );
    }

    const user_id = authUser.user.id;

    // ---------------------------------------------
    // 3. Generate unique slug (clean, lowercase)
    //    and local-part for inbound email
    // ---------------------------------------------
    const baseSlug = slugify(business_name);
    let slug = baseSlug;
    let counter = 1;

    // ensure uniqueness
    // eslint-disable-next-line no-constant-condition
    while (true) {
      const { data: taken, error: slugError } = await supabaseAdmin
        .from("clients")
        .select("id")
        .eq("slug", slug)
        .maybeSingle();

      if (slugError) {
        console.error("[Signup] slug check failed:", slugError);
        return NextResponse.json(
          { error: "Unable to generate unique slug." },
          { status: 500 }
        );
      }

      if (!taken) break;
      slug = `${baseSlug}-${counter++}`;
    }

    // ---------------------------------------------
    // 4. Generate inbound email (local-part based on business_name)
    //    and ensure it's unique
    // ---------------------------------------------
    const local = business_name
      .toLowerCase()
      .replace(/[^a-z0-9]/g, "");

    let inbound_email = `${local}@mg.leadlocker.app`;
    let inboundCounter = 1;
    
    // Double-check inbound_email uniqueness (in case of edge cases)
    while (true) {
      const { data: emailTaken, error: emailCheckError } = await supabaseAdmin
        .from("clients")
        .select("id")
        .eq("inbound_email", inbound_email)
        .maybeSingle();

      if (emailCheckError) {
        console.error("[Signup] inbound_email check failed:", emailCheckError);
        return NextResponse.json(
          { error: "Unable to verify email address availability." },
          { status: 500 }
        );
      }

      if (!emailTaken) break;
      // If inbound_email is taken, use a different slug variant
      inbound_email = `${slug}-${inboundCounter++}@mg.leadlocker.app`;
    }

    // ---------------------------------------------
    // 5. Generate API key
    // ---------------------------------------------
    const api_key = crypto.randomBytes(32).toString("hex");

    // ---------------------------------------------
    // 6. Insert into clients table (with full error logging)
    // ---------------------------------------------
    console.log("[Signup] Attempting to insert client with:", {
      user_id,
      slug,
      inbound_email,
      business_name,
      owner_name,
      contact_email,
      sms_number,
    });

    const insertPayload = {
      id: crypto.randomUUID(), // use a real UUID (matches uuid column type)
      user_id,
      slug,
      name: owner_name,
      business_name,
      owner_name,
      contact_email,
      sms_number,
      inbound_email,
      api_key,
      // Twilio config per client (global sender, client mobile)
      twilio_from: "+15074787192",
      twilio_to: sms_number,
    };

    const insertResult = await supabaseAdmin.from("clients").insert(insertPayload);

    console.log("[Signup] Insert result:", insertResult);

    if (insertResult.error) {
      console.error("[Signup] INSERT CLIENT FAILED:", {
        message: insertResult.error.message,
        details: insertResult.error.details,
        hint: insertResult.error.hint,
        code: insertResult.error.code,
      });

      return NextResponse.json(
        { error: "Failed to create client row.", details: insertResult.error },
        { status: 500 }
      );
    }

    console.log("[Signup] Client created successfully:", {
      id: insertPayload.id,
      user_id: insertPayload.user_id,
      slug: insertPayload.slug,
    });

    // ==============================
    // SEND WELCOME + ONBOARDING EMAIL
    // ==============================
    try {
      if (process.env.RESEND_API_KEY) {
        const resend = new Resend(process.env.RESEND_API_KEY);

        const clientEmail = contact_email.trim();
        const clientName =
          owner_name.trim() || business_name.trim() || "there";
        const forwardingAddress = inbound_email;
        const appUrl =
          process.env.NEXT_PUBLIC_APP_URL || "https://leadlocker.app";

        await resend.emails.send({
          from: "LeadLocker <noreply@mg.leadlocker.app>",
          to: clientEmail,
          subject: "Welcome to LeadLocker — Final Setup Step",
          html: `
            <div style="font-family:Arial, sans-serif; font-size:16px; line-height:1.6; color:#111;">
              <h2>Welcome to LeadLocker, ${clientName}!</h2>

              <p>You're almost ready to receive instant SMS alerts for every new lead.</p>

              <p>To activate your account, please forward your business email to:</p>

              <p style="font-size:18px; font-weight:bold; margin:20px 0;">
                ${forwardingAddress}
              </p>

              <p>Once forwarding is set up, LeadLocker will immediately start capturing leads and sending you notifications.</p>

              <hr style="margin:24px 0;" />

              <h3>📬 Gmail Setup Instructions</h3>

              <ol>
                <li>Open Gmail.</li>
                <li>Click the gear icon → <strong>See all settings</strong>.</li>
                <li>Select <strong>Forwarding and POP/IMAP</strong>.</li>
                <li>Click <strong>Add a forwarding address</strong>.</li>
                <li>Enter: <strong>${forwardingAddress}</strong>.</li>
                <li>Click <strong>Next → Proceed → OK</strong>.</li>
                <li>Refresh Gmail and click the confirmation banner when it appears.</li>
              </ol>

              <hr style="margin:24px 0;" />

              <p>You can finish onboarding anytime here:</p>

              <p>
                <a href="${appUrl}/onboarding" 
                   style="font-size:16px; color:#0066ff; text-decoration:none;">
                  Complete Setup →
                </a>
              </p>

              <p>If you have any questions, simply reply to this email.</p>

              <p>— LeadLocker Team</p>
            </div>
          `,
        });

        console.log("📧 Onboarding email sent successfully");
      } else {
        console.warn("RESEND_API_KEY not set - skipping onboarding email");
      }
    } catch (emailErr) {
      console.error("❌ Failed to send onboarding email:", emailErr);
    }

    // ---------------------------------------------
    // 7. Auto-login: create a session for them
    // ---------------------------------------------
    const anon = createSupabaseClient(SUPABASE_URL, ANON_KEY);

    const {
      data: sessionData,
      error: loginError,
    } = await anon.auth.signInWithPassword({
      email: contact_email,
      password,
    });

    if (loginError || !sessionData.session) {
      console.error("[Signup] login failed:", loginError);
      return NextResponse.json(
        { error: "Account created but login failed." },
        { status: 500 }
      );
    }

    const session = sessionData.session;
    const accessToken = session.access_token;
    const refreshToken = session.refresh_token;
    const expiresAt = session.expires_at; // seconds since epoch

    // Return JSON response - cookies are set in the response headers
    const res = NextResponse.json({ ok: true, redirect: "/dashboard" });

    // Set Supabase-style cookies so existing middleware + SSR works
    const nowSec = Math.floor(Date.now() / 1000);
    const accessMaxAge =
      typeof expiresAt === "number" && expiresAt > nowSec
        ? expiresAt - nowSec
        : 60 * 60;

    if (accessToken) {
      // Use secure: true only in production (HTTPS), false in development
      // On Vercel, always use secure: true since it's always HTTPS
      const isProduction = process.env.NODE_ENV === "production" || process.env.VERCEL === "1";
      
      const cookieOptions = {
        httpOnly: true,
        secure: isProduction,
        sameSite: "lax" as const,
        path: "/",
        // Don't set domain - let it default to current domain
      };
      
      console.log("[SIGNUP API] 🍪 Setting cookies with options:", {
        ...cookieOptions,
        maxAge_access: accessMaxAge,
        maxAge_session: 60 * 60 * 24 * 7,
        isProduction,
        accessTokenLength: accessToken.length,
      });
      
      res.cookies.set("sb-access-token", accessToken, {
        ...cookieOptions,
        maxAge: accessMaxAge,
      });

      // Also set ll_session for app-level session tracking (7 days)
      res.cookies.set("ll_session", accessToken, {
        ...cookieOptions,
        maxAge: 60 * 60 * 24 * 7,
      });
      
      // Verify cookies were actually set on the response
      const setCookieHeaders = res.headers.get("set-cookie");
      console.log("[SIGNUP API] ✅ Set-Cookie headers:", {
        hasSetCookie: !!setCookieHeaders,
        setCookieCount: setCookieHeaders ? setCookieHeaders.split(", ").length : 0,
        setCookiePreview: setCookieHeaders ? setCookieHeaders.substring(0, 200) : "none",
      });
      
      console.log("[SIGNUP API] ✅ Cookies set successfully:", {
        sb_access_token: "set",
        ll_session: "set",
        secure: isProduction,
        maxAge: accessMaxAge,
        accessTokenLength: accessToken?.length || 0,
        accessTokenPrefix: accessToken?.substring(0, 20) || "none",
        cookieOptions: cookieOptions,
      });
      console.log("[SIGNUP API] 📋 Response headers being set:", {
        hasSetCookie: true,
        cookieCount: 2,
      });
    }

    if (refreshToken) {
      res.cookies.set("sb-refresh-token", refreshToken, {
        httpOnly: true,
        secure: true,
        sameSite: "lax",
        path: "/",
        maxAge: 60 * 60 * 24 * 30,
      });
    }

    console.log("[SIGNUP API] ✅ Returning response with cookies");
    return res;
  } catch (err: any) {
    console.error("[SIGNUP API] ❌ ERROR:", err);
    return NextResponse.json(
      { error: "Server error. Try again." },
      { status: 500 }
    );
  }
}


