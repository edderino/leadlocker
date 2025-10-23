'use client';

import React, { useState, useEffect } from 'react';
import NotificationManager from './NotificationManager';
import AISuggestions from './AISuggestions';
import AdvancedAnalytics from './AdvancedAnalytics';
import ClientDashboard from './ClientDashboard';

interface Lead {
  id: string;
  name: string;
  phone: string;
  source: string;
  description: string | null;
  status: 'NEW' | 'APPROVED' | 'COMPLETED';
  created_at: string;
}

// props
export interface DashboardClientRootProps {
  orgId: string;
  leads: any[]; // keep it any[] for now; we can tighten later
}

// component
export default function DashboardClientRoot({ orgId, leads: initialLeads }: DashboardClientRootProps) {
  const [leads, setLeads] = useState<Lead[]>(initialLeads || []);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // For new clients, start with empty leads - they'll get populated when leads are added
    console.log('[DashboardClientRoot] Initializing dashboard for org:', orgId);
    setLeads(initialLeads || []);
    setLoading(false);
  }, [orgId, initialLeads]);

  if (loading) {
    return (
      <div className="bg-white border border-gray-200 rounded-lg p-8 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-3"></div>
          <p className="text-gray-600">Loading dashboard data...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-6">
        <div className="flex items-start gap-3">
          <div className="flex-shrink-0">
            <svg className="h-6 w-6 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <div>
            <h3 className="text-sm font-medium text-red-800">Error loading dashboard</h3>
            <p className="text-sm text-red-600 mt-1">{error}</p>
            <button
              onClick={() => window.location.reload()}
              className="mt-3 text-sm text-red-700 hover:text-red-800 underline"
            >
              Reload page
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <>
      {/* Push Notification Manager */}
      <div className="mb-6">
        <NotificationManager orgId={orgId} />
      </div>

      {/* AI Suggestions */}
      <div className="mb-6">
        <AISuggestions orgId={orgId} />
      </div>

      {/* Advanced Analytics Dashboard */}
      <div className="mb-6">
        <AdvancedAnalytics orgId={orgId} />
      </div>

      {/* Dashboard Content */}
      <ClientDashboard leads={leads} orgId={orgId} />
    </>
  );
}
