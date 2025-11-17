import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(req: NextRequest) {
  const url = req.nextUrl;

  //
  // 1. Allow ALL PUBLIC ASSETS (fixes 401 manifest)
  //
  if (
    url.pathname === '/manifest.json' ||
    url.pathname === '/sw.js' ||
    url.pathname.startsWith('/icons/') ||
    url.pathname.startsWith('/favicon') ||
    url.pathname.startsWith('/android-chrome') ||
    url.pathname.startsWith('/apple-touch-icon')
  ) {
    return NextResponse.next();
  }

  //
  // 2. Protect ONLY client portal
  //
  if (url.pathname.startsWith('/client')) {
    const token = req.cookies.get('sb-access-token')?.value;
    if (!token) {
      const redirect = url.searchParams.get('redirect') || '/client';
      return NextResponse.redirect(
        new URL(`/login?redirect=${redirect}`, req.url)
      );
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico).*)',
  ],
};
