'use client';

import React, { useEffect } from 'react';
import { createClient } from '@/utils/supabase/client';
import ClientDashboard from './ClientDashboardV5';
import { useLeadsStore } from '@/store/useLeadsStore';

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
  const leads = useLeadsStore((s) => s.leads);
  const loading = useLeadsStore((s) => s.isLoading);
  const error = useLeadsStore((s) => s.error);
  const setInitialLeads = useLeadsStore((s) => s.setInitialLeads);
  const setLeads = useLeadsStore((s) => s.setLeads);
  const startLoading = useLeadsStore((s) => s.startLoading);
  const setError = useLeadsStore((s) => s.setError);

  // Hydrate the store with initial empty state
  useEffect(() => {
    setInitialLeads(orgId, []);
  }, [orgId, setInitialLeads]);

  useEffect(() => {
    let mounted = true;
    const supabase = createClient();

    async function loadLeads() {
      if (!mounted) return;

      startLoading();

      try {
        // 1) Wait for Supabase session token to be ready
        const { data: { session } } = await supabase.auth.getSession();
        
        if (!session?.access_token) {
          console.warn("⏳ No session yet — waiting before fetch");
          setTimeout(() => {
            if (mounted) loadLeads();
          }, 500); // retry after 0.5s
          return;
        }

        console.log("🧠 Session ready, fetching leads...");

        // 2) call the API with Authorization: Bearer <token>
        const res = await fetch("/api/client/leads", {
          headers: {
            "Authorization": `Bearer ${session.access_token}`,
          },
          cache: "no-store",
        });

        if (!res.ok) {
          const errorText = await res.text();
          console.error("[Leads] API error", errorText);
          if (mounted) {
            setError("Failed to load leads");
          }
          return;
        }

        const json = await res.json();
        console.log("✅ Leads fetched:", json);
        
        if (mounted) {
          setLeads(json.leads ?? []);
          console.log('[DashboardClientRoot] Loaded leads:', json.leads?.length || 0);
        }
      } catch (err: any) {
        console.error('[DashboardClientRoot] Error fetching leads:', err);
        if (mounted) {
          setError(err?.message || 'Failed to load leads');
        }
      }
    }

    loadLeads();

    return () => {
      mounted = false;
    };
  }, [orgId, startLoading, setLeads, setError]);

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
