import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

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
    // apply middleware globally EXCEPT known static dirs
    "/((?!_next/static|_next/image|favicon.ico).*)",
  ]
};
