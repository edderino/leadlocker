import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

/**
 * Middleware: protect the client portal.
 *
 * - Only runs on /client/*
 * - Checks for the sb-access-token cookie set by @supabase/ssr
 * - If missing, sends user to /login?redirect=/client/...
 * - Does NOT touch /api/*, /manifest.json, /sw.js, etc.
 */
export function middleware(req: NextRequest) {
  const token = req.cookies.get('sb-access-token')?.value;

  if (!token) {
    const loginUrl = new URL('/login', req.url);

    // Preserve where they were trying to go
    const redirectPath = req.nextUrl.pathname + req.nextUrl.search;
    loginUrl.searchParams.set('redirect', redirectPath);

    return NextResponse.redirect(loginUrl);
  }

  return NextResponse.next();
}

export const config = {
  // Only guard the client portal; everything else (PWA assets, APIs, etc.) bypasses middleware
  matcher: ['/client/:path*'],
};
