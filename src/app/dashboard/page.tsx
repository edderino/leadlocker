 "use client";

import { useEffect, useState } from "react";
import DashboardClientRoot from "@/components/client/DashboardClientRoot";
import OnboardingBanner from "@/components/OnboardingBanner";

export default function DashboardPage() {
  const [client, setClient] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadClient() {
      try {
        const res = await fetch("/api/auth/me", {
          method: "GET",
          credentials: "include",
          cache: "no-store",
        });

        const data = await res.json();
        if (data.client) setClient(data.client);
      } catch (err) {
        console.error("Dashboard load error:", err);
      }
      setLoading(false);
    }

    loadClient();

    // also refresh every 10 sec — ensures banner disappears shortly after forwarding
    const interval = setInterval(loadClient, 10000);
    return () => clearInterval(interval);
  }, []);

  if (loading) {
    return (
      <div className="h-screen w-full flex items-center justify-center text-white bg-black">
        <p>Loading your dashboard...</p>
      </div>
    );
  }

  // Use org_id from client, or fallback to a default
  const orgId = client?.org_id || client?.id || "demo-org";

  return (
    <div className="h-screen w-full overflow-hidden relative">
      <OnboardingBanner />
      <DashboardClientRoot orgId={orgId} />
    </div>
  );
}



