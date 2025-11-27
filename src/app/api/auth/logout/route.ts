import { NextResponse } from "next/server";
import { cookies } from "next/headers";

export const runtime = "nodejs";

export async function POST() {
  // Clear any legacy/session cookie if present
  const cookieStore = await cookies();
  cookieStore.set("ll_session", "", {
    httpOnly: true,
    secure: true,
    sameSite: "lax",
    path: "/",
    expires: new Date(0),
  });

  const res = NextResponse.json({ ok: true });

  // Clear Supabase auth cookies
  res.cookies.set("sb-access-token", "", {
    httpOnly: true,
    secure: true,
    sameSite: "lax",
    path: "/",
    maxAge: 0,
  });
  res.cookies.set("sb-refresh-token", "", {
    httpOnly: true,
    secure: true,
    sameSite: "lax",
    path: "/",
    maxAge: 0,
  });

  // If we ever move ll_token to a cookie, clear it here too
  res.cookies.set("ll_token", "", {
    httpOnly: false,
    secure: true,
    sameSite: "lax",
    path: "/",
    maxAge: 0,
  });

  return res;
}



