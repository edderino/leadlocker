"use client";
import { use, useEffect } from "react";
import dynamic from "next/dynamic";

const DashboardClientRoot = dynamic(
  () => import("@/components/client/DashboardClientRoot"),
  { ssr: false, loading: () => <div>Loading dashboard…</div> }
);

export default function ClientPage({ params }: { params: Promise<{ orgId: string }> }) {
  const { orgId } = use(params);  // ✅ unwraps the promise safely

  // ✅ Ensure cookie exists client-side
  useEffect(() => {
    const existing = document.cookie.includes("ll_client_org=");
    if (!existing) {
      document.cookie = `ll_client_org=${orgId}; path=/; SameSite=Lax`;
      console.log("[ClientPage] ll_client_org cookie set for org:", orgId);
    } else {
      console.log("[ClientPage] ll_client_org cookie already exists");
    }
  }, [orgId]);

  return <DashboardClientRoot orgId={orgId} />;
}
