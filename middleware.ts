import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

/**
 * LeadLocker Middleware
 * - Protects dashboard and lead routes
 * - Reads auth cookie
 * - Redirects if missing
 * - Keeps static/assets and build safe
 */

export function middleware(req: NextRequest) {
  const url = req.nextUrl;

  // Prefer app-level session, then Supabase access token
  const token =
    req.cookies.get("ll_session")?.value ||
    req.cookies.get("sb-access-token")?.value;

  const isProtected =
    url.pathname.startsWith("/dashboard") ||
    url.pathname.startsWith("/leads") ||
    url.pathname === "/";

  // Not logged in → redirect to /login
  if (isProtected && !token) {
    const loginUrl = new URL("/login", req.url);
    loginUrl.searchParams.set("from", url.pathname);
    return NextResponse.redirect(loginUrl);
  }

  // Logged in → prevent access to /login or /signup
  const isAuthPage =
    url.pathname.startsWith("/login") ||
    url.pathname.startsWith("/signup");

  if (isAuthPage && token) {
    const dashUrl = new URL("/dashboard", req.url);
    return NextResponse.redirect(dashUrl);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/", "/login", "/signup", "/dashboard/:path*", "/leads/:path*"],
};

