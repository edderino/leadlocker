'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/libs/supabaseClient';
import toast from 'react-hot-toast';
import { timeAgo } from '@/libs/time';

type LeadStatus = 'NEW' | 'APPROVED' | 'COMPLETED';

interface Lead {
  id: string;
  user_id: string;
  source: string;
  name: string;
  phone: string;
  description: string;
  status: LeadStatus;
  created_at: string;
}

// Status display mapping for tradie-friendly labels
const getStatusDisplay = (status: LeadStatus): { label: string; color: string } => {
  if (status === 'NEW') {
    return { label: 'Needs attention', color: 'bg-red-100 text-red-800' };
  }
  // APPROVED and COMPLETED both show as "Reconciled"
  return { label: 'Reconciled', color: 'bg-green-100 text-green-800' };
};

export default function LeadList() {
  const [leads, setLeads] = useState<Lead[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [updatingLeadId, setUpdatingLeadId] = useState<string | null>(null);
  
  // Initialize from localStorage with SSR safety
  const [search, setSearch] = useState(() => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('LL_SEARCH') || '';
    }
    return '';
  });
  
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'NEEDS_ATTENTION' | 'RECONCILED'>(() => {
    if (typeof window !== 'undefined') {
      return (localStorage.getItem('LL_STATUS') as 'ALL' | 'NEEDS_ATTENTION' | 'RECONCILED') || 'ALL';
    }
    return 'ALL';
  });

  useEffect(() => {
    async function fetchLeads() {
      try {
        const { data, error } = await supabase
          .from('leads')
          .select('*')
          .order('created_at', { ascending: false });

        if (error) throw error;

        setLeads(data || []);
      } catch (err) {
        console.error('Error fetching leads:', err);
        setError('Failed to load leads');
      } finally {
        setLoading(false);
      }
    }

    fetchLeads();
  }, []);

  // Persist search filter to localStorage
  useEffect(() => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('LL_SEARCH', search);
    }
  }, [search]);

  // Persist status filter to localStorage
  useEffect(() => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('LL_STATUS', statusFilter);
    }
  }, [statusFilter]);

  const handleStatusUpdate = async (leadId: string, newStatus: LeadStatus) => {
    setUpdatingLeadId(leadId);

    // Store original lead for rollback
    const originalLeads = [...leads];
    
    // Optimistic update
    setLeads(prevLeads =>
      prevLeads.map(lead =>
        lead.id === leadId ? { ...lead, status: newStatus } : lead
      )
    );

    try {
      const response = await fetch('/api/leads/status', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          id: leadId,
          status: newStatus,
        }),
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.error || 'Failed to update status');
      }

      toast.success('Status updated');
    } catch (error) {
      console.error('Error updating status:', error);
      
      // Rollback on error
      setLeads(originalLeads);
      
      const message = error instanceof Error ? error.message : 'Failed to update status';
      toast.error(message);
    } finally {
      setUpdatingLeadId(null);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center p-8">
        <div className="text-gray-600">Loading leads...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex justify-center items-center p-8">
        <div className="text-red-600">{error}</div>
      </div>
    );
  }

  // Apply filters
  const filteredLeads = leads.filter((lead) => {
    // Text search filter
    const searchLower = search.toLowerCase();
    const matchesSearch = 
      search === '' ||
      lead.name.toLowerCase().includes(searchLower) ||
      lead.phone.toLowerCase().includes(searchLower) ||
      lead.source.toLowerCase().includes(searchLower);

    // Status filter - map UI labels to backend statuses
    let matchesStatus = true;
    if (statusFilter === 'NEEDS_ATTENTION') {
      matchesStatus = lead.status === 'NEW';
    } else if (statusFilter === 'RECONCILED') {
      matchesStatus = lead.status === 'APPROVED' || lead.status === 'COMPLETED';
    }

    return matchesSearch && matchesStatus;
  });

  // Sort leads: "Needs attention" (NEW) first, then by created_at DESC
  const sortedLeads = [...filteredLeads].sort((a, b) => {
    // First priority: "Needs attention" (NEW) comes first
    const aIsNew = a.status === 'NEW' ? 1 : 0;
    const bIsNew = b.status === 'NEW' ? 1 : 0;
    if (aIsNew !== bIsNew) return bIsNew - aIsNew;
    
    // Second priority: newest first within each group
    return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
  });

  if (leads.length === 0) {
    return (
      <div className="flex justify-center items-center p-8">
        <div className="text-gray-500">No leads found</div>
      </div>
    );
  }

  return (
    <div>
      {/* Filter Controls */}
      <div className="mb-4 flex flex-col sm:flex-row gap-3">
        {/* Search Input */}
        <div className="flex-1">
          <input
            type="text"
            placeholder="Search by name, phone, or source..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          />
        </div>

        {/* Status Dropdown */}
        <div className="sm:w-48">
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as 'ALL' | 'NEEDS_ATTENTION' | 'RECONCILED')}
            className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white"
          >
            <option value="ALL">All Status</option>
            <option value="NEEDS_ATTENTION">Needs attention</option>
            <option value="RECONCILED">Reconciled</option>
          </select>
        </div>
      </div>

      {/* Empty State for Filtered Results */}
      {sortedLeads.length === 0 ? (
        <div className="flex justify-center items-center p-8 border border-gray-200 rounded-lg bg-gray-50">
          <div className="text-gray-500">No leads match your filters</div>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="min-w-full bg-white border border-gray-200 rounded-lg shadow-sm">
        <thead className="bg-gray-50">
          <tr>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Name
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Phone
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Source
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Description
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Status
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Submitted
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Actions
            </th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-200">
          {sortedLeads.map((lead) => {
            const isUpdating = updatingLeadId === lead.id;
            const statusDisplay = getStatusDisplay(lead.status);
            
            return (
              <tr key={lead.id} className="hover:bg-gray-50">
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                  {lead.name}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm">
                  <a href={`tel:${lead.phone}`} className="text-blue-600 hover:underline">
                    {lead.phone}
                  </a>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                  {lead.source}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                  {lead.description || '—'}
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span className={`px-2 py-1 text-xs font-semibold rounded-full ${statusDisplay.color}`}>
                    {statusDisplay.label}
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500" title={new Date(lead.created_at).toLocaleString()}>
                  {timeAgo(lead.created_at)}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm">
                  {lead.status === 'NEW' && (
                    <button
                      onClick={() => handleStatusUpdate(lead.id, 'APPROVED')}
                      disabled={isUpdating}
                      className={`px-3 py-1 text-sm font-medium rounded-md border transition-colors ${
                        isUpdating
                          ? 'border-gray-300 text-gray-400 cursor-not-allowed'
                          : 'border-blue-500 text-blue-600 hover:bg-blue-50 focus:outline-none focus:ring-2 focus:ring-blue-500'
                      }`}
                    >
                      {isUpdating ? '...' : 'Approve'}
                    </button>
                  )}
                  {lead.status === 'APPROVED' && (
                    <button
                      onClick={() => handleStatusUpdate(lead.id, 'COMPLETED')}
                      disabled={isUpdating}
                      className={`px-3 py-1 text-sm font-medium rounded-md transition-colors ${
                        isUpdating
                          ? 'bg-gray-400 text-white cursor-not-allowed'
                          : 'bg-blue-600 text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500'
                      }`}
                    >
                      {isUpdating ? '...' : 'Complete'}
                    </button>
                  )}
                  {lead.status === 'COMPLETED' && (
                    <span className="text-gray-400 text-xs">—</span>
                  )}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
        </div>
      )}
    </div>
  );
}

