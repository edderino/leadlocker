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
      <div className="p-8 text-white bg-black min-h-screen">
        <p>Loading your dashboard...</p>
      </div>
    );
  }

  // Use org_id from client, or fallback to a default
  const orgId = client?.org_id || client?.id || "demo-org";

  return (
    <div className="min-h-screen bg-black text-white p-8">
      <OnboardingBanner />

      {/* Main dashboard content */}
      <h1 className="text-3xl font-bold mb-6">Dashboard</h1>
      <p className="mb-8">
        Welcome back, {client?.owner_name || client?.business_name || "User"}.
      </p>

      <DashboardClientRoot orgId={orgId} />
    </div>
  );
}



