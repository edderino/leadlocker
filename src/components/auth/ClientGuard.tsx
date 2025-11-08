"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import { supabase } from "@/libs/supabaseClient";

export default function ClientGuard({
  orgId,
  children,
}: {
  orgId: string;
  children: React.ReactNode;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const [ready, setReady] = useState(false);

  const debugLog = useCallback((...args: unknown[]) => {
    if (process.env.NODE_ENV !== "production") {
      // eslint-disable-next-line no-console
      console.log(...args);
    }
  }, []);

  const redirectTo = useCallback((path: string) => {
    if (typeof window === "undefined") return;
    router.replace(path);

    setTimeout(() => {
      if (window.location.pathname !== new URL(path, window.location.origin).pathname) {
        window.location.assign(path);
      }
    }, 150);
  }, [router]);

  useEffect(() => {
    let mounted = true;

    (async () => {
      const {
        data: { session },
        error: sessionError,
      } = await supabase.auth.getSession();

      if (sessionError) {
        debugLog("[ClientGuard] Session error:", sessionError.message);
      }

      const accessToken = session?.access_token;

      if (!accessToken) {
        redirectTo(`/login?redirectedFrom=${encodeURIComponent(pathname)}`);
        return;
      }

      try {
        const userResponse = await fetch('/api/auth/get-user', {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${accessToken}`,
          },
        });

        if (!userResponse.ok) {
          debugLog('[ClientGuard] Failed to get user, redirecting to login');
          redirectTo(`/login?redirectedFrom=${encodeURIComponent(pathname)}`);
          return;
        }

        const userData = await userResponse.json();

        if (!userData.client_id) {
          debugLog('[ClientGuard] User has no client association. Redirecting to login.');
          redirectTo('/login');
          return;
        }

        if (userData.client_id !== orgId) {
          debugLog('[ClientGuard] Access denied - client_id mismatch:', {
            userClientId: userData.client_id,
            expectedOrgId: orgId
          });
          redirectTo(`/client/${userData.client_id}`);
          return;
        }

        if (mounted) setReady(true);
      } catch (err) {
        console.error('[ClientGuard] Error:', err);
        redirectTo(`/login?redirectedFrom=${encodeURIComponent(pathname)}`);
      }
    })();

    return () => {
      mounted = false;
    };
  }, [pathname, orgId, redirectTo, debugLog]);

  if (!ready) {
    return null; // or a lightweight skeleton if you prefer
  }

  return <>{children}</>;
}

