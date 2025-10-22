"use client";
import { use, useEffect, useState } from "react";
import dynamic from "next/dynamic";

const DashboardClientRoot = dynamic(
  () => import("@/components/client/DashboardClientRoot"),
  { ssr: false, loading: () => <div>Loading dashboard...</div> }
);

export default function ClientPage({ params }: { params: Promise<{ orgId: string }> }) {
  const { orgId } = use(params);
  const [authorized, setAuthorized] = useState(false);

  useEffect(() => {
    async function bootstrap() {
      const existing = document.cookie.includes("ll_client_org=");
      if (existing) {
        console.log("[ClientPage] Existing ll_client_org cookie detected.");
        setAuthorized(true);
        return;
      }

      console.log("[ClientPage] No session found, bootstrapping via /api/client/invite...");
      try {
        const res = await fetch(`http://localhost:3000/api/client/invite`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "x-admin-secret": "test-secret-12345",
          },
          body: JSON.stringify({ orgId, phone: "+393514421114" }),
          cache: "no-store",
        });

        const data = await res.json();
        if (data?.inviteUrl) {
          document.cookie = `ll_client_org=${orgId}; path=/; SameSite=Lax`;
          console.log("[ClientPage] ✅ Cookie set successfully for org:", orgId);
          setAuthorized(true);
        } else {
          console.error("[ClientPage] ❌ Invite endpoint failed:", data);
        }
      } catch (err) {
        console.error("[ClientPage] ❌ Bootstrap error:", err);
      }
    }

    bootstrap();
  }, [orgId]);

  if (!authorized) return <div>Authorizing session for {orgId}...</div>;

  return <DashboardClientRoot orgId={orgId} />;
}
