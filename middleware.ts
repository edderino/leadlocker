import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(req: NextRequest) {
  const url = req.nextUrl;
  const path = url.pathname;

  // ⭐ Allow ALL PWA assets through with ZERO auth
  if (
    path === '/manifest.json' ||
    path === '/sw.js' ||
    path.startsWith('/icons/') ||
    path.endsWith('.png') ||
    path.endsWith('.ico') ||
    path.endsWith('.webmanifest')
  ) {
    return NextResponse.next();
  }

  // ⭐ Public routes that must never be protected
  if (path === '/login' || path === '/') {
    return NextResponse.next();
  }

  // ⭐ Protect only the client portal
  if (path.startsWith('/client')) {
    const token = req.cookies.get('sb-access-token')?.value;

    if (!token) {
      const login = new URL('/login', req.url);
      login.searchParams.set('redirect', path);
      return NextResponse.redirect(login);
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/((?!_next/static|_next/image).*)'],
};
