'use client';

import React, { useState, useEffect } from 'react';
import { supabase } from '@/libs/supabaseClient';
import ClientDashboard from './ClientDashboardV5';

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
        const {
          data: { session },
          error: sessionError,
        } = await supabase.auth.getSession();

        if (sessionError) {
          console.error('[DashboardClientRoot] Session error:', sessionError.message);
          setError('Authentication error. Please log in again.');
          return;
        }

        const accessToken = session?.access_token;

        if (!accessToken) {
          console.error('[DashboardClientRoot] No access token found');
          setError('You must be signed in to view this page.');
          return;
        }

        const response = await fetch(`/api/client/leads?orgId=${orgId}`, {
          cache: 'no-store',
          headers: {
            Authorization: `Bearer ${accessToken}`,
          },
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
      <div className="min-h-screen bg-gradient-to-br from-[#0c0f15] via-[#161b22] to-[#0c0f15] p-6">
        <div className="animate-pulse space-y-6">
          <div className="h-8 bg-neutral-800 rounded w-48"></div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {[...Array(6)].map((_, i) => (
              <div
                key={i}
                className="h-40 bg-neutral-900/80 border border-neutral-800 rounded-md shadow-[0_0_15px_rgba(255,255,255,0.05)]"
              >
                <div className="p-5 space-y-3">
                  <div className="h-4 bg-neutral-800 rounded w-2/3"></div>
                  <div className="h-3 bg-neutral-800 rounded w-1/2"></div>
                  <div className="h-3 bg-neutral-800 rounded w-3/4"></div>
                </div>
              </div>
            ))}
          </div>
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

  return <ClientDashboard leads={leads} orgId={orgId} />;
}
