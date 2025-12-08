import { cookies } from 'next/headers';
import type { NextRequest } from 'next/server';
import { createServerClient, type CookieOptions } from '@supabase/ssr';

type VerifiedSession =
  | {
      user: null;
      orgId: null;
      error: string;
    }
  | {
      user: NonNullable<import('@supabase/supabase-js').User>;
      orgId: string | null;
      error: null;
    };

async function createSupabaseServerClient(cookieStore: Awaited<ReturnType<typeof cookies>>) {
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet: { name: string; value: string; options: CookieOptions }[]) {
          cookiesToSet.forEach((cookie) => {
            cookieStore.set(cookie.name, cookie.value, cookie.options);
          });
        },
      },
    },
  );
}

/**
 * Centralised client session verification for API routes.
 *
 * - First tries `Authorization: Bearer <token>`
 * - Falls back to the `sb-access-token` cookie used by @supabase/ssr
 * - Returns the Supabase user + org_id (from user/app metadata) when valid
 */
export async function verifyClientSession(req: NextRequest): Promise<VerifiedSession> {
  try {
    // Get cookies once and reuse
    const cookieStore = await cookies();

    // 1) Try Authorization header
    const authHeader = req.headers.get('authorization');
    let accessToken: string | null = null;

    if (authHeader?.toLowerCase().startsWith('bearer ')) {
      accessToken = authHeader.slice('bearer '.length).trim();
    }

    // 2) Fallback to cookies (check both sb-access-token and ll_session)
    if (!accessToken) {
      accessToken = 
        cookieStore.get('sb-access-token')?.value ?? 
        cookieStore.get('ll_session')?.value ?? 
        null;
    }

    if (!accessToken) {
      return {
        user: null,
        orgId: null,
        error: 'Missing access token (no Authorization header or session cookie)',
      };
    }

    const supabase = await createSupabaseServerClient(cookieStore);

    // Use getSession() which automatically handles token refresh via cookies
    // This is better than getUser(token) because it uses the SSR client's cookie handling
    const { data: sessionData, error: sessionError } = await supabase.auth.getSession();

    if (sessionError || !sessionData?.session?.user) {
      // If session fails, try getUser with the access token as fallback
      const { data, error } = await supabase.auth.getUser(accessToken);
      
      if (error || !data.user) {
        return {
          user: null,
          orgId: null,
          error: error?.message ?? 'Invalid or expired session',
        };
      }

      // Use the user from getUser fallback
      const appMeta = (data.user.app_metadata as any) ?? {};
      const userMeta = (data.user.user_metadata as any) ?? {};
      const orgId: string | null = appMeta.org_id ?? userMeta.org_id ?? null;

      return {
        user: data.user,
        orgId,
        error: null,
      };
    }

    // Use session data (which handles refresh automatically)
    const user = sessionData.session.user;

    // org_id can live in either app_metadata or user_metadata depending on how it was set
    const appMeta = (user.app_metadata as any) ?? {};
    const userMeta = (user.user_metadata as any) ?? {};

    const orgId: string | null =
      appMeta.org_id ?? userMeta.org_id ?? null;

    return {
      user,
      orgId,
      error: null,
    };
  } catch (err) {
    // If cookies() throws or any other error occurs, return error response
    const errorMsg = err instanceof Error ? err.message : String(err);
    console.error('[verifyClientSession] Exception:', errorMsg, err);
    return {
      user: null,
      orgId: null,
      error: `Session verification failed: ${errorMsg}`,
    };
  }
}
