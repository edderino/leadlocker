"use client";

import { useEffect, useState } from "react";
import DashboardClientRoot from "@/components/client/DashboardClientRoot";

export default function DashboardPage() {
  const [loading, setLoading] = useState(true);
  const [client, setClient] = useState<any>(null);

  useEffect(() => {
    async function load() {
      try {
        const res = await fetch("/api/auth/me", {
          method: "GET",
          credentials: "include",
        });

        if (!res.ok) {
          window.location.href = "/login";
          return;
        }

        const data = await res.json();

        if (data.client?.onboarding_complete === false) {
          window.location.href = "/onboarding";
          return;
        }

        setClient(data.client);
      } catch (err) {
        window.location.href = "/login";
      } finally {
        setLoading(false);
      }
    }

    load();
  }, []);

  if (loading) {
    return (
      <div className="text-white flex items-center justify-center h-screen">
        Loading dashboard…
      </div>
    );
  }

  // Use org_id from client, or fallback to a default
  const orgId = client?.org_id || client?.id || "demo-org";

  return <DashboardClientRoot orgId={orgId} />;
}



