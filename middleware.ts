import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export function middleware(req: NextRequest) {
  const path = req.nextUrl.pathname;

  // Public routes (no auth required)
  const publicPaths = ["/login", "/signup", "/api/auth/login", "/api/auth/signup"];
  const isPublic = publicPaths.some((p) => path.startsWith(p));
  const isApi = path.startsWith("/api");

  // Read token from cookies (prefer explicit ll_token, fallback to sb-access-token)
  const cookieToken =
    req.cookies.get("ll_token")?.value ||
    req.cookies.get("sb-access-token")?.value;

  // If user hits a protected page without a token → redirect to login
  if (!isPublic && !isApi && !cookieToken) {
    const loginUrl = new URL("/login", req.url);
    loginUrl.searchParams.set("from", path);
    return NextResponse.redirect(loginUrl);
  }

  // If logged in and tries to access /login or /signup → send to dashboard
  if (cookieToken && (path === "/login" || path === "/signup")) {
    return NextResponse.redirect(new URL("/dashboard", req.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/dashboard/:path*", // protect dashboard + nested routes
    "/login",
    "/signup",
  ],
};

import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  // --- Allow inbound Resend webhook ---
  if (pathname.startsWith("/api/inbound/email")) {
    return NextResponse.next();
  }

  // --- 1. Allow all PWA public assets ---
  if (
    pathname === "/manifest.json" ||
    pathname === "/sw.js" ||
    pathname.startsWith("/icons/") ||
    pathname.startsWith("/_next/static/") ||
    pathname.startsWith("/android-chrome") ||
    pathname.startsWith("/apple-touch-icon")
  ) {
    return NextResponse.next();
  }

  // --- 2. Protect /client routes only ---
  if (pathname.startsWith("/client")) {
    const token = req.cookies.get("sb-access-token")?.value;

    if (!token) {
      const url = new URL("/login", req.url);
      url.searchParams.set("redirect", pathname);
      return NextResponse.redirect(url);
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico).*)",
  ]
};
