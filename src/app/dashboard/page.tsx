 "use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import DashboardClientRoot from "@/components/client/DashboardClientRoot";

export default function DashboardPage() {
  const router = useRouter();
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
        if (data.client) {
          setClient(data.client);
          
          // If forwarding is confirmed but onboarding_complete is false, mark it complete
          if (data.client.forwarding_confirmed && !data.client.onboarding_complete) {
            try {
              await fetch("/api/onboarding/complete", {
                method: "POST",
                credentials: "include",
              });
              // Reload client data after marking complete
              const reloadRes = await fetch("/api/auth/me", {
                method: "GET",
                credentials: "include",
                cache: "no-store",
              });
              const reloadData = await reloadRes.json();
              if (reloadData.client) {
                setClient(reloadData.client);
              }
            } catch (err) {
              console.error("Failed to mark onboarding complete:", err);
            }
          }
          
          // Redirect to onboarding if forwarding not confirmed
          if (!data.client.forwarding_confirmed || !data.client.onboarding_complete) {
            router.push("/onboarding");
            return;
          }
        }
      } catch (err) {
        console.error("Dashboard load error:", err);
      }
      setLoading(false);
    }

    loadClient();
  }, [router]);

  if (loading) {
    return (
      <div className="h-screen w-full flex items-center justify-center text-white bg-black">
        <p>Loading your dashboard...</p>
      </div>
    );
  }

  // Don't render dashboard if forwarding not confirmed
  if (!client?.forwarding_confirmed || !client?.onboarding_complete) {
    return (
      <div className="h-screen w-full flex items-center justify-center text-white bg-black">
        <p>Redirecting to setup...</p>
      </div>
    );
  }

  // Use org_id from client, or fallback to a default
  const orgId = client?.org_id || client?.id || "demo-org";

  return (
    <div className="h-screen w-full overflow-hidden">
      <DashboardClientRoot orgId={orgId} />
    </div>
  );
}



