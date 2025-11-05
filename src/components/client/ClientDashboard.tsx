'use client';

import { useState } from 'react';
import { Search, Filter, MoreVertical, Mail, Phone } from 'lucide-react';

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
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');

  // Calculate stats
  const stats = {
    total: leads.length,
    new: leads.filter(l => l.status === 'NEW').length,
    approved: leads.filter(l => l.status === 'APPROVED').length,
    completed: leads.filter(l => l.status === 'COMPLETED').length,
  };

  // Filter leads
  const filteredLeads = leads.filter(lead => {
    const matchesSearch = lead.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         lead.phone.includes(searchQuery);
    const matchesStatus = statusFilter === 'all' || lead.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMins / 60);
    const diffDays = Math.floor(diffHours / 24);

    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    return `${diffDays}d ago`;
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'NEW': return 'bg-blue-50 text-blue-700 border-blue-200';
      case 'APPROVED': return 'bg-amber-50 text-amber-700 border-amber-200';
      case 'COMPLETED': return 'bg-emerald-50 text-emerald-700 border-emerald-200';
      default: return 'bg-gray-50 text-gray-700 border-gray-200';
    }
  };

  if (leads.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-24 px-4">
        <div className="w-16 h-16 rounded-2xl bg-slate-100 flex items-center justify-center mb-4">
          <Mail className="h-8 w-8 text-slate-400" />
        </div>
        <h3 className="text-xl font-semibold text-slate-900 mb-2">No leads yet</h3>
        <p className="text-slate-500 text-center max-w-sm">
          When you start receiving leads, they'll appear here
        </p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white">
      {/* Header Section */}
      <div className="border-b border-slate-200 bg-white sticky top-0 z-10">
        <div className="px-8 py-6">
          {/* Top Row: Title + Stats */}
          <div className="flex items-center justify-between mb-6">
            <div>
              <h1 className="text-2xl font-semibold text-slate-900">Leads</h1>
              <p className="text-sm text-slate-500 mt-1">{stats.total} total</p>
            </div>

            {/* Inline Stats */}
            <div className="flex items-center gap-6">
              <div className="text-center">
                <div className="text-2xl font-semibold text-blue-600">{stats.new}</div>
                <div className="text-xs text-slate-500 uppercase tracking-wide">New</div>
              </div>
              <div className="h-8 w-px bg-slate-200"></div>
              <div className="text-center">
                <div className="text-2xl font-semibold text-amber-600">{stats.approved}</div>
                <div className="text-xs text-slate-500 uppercase tracking-wide">Active</div>
              </div>
              <div className="h-8 w-px bg-slate-200"></div>
              <div className="text-center">
                <div className="text-2xl font-semibold text-emerald-600">{stats.completed}</div>
                <div className="text-xs text-slate-500 uppercase tracking-wide">Done</div>
              </div>
            </div>
          </div>

          {/* Search and Filter Bar */}
          <div className="flex items-center gap-3">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
              <input
                type="text"
                placeholder="Search by name or phone..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
            
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-4 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white"
            >
              <option value="all">All Status</option>
              <option value="NEW">New</option>
              <option value="APPROVED">Active</option>
              <option value="COMPLETED">Completed</option>
            </select>
          </div>
        </div>
      </div>

      {/* Leads List */}
      <div className="px-8 py-6">
        <div className="space-y-2">
          {filteredLeads.map((lead) => (
            <div
              key={lead.id}
              className="group flex items-center gap-4 p-4 rounded-lg border border-slate-200 hover:border-slate-300 hover:shadow-sm transition-all bg-white"
            >
              {/* Status Indicator */}
              <div className={`w-2 h-2 rounded-full flex-shrink-0 ${
                lead.status === 'NEW' ? 'bg-blue-500' :
                lead.status === 'APPROVED' ? 'bg-amber-500' :
                'bg-emerald-500'
              }`} />

              {/* Lead Info */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-3 mb-1">
                  <h3 className="font-medium text-slate-900">{lead.name}</h3>
                  <span className={`px-2 py-0.5 text-xs font-medium rounded-md border ${getStatusColor(lead.status)}`}>
                    {lead.status.toLowerCase()}
                  </span>
                </div>
                
                <div className="flex items-center gap-4 text-sm text-slate-500">
                  <div className="flex items-center gap-1.5">
                    <Phone className="h-3.5 w-3.5" />
                    <span>{lead.phone}</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className="text-xs">via</span>
                    <span className="font-medium">{lead.source}</span>
                  </div>
                  {lead.description && (
                    <>
                      <span className="text-slate-300">•</span>
                      <span className="truncate max-w-md">{lead.description}</span>
                    </>
                  )}
                </div>
              </div>

              {/* Time */}
              <div className="flex items-center gap-3 flex-shrink-0">
                <span className="text-xs text-slate-400">{formatTime(lead.created_at)}</span>
                <button className="opacity-0 group-hover:opacity-100 transition-opacity p-1 hover:bg-slate-100 rounded">
                  <MoreVertical className="h-4 w-4 text-slate-400" />
                </button>
              </div>
            </div>
          ))}
        </div>

        {filteredLeads.length === 0 && (
          <div className="text-center py-12">
            <p className="text-slate-500">No leads match your search</p>
          </div>
        )}
      </div>
    </div>
  );
}
