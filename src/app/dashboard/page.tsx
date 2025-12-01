"use client";

import { useEffect, useState } from "react";
import DashboardClientRoot from "@/components/client/DashboardClientRoot";

/**
 * Dashboard Page
 * 
 * This page is protected by the dashboard layout which handles:
 * - Authentication checks
 * - Onboarding gate
 * - Client data validation
 * 
 * This component only needs to render the dashboard UI.
 * If this component renders, the user is authenticated and onboarding is complete.
 */
export default function DashboardPage() {
  const [client, setClient] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  // Fetch client data for UI (orgId, etc.)
  // Auth is already validated by the layout
  useEffect(() => {
    async function loadClient() {
      try {
        const res = await fetch("/api/auth/me", {
          credentials: "include",
          cache: "no-store",
        });

        if (res.ok) {
          const data = await res.json();
          if (data.client) {
            setClient(data.client);
          }
        }
      } catch (err) {
        console.error("[Dashboard] Error loading client data:", err);
        // Don't redirect - layout handles auth failures
      } finally {
        setLoading(false);
      }
    }

    loadClient();
  }, []);

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



