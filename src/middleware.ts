import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(req: NextRequest) {
  const url = req.nextUrl;

  // Allow public PWA assets
  const publicFiles = [
    '/manifest.json',
    '/sw.js',
    '/favicon.ico',
    '/icon.png',
    '/apple-touch-icon.png',
    '/android-chrome-192x192.png',
    '/android-chrome-512x512.png'
  ];

  if (publicFiles.includes(url.pathname)) {
    return NextResponse.next();
  }

  // Allow everything under /icons/
  if (url.pathname.startsWith('/icons/')) {
    return NextResponse.next();
  }

  // Protect client portal
  if (url.pathname.startsWith('/client')) {
    const token = req.cookies.get('sb-access-token')?.value;

    if (!token) {
      return NextResponse.redirect(new URL('/login', req.url));
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico).*)',
  ],
};

