import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  // 1. Allow all framework assets + static files
  if (
    pathname.startsWith("/_next/") ||
    pathname.startsWith("/static/") ||
    pathname.startsWith("/public/") ||
    pathname.endsWith(".png") ||
    pathname.endsWith(".jpg") ||
    pathname.endsWith(".jpeg") ||
    pathname.endsWith(".svg") ||
    pathname.endsWith(".webp") ||
    pathname.endsWith(".ico")
  ) {
    return NextResponse.next();
  }

  // 2. Allow PWA files
  if (
    pathname === "/manifest.json" ||
    pathname === "/sw.js" ||
    pathname.startsWith("/icons/")
  ) {
    return NextResponse.next();
  }

  // 3. Allow Supabase auth endpoints (critical!)
  if (
    pathname.startsWith("/auth/") ||
    pathname.startsWith("/api/auth/") ||
    pathname.includes("/auth/v1/")
  ) {
    return NextResponse.next();
  }

  // 4. Allow API routes (they check their own auth)
  if (pathname.startsWith("/api/")) {
    return NextResponse.next();
  }

  // 5. Protect ONLY the client dashboard pages
  if (pathname.startsWith("/client")) {
    const token = req.cookies.get("sb-access-token")?.value;

    if (!token) {
      const redirectUrl = new URL("/login", req.url);
      redirectUrl.searchParams.set("redirect", pathname);
      return NextResponse.redirect(redirectUrl);
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!.*\\..*|_next).*)"], // clean + safe
};
