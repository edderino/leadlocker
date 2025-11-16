'use client';

import React, { useState, useEffect } from 'react';
import { createBrowserClient } from '@supabase/ssr';
import ClientDashboard from './ClientDashboardV5';

const supabase = createBrowserClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

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

  async function loadLeads() {
    setLoading(true);
    setError(null);

    try {
      // 1) get Supabase session token
      const { data: { session } } = await supabase.auth.getSession();
      console.log("🧠 Session check:", session?.access_token ? "✅ Token present" : "❌ No token");
      
      if (!session) {
        window.location.href = "/login";
        return;
      }

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
        setError("Failed to load leads");
        setLeads([]);
        setLoading(false);
        return;
      }

      const json = await res.json();
      setLeads(json.leads ?? []);
      console.log('[DashboardClientRoot] Loaded leads:', json.leads?.length || 0);
    } catch (err: any) {
      console.error('[DashboardClientRoot] Error fetching leads:', err);
      setError(err.message || 'Failed to load leads');
      setLeads([]);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadLeads();
  }, []);

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
