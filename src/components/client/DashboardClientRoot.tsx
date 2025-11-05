'use client';

import React, { useState, useEffect } from 'react';
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

interface DashboardClientRootProps {
  orgId: string;
}

export default function DashboardClientRoot({ orgId }: DashboardClientRootProps) {
  const [leads, setLeads] = useState<Lead[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchLeads = async () => {
      try {
        const response = await fetch(`/api/client/leads?orgId=${orgId}`, {
          headers: {
            'x-client-token': process.env.NEXT_PUBLIC_CLIENT_PORTAL_SECRET || ''
          }
        });
        const data = await response.json();
        
        if (data.success && data.leads) {
          setLeads(data.leads);
        }
      } catch (err) {
        console.error('Error fetching leads:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchLeads();
  }, [orgId]);

  if (loading) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-2 border-slate-900 border-t-transparent"></div>
      </div>
    );
  }

  return <ClientDashboard leads={leads} orgId={orgId} />;
}
