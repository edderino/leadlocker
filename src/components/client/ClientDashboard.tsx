'use client';

import { useRouter } from 'next/navigation';
import { RefreshCw } from 'lucide-react';
import { useState } from 'react';
import ClientSummary from './ClientSummary';
import ClientLeadList from './ClientLeadList';

interface Lead {
  id: string;
  name: string;
  phone: string;
  source: string;
  description: string | null;
  status: 'NEW' | 'APPROVED' | 'COMPLETED';
  created_at: string;
}

interface ClientDashboardProps {
  leads: Lead[];
  orgId: string;
}

export default function ClientDashboard({ leads, orgId }: ClientDashboardProps) {
  const router = useRouter();
  const [isRefreshing, setIsRefreshing] = useState(false);

  const handleRefresh = async () => {
    setIsRefreshing(true);
    router.refresh();
    
    // Reset refresh state after a delay
    setTimeout(() => {
      setIsRefreshing(false);
    }, 1000);
  };

  // Empty state
  if (leads.length === 0) {
    return (
      <div className="space-y-6">
        {/* Summary Cards - All zeros */}
        <ClientSummary leads={[]} />

        {/* Empty State Card */}
        <div className="bg-white shadow-md rounded-lg border border-gray-200 p-12 text-center">
          <div className="mx-auto w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center mb-4">
            <svg
              className="w-12 h-12 text-gray-400"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
              />
            </svg>
          </div>
          <h3 className="text-lg font-semibold text-gray-900 mb-2">
            No leads yet
          </h3>
          <p className="text-sm text-gray-500">
            Leads for organization <span className="font-mono font-medium">{orgId}</span> will appear here when available.
          </p>
          <button
            onClick={handleRefresh}
            disabled={isRefreshing}
            className="mt-6 inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-md hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <RefreshCw className={`h-4 w-4 ${isRefreshing ? 'animate-spin' : ''}`} />
            Refresh
          </button>
        </div>
      </div>
    );
  }

  // Normal state with data
  return (
    <div className="space-y-6">
      {/* Refresh Button */}
      <div className="flex justify-end">
        <button
          onClick={handleRefresh}
          disabled={isRefreshing}
          className="inline-flex items-center gap-2 px-4 py-2 bg-white border border-gray-300 text-sm font-medium text-gray-700 rounded-md hover:bg-gray-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed shadow-sm"
        >
          <RefreshCw className={`h-4 w-4 ${isRefreshing ? 'animate-spin' : ''}`} />
          Refresh
        </button>
      </div>

      {/* Grid Layout */}
      <div className="grid gap-6 md:grid-cols-3">
        {/* Summary Cards - Takes 1 column */}
        <div className="md:col-span-1">
          <ClientSummary leads={leads} />
        </div>

        {/* Lead List - Takes 2 columns */}
        <div className="md:col-span-2">
          <ClientLeadList leads={leads} />
        </div>
      </div>
    </div>
  );
}

