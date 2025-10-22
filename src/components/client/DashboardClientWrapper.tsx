'use client';

import dynamic from 'next/dynamic';

type DashboardClientWrapperProps = {
  orgId: string;
};

const DashboardClientRoot = dynamic(
  () => import('./DashboardClientRoot'),
  { ssr: false }
);

export default function DashboardClientWrapper({ orgId }: DashboardClientWrapperProps) {
  return <DashboardClientRoot orgId={orgId} />;
}