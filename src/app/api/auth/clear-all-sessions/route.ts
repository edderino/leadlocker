import { NextResponse } from "next/server";
import { cookies } from "next/headers";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * Nuclear option: Clear ALL cookies and localStorage
 * Use this if you're stuck in a wrong account
 */
export async function POST() {
  const res = NextResponse.json({ 
    ok: true, 
    message: "All sessions cleared. Please clear browser localStorage manually." 
  });

  // Clear all possible cookies
  const cookieNames = [
    "ll_session",
    "sb-access-token",
    "sb-refresh-token",
    "ll_token",
    "sb-auth-token",
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
}

