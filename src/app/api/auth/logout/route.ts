import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { createClient } from "@supabase/supabase-js";

export const runtime = "nodejs";

export async function POST() {
  try {
    const cookieStore = await cookies();
    const token =
      cookieStore.get("ll_session")?.value ||
      cookieStore.get("sb-access-token")?.value;

    // If we have a token, sign out from Supabase to invalidate the session server-side
    if (token) {
      const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
      const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

      if (supabaseUrl && serviceKey) {
        const admin = createClient(supabaseUrl, serviceKey, {
          auth: { persistSession: false },
        });

        // Get user ID from token
        const { data: userRes } = await admin.auth.getUser(token);
        if (userRes?.user) {
          // Sign out the user in Supabase (invalidates all sessions)
          await admin.auth.admin.signOut(userRes.user.id);
        }
      }
    }

    // Clear all cookies
    const res = NextResponse.json({ ok: true });

    // Clear all possible session cookies
    const cookieNames = [
      "ll_session",
      "sb-access-token",
      "sb-refresh-token",
      "ll_token",
      "sb-auth-token", // Legacy
    ];

    cookieNames.forEach((name) => {
      res.cookies.set(name, "", {
        httpOnly: name !== "ll_token",
        secure: true,
        sameSite: "lax",
        path: "/",
        maxAge: 0,
        expires: new Date(0),
      });
    });

    return res;
  } catch (err) {
    console.error("[Logout] Error:", err);
    // Still clear cookies even if Supabase signout fails
    const res = NextResponse.json({ ok: true });
    res.cookies.set("ll_session", "", { maxAge: 0, path: "/" });
    res.cookies.set("sb-access-token", "", { maxAge: 0, path: "/" });
    res.cookies.set("sb-refresh-token", "", { maxAge: 0, path: "/" });
    return res;
  }
}



