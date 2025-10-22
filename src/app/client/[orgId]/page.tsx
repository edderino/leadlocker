"use client";
import { useEffect, useState } from "react";
import dynamic from "next/dynamic";

const DashboardClientRoot = dynamic(
  () => import("@/components/client/DashboardClientRoot"),
  { ssr: false, loading: () => <div>Loading dashboard...</div> }
);

export default function ClientPage({ params }: { params: Promise<{ orgId: string }> }) {
  // 🧠 Resolve params safely for Next.js 15+
  const [orgId, setOrgId] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      const p = await params;
      setOrgId(p.orgId);
    })();
  }, [params]);

  // 🧱 Wait for orgId before rendering anything
  if (!orgId) return <div>Initializing dashboard...</div>;

  return <AuthorizedDashboard orgId={orgId} />;
}

function AuthorizedDashboard({ orgId }: { orgId: string }) {
  const [authorized, setAuthorized] = useState(false);

  useEffect(() => {
    async function ensureSession() {
      const existing = document.cookie.includes("ll_client_org=");
      if (existing) {
        console.log("[ClientPage] Existing session detected");
        setAuthorized(true);
        return;
      }

      console.log("[ClientPage] Bootstrapping session for org:", orgId);
      try {
        const res = await fetch(`/api/client/invite`, {
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
          console.log("[ClientPage] ✅ Session established");
          setAuthorized(true);
        } else {
          console.error("[ClientPage] ❌ Failed to bootstrap session:", data);
        }
      } catch (err) {
        console.error("[ClientPage] ❌ Error bootstrapping session:", err);
      }
    }

    ensureSession();
  }, [orgId]);

  if (!authorized) return <div>Authorizing {orgId}...</div>;

  // 🧩 Render only after cookie + client hydration
  return <DashboardClientRoot orgId={orgId} />;
}
