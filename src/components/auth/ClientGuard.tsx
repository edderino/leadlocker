"use client";

import { useEffect, useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import { createBrowserClient } from "@supabase/ssr";

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

  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );

  useEffect(() => {
    let mounted = true;

    (async () => {
      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (!session) {
        router.replace(`/login?redirectedFrom=${encodeURIComponent(pathname)}`);
        return;
      }

      const { data: user, error } = await supabase
        .from("users")
        .select("client_id")
        .eq("auth_id", session.user.id)
        .single();

      if (error || !user || user.client_id !== orgId) {
        router.replace(`/login?redirectedFrom=${encodeURIComponent(pathname)}`);
        return;
      }

      if (mounted) setReady(true);
    })();

    return () => {
      mounted = false;
    };
  }, [pathname]); // eslint-disable-line react-hooks/exhaustive-deps

  if (!ready) {
    return null; // or a lightweight skeleton if you prefer
  }

  return <>{children}</>;
}

