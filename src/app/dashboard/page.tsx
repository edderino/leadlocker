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
        console.log("[Dashboard] Starting auth check...");
        
        // Explicitly include credentials (cookies) in the request
        const res = await fetch("/api/auth/me", {
          credentials: "include",
          cache: "no-store",
        });

        console.log("[Dashboard] Auth check response status:", res.status);

        const data = await res.json();
        console.log("[Dashboard] Auth check response data:", data);

        if (!res.ok || !data.client) {
          console.error("[Dashboard] Auth check failed:", {
            status: res.status,
            error: data.error || "No client",
            details: data.details,
            code: data.code,
            hint: data.hint,
            fullResponse: data,
          });
          
          // If no client row exists, redirect to signup with a message
          if (data.error?.includes("No client") || data.error?.includes("client account")) {
            console.log("[Dashboard] Redirecting to signup (no client)");
            router.push("/signup?error=no_client");
            return;
          }
          
          console.log("[Dashboard] Redirecting to login");
          router.push("/login");
          return;
        }

        console.log("[Dashboard] Auth check successful, client:", data.client);
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



