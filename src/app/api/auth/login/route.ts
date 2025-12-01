import { NextResponse } from "next/server";
import { createClient as createSupabaseClient } from "@supabase/supabase-js";

/**
 * LeadLocker – Login API
 *
 * Authenticates user with Supabase and sets auth cookies
 * compatible with the rest of the app (sb-access-token, sb-refresh-token).
 */

export const runtime = "nodejs";

type LoginBody = {
  email?: string;
  password?: string;
};

export async function POST(req: Request) {
  try {
    const body = (await req.json()) as LoginBody;
    const { email, password } = body;

    if (!email || !password) {
      return NextResponse.json(
        { error: "Missing email or password." },
        { status: 400 }
      );
    }

    const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
    const ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

    if (!SUPABASE_URL || !ANON_KEY) {
      return NextResponse.json(
        { error: "Server auth not fully configured." },
        { status: 500 }
      );
    }

    // Use anon key for user sign-in; RLS + policies still apply.
    const supabase = createSupabaseClient(SUPABASE_URL, ANON_KEY);

    const {
      data: sessionData,
      error: loginError,
    } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (loginError || !sessionData.session) {
      return NextResponse.json(
        { error: "Invalid login credentials." },
        { status: 401 }
      );
    }

    const session = sessionData.session;
    const accessToken = session.access_token;
    const refreshToken = session.refresh_token;
    const expiresAt = session.expires_at; // seconds since epoch

    const res = NextResponse.json({ ok: true, session, token: accessToken });

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
      };
      
      res.cookies.set("sb-access-token", accessToken, {
        ...cookieOptions,
        maxAge: accessMaxAge,
      });
      // Also set ll_session for app-level checks
      res.cookies.set("ll_session", accessToken, {
        ...cookieOptions,
        maxAge: 60 * 60 * 24 * 7, // 7 days
      });
      
      console.log("[LOGIN API] ✅ Cookies set successfully:", {
        sb_access_token: "set",
        ll_session: "set",
        secure: isProduction,
        maxAge: accessMaxAge,
        accessTokenLength: accessToken?.length || 0,
        accessTokenPrefix: accessToken?.substring(0, 20) || "none",
        cookieOptions: cookieOptions,
      });
      console.log("[LOGIN API] 📋 Response headers being set:", {
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

    console.log("[LOGIN API] ✅ Returning response with cookies");
    return res;
  } catch (err) {
    console.error("[LOGIN API] ❌ ERROR:", err);
    return NextResponse.json(
      { error: "Server error. Try again." },
      { status: 500 }
    );
  }
}


