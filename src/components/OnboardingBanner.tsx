"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

type Client = {
  forwarding_confirmed: boolean;
  onboarding_complete: boolean;
  inbound_email: string;
};

export default function OnboardingBanner() {
  const [client, setClient] = useState<Client | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      try {
        const res = await fetch("/api/auth/me", {
          credentials: "include",
          cache: "no-store",
        });
        if (!res.ok) {
          if (!cancelled) setClient(null);
          return;
        }

        const data = await res.json();
        if (!cancelled && data.client) setClient(data.client);
      } catch {
        if (!cancelled) setClient(null);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    load();
    const id = setInterval(load, 5000); // keep live if status changes
    return () => {
      cancelled = true;
      clearInterval(id);
    };
  }, []);

  // While loading, don't flash the banner
  if (loading) return null;

  if (!client) return null;

  const needsOnboarding =
    !client.forwarding_confirmed || !client.onboarding_complete;

  if (!needsOnboarding) return null;

  return (
    <div className="absolute top-0 left-0 right-0 z-50 rounded-b-xl border-b border-yellow-600/40 bg-yellow-600/10 px-4 py-3 text-yellow-200">
      <div className="flex items-center justify-between">
        <div className="text-sm">
          <span className="font-semibold">Email forwarding not fully set up.</span>{" "}
          You won't receive lead alerts until your Gmail forwarding is verified.
        </div>

        <Link
          href="/onboarding"
          className="ml-4 shrink-0 rounded-lg bg-yellow-500 px-3 py-1.5 text-xs font-semibold text-black hover:bg-yellow-400"
        >
          Finish setup →
        </Link>
      </div>
    </div>
  );
}

