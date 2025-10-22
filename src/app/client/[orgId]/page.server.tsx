'use client';

import dynamic from 'next/dynamic';

const DashboardClientWrapper = dynamic(
  () => import('@/components/client/DashboardClientWrapper'),
  { 
    ssr: false, 
    loading: () => (
      <div className="bg-white border border-gray-200 rounded-lg p-8 flex items-center justify-center mb-6">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-3"></div>
          <p className="text-gray-600">Loading dashboard...</p>
        </div>
      </div>
    )
  }
);

export default function ClientPage({ params }: { params: { orgId: string } }) {
  const { orgId } = params;
  return <DashboardClientWrapper orgId={orgId} />;
}