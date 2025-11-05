'use client';

import React, { useState, useEffect } from 'react';
import NotificationManager from './NotificationManager';
import AISuggestions from './AISuggestions';
import AdvancedAnalytics from './AdvancedAnalytics';
import ClientDashboard from './ClientDashboardV2';

interface Lead {
  id: string;
  name: string;
  phone: string;
  source: string;
  description: string | null;
  status: 'NEW' | 'APPROVED' | 'COMPLETED';
  created_at: string;
}

interface DashboardClientRootProps {
  orgId: string;
}

export default function DashboardClientRoot({ orgId }: DashboardClientRootProps) {
  const [leads, setLeads] = useState<Lead[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchLeads = async () => {
      try {
        console.log('[DashboardClientRoot] Fetching leads for org:', orgId);
        const response = await fetch(`/api/client/leads?orgId=${orgId}`, {
          headers: {
            'x-client-token': process.env.NEXT_PUBLIC_CLIENT_PORTAL_SECRET || ''
          }
        });
        const data = await response.json();
        
        if (data.success && data.leads) {
          setLeads(data.leads);
          console.log('[DashboardClientRoot] Loaded leads:', data.leads.length);
        } else {
          setError(data.error || 'Failed to load leads');
        }
      } catch (err: any) {
        console.error('[DashboardClientRoot] Error fetching leads:', err);
        setError(err.message || 'Failed to load leads');
      } finally {
        setLoading(false);
      }
    };

    fetchLeads();
  }, [orgId]);

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
