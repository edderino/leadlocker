import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  // Allow public assets
  if (
    pathname.startsWith('/_next/') ||
    pathname.startsWith('/icons/') ||
    pathname === '/manifest.json' ||
    pathname === '/sw.js' ||
    pathname === '/favicon.ico' ||
    pathname === '/apple-touch-icon.png' ||
    pathname === '/android-chrome-192x192.png' ||
    pathname === '/android-chrome-512x512.png'
  ) {
    return NextResponse.next();
  }

  // 🔥 ALLOW SUPABASE AUTH CALLBACKS (critical)
  if (
    pathname.startsWith('/api/auth/') ||   // your API auth handler
    pathname.startsWith('/auth/') ||       // supabase built-in paths
    pathname.startsWith('/api/supabase/')  // future-proof
  ) {
    return NextResponse.next();
  }

  // Protect client area ONLY after login SESSION exists
  if (pathname.startsWith('/client')) {
    const token = req.cookies.get('sb-access-token')?.value;

    if (!token) {
      const loginUrl = new URL('/login', req.url);
      loginUrl.searchParams.set('redirect', pathname);
      return NextResponse.redirect(loginUrl);
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico).*)',
  ],
};
