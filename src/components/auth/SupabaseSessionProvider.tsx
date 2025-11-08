"use client";

import { useEffect } from "react";
import { supabase } from "@/libs/supabaseClient";

export default function SupabaseSessionProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  useEffect(() => {
    if (!supabase) return;

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, session) => {
      // session auto-saves to localStorage; this ensures cookies stay updated
      if (event === "SIGNED_OUT") {
        window.location.href = "/login";
      }
    });

    return () => subscription.unsubscribe();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  return <>{children}</>;
}

