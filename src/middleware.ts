import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { createMiddlewareClient } from "@supabase/auth-helpers-nextjs";

export async function middleware(req: NextRequest) {
  const res = NextResponse.next();
  const supabase = createMiddlewareClient({ req, res });

  const { data: { session }, error } = await supabase.auth.getSession();

  console.log('[Middleware]', req.nextUrl.pathname, 'Session:', session?.user?.email || 'none', 'Error:', error);

  // Protect client routes
  if (req.nextUrl.pathname.startsWith("/client")) {
    if (!session) {
      console.log('[Middleware] No session, redirecting to login');
      const redirectUrl = req.nextUrl.clone();
      redirectUrl.pathname = "/login";
      redirectUrl.searchParams.set("redirectedFrom", req.nextUrl.pathname);
      return NextResponse.redirect(redirectUrl);
    }
    console.log('[Middleware] Session valid, allowing access');
  }

  return res;
}

export const config = {
  matcher: ["/client/:path*"],
};

