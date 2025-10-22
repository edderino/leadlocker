"use client";
import { use } from "react";
import dynamic from "next/dynamic";

const DashboardClientRoot = dynamic(
  () => import("@/components/client/DashboardClientRoot"),
  { ssr: false, loading: () => <div>Loading dashboard…</div> }
);

export default function ClientPage({ params }: { params: Promise<{ orgId: string }> }) {
  const { orgId } = use(params);  // ✅ unwraps the promise safely
  return <DashboardClientRoot orgId={orgId} />;
}
