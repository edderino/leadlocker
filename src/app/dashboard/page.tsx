"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import DashboardClientRoot from "@/components/client/DashboardClientRoot";

export default function DashboardPage() {
  const router = useRouter();
  const [client, setClient] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        // Explicitly include credentials (cookies) in the request
        const res = await fetch("/api/auth/me", {
          credentials: "include",
          cache: "no-store",
        });

        const data = await res.json();

        if (!res.ok || !data.client) {
          console.error("[Dashboard] Auth check failed:", data.error || "No client");
          router.push("/login");
          return;
        }

        setClient(data.client);
        setLoading(false);
      } catch (err) {
        console.error("[Dashboard] Error loading client:", err);
        router.push("/login");
      }
    }

    load();
  }, [router]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <p className="text-gray-600">Loading...</p>
      </div>
    );
  }

  // Use org_id from client, or fallback to a default
  const orgId = client?.org_id || client?.id || "demo-org";

  return <DashboardClientRoot orgId={orgId} />;
}



