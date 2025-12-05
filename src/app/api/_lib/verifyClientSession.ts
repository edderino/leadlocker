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

async function createSupabaseServerClient() {
  const cookieStore = await cookies();

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
  // 1) Try Authorization header
  const authHeader = req.headers.get('authorization');
  let accessToken: string | null = null;

  if (authHeader?.toLowerCase().startsWith('bearer ')) {
    accessToken = authHeader.slice('bearer '.length).trim();
  }

  // 2) Fallback to cookies (check both sb-access-token and ll_session)
  if (!accessToken) {
    const cookieStore = await cookies();
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

  const supabase = await createSupabaseServerClient();

  const { data, error } = await supabase.auth.getUser(accessToken);

  if (error || !data.user) {
    return {
      user: null,
      orgId: null,
      error: error?.message ?? 'Invalid or expired session',
    };
  }

  // org_id can live in either app_metadata or user_metadata depending on how it was set
  const appMeta = (data.user.app_metadata as any) ?? {};
  const userMeta = (data.user.user_metadata as any) ?? {};

  const orgId: string | null =
    appMeta.org_id ?? userMeta.org_id ?? null;

  return {
    user: data.user,
    orgId,
    error: null,
  };
}
