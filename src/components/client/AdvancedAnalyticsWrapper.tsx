'use client';

import dynamic from 'next/dynamic';

// Dynamic import for AdvancedAnalytics to prevent SSR issues with Recharts
const AdvancedAnalytics = dynamic(
  () => import('@/components/client/AdvancedAnalyticsClient'),
  { 
    ssr: false, 
    loading: () => (
      <div className="bg-white border border-gray-200 rounded-lg p-8 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-3"></div>
          <p className="text-gray-600">Loading advanced analytics...</p>
        </div>
      </div>
    )
  }
);

interface AdvancedAnalyticsWrapperProps {
  orgId: string;
}

export default function AdvancedAnalyticsWrapper({ orgId }: AdvancedAnalyticsWrapperProps) {
  return <AdvancedAnalytics orgId={orgId} />;
}
