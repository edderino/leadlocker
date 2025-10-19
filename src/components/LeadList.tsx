'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/libs/supabaseClient';
import toast from 'react-hot-toast';

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

export default function LeadList() {
  const [leads, setLeads] = useState<Lead[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [updatingLeadId, setUpdatingLeadId] = useState<string | null>(null);

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

  if (leads.length === 0) {
    return (
      <div className="flex justify-center items-center p-8">
        <div className="text-gray-500">No leads found</div>
      </div>
    );
  }

  return (
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
              Created
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Actions
            </th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-200">
          {leads.map((lead) => {
            const isUpdating = updatingLeadId === lead.id;
            
            return (
              <tr key={lead.id} className="hover:bg-gray-50">
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                  {lead.name}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                  {lead.phone}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                  {lead.source}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                  {lead.description || '—'}
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span
                    className={`px-2 py-1 text-xs font-semibold rounded-full ${
                      lead.status === 'NEW'
                        ? 'bg-blue-100 text-blue-800'
                        : lead.status === 'APPROVED'
                        ? 'bg-green-100 text-green-800'
                        : lead.status === 'COMPLETED'
                        ? 'bg-purple-100 text-purple-800'
                        : 'bg-gray-100 text-gray-800'
                    }`}
                  >
                    {lead.status}
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {new Date(lead.created_at).toLocaleDateString()}
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
  );
}

