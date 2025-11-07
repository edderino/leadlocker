import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

// Temporarily disabled - using page-level auth instead
export async function middleware(req: NextRequest) {
  return NextResponse.next();
}

export const config = {
  matcher: ["/client/:path*"],
};

