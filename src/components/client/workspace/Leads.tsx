'use client';

import { useState } from 'react';
import { LayoutGrid, List, Phone, Send, MapPin } from 'lucide-react';
import { cn } from '@/libs/utils';

interface Lead {
  id: string;
  name: string;
  phone: string;
  source: string;
  description: string | null;
  status: 'NEW' | 'APPROVED' | 'COMPLETED';
  created_at: string;
}

const statusColors = {
  NEW: 'text-orange-400 bg-orange-400/10 border-orange-400/20',
  APPROVED: 'text-yellow-400 bg-yellow-400/10 border-yellow-400/20',
  COMPLETED: 'text-emerald-400 bg-emerald-400/10 border-emerald-400/20',
};

export default function LeadsPage({ leads = [] }: { leads: Lead[] }) {
  const [viewMode, setViewMode] = useState<'cards' | 'table'>('cards');

  return (
    <div className="space-y-8 animate-fadeIn">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold text-white tracking-tight">Leads</h1>

        {/* View toggle */}
        <div className="flex items-center gap-2 bg-white/5 rounded-lg border border-white/10 px-1.5 py-1">
          <button
            onClick={() => setViewMode('cards')}
            className={cn(
              'p-1.5 rounded-md transition-all hover:bg-white/10',
              viewMode === 'cards' && 'bg-gradient-to-r from-violet-600/60 to-violet-500/60 text-white shadow-md'
            )}
          >
            <LayoutGrid className="h-4 w-4" />
          </button>
          <button
            onClick={() => setViewMode('table')}
            className={cn(
              'p-1.5 rounded-md transition-all hover:bg-white/10',
              viewMode === 'table' && 'bg-gradient-to-r from-violet-600/60 to-violet-500/60 text-white shadow-md'
            )}
          >
            <List className="h-4 w-4" />
          </button>
        </div>
      </div>

      {/* Leads display */}
      {viewMode === 'cards' ? (
        <CardGridView leads={leads} />
      ) : (
        <TableView leads={leads} />
      )}
    </div>
  );
}

/* -------------------- CARD VIEW -------------------- */
function CardGridView({ leads }: { leads: Lead[] }) {
  if (leads.length === 0) {
    return (
      <div className="p-10 border border-white/10 rounded-xl text-center text-gray-400">
        No leads yet.
      </div>
    );
  }

  return (
    <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
      {leads.map((lead) => (
        <div
          key={lead.id}
          className="group bg-gradient-to-b from-white/5 to-white/2 rounded-xl p-5 border border-white/10 shadow-[0_0_25px_rgba(0,0,0,0.15)] hover:shadow-[0_0_25px_rgba(100,100,255,0.2)] transition-all duration-200"
        >
          <div className="flex items-start justify-between mb-2">
            <div>
              <h2 className="font-semibold text-white capitalize">{lead.name}</h2>
              <p className="text-xs text-gray-400">{new Date(lead.created_at).toLocaleDateString()}</p>
            </div>
            <span className={cn('px-2 py-0.5 text-xs font-medium rounded-md border', statusColors[lead.status])}>
              {lead.status === 'NEW'
                ? 'New'
                : lead.status === 'APPROVED'
                ? 'Active'
                : 'Done'}
            </span>
          </div>

          <p className="text-sm text-gray-300 line-clamp-2 mb-4">{lead.description || 'No message'}</p>

          <div className="flex items-center gap-3 text-sm text-gray-400 mb-4">
            <MapPin className="h-4 w-4 text-gray-500" />
            <span>{lead.source}</span>
          </div>

          <div className="flex items-center justify-between mt-auto pt-2">
            <a
              href={`tel:${lead.phone}`}
              className="flex items-center gap-2 text-gray-300 hover:text-white transition-colors"
            >
              <Phone className="h-4 w-4" />
              {lead.phone}
            </a>
            <button className="flex items-center gap-1.5 bg-gradient-to-r from-violet-600 to-fuchsia-500 text-white text-xs font-medium px-3 py-1.5 rounded-md hover:opacity-90 transition-all shadow-md">
              <Send className="h-3.5 w-3.5" /> Reply
            </button>
          </div>
        </div>
      ))}
    </div>
  );
}

/* -------------------- TABLE VIEW -------------------- */
function TableView({ leads }: { leads: Lead[] }) {
  return (
    <div className="overflow-hidden border border-white/10 rounded-xl">
      <table className="w-full text-sm text-gray-300">
        <thead className="bg-white/5 text-gray-400 uppercase text-xs tracking-wider">
          <tr>
            <th className="px-6 py-3 text-left">Lead</th>
            <th className="px-6 py-3 text-left">Phone</th>
            <th className="px-6 py-3 text-left">Source</th>
            <th className="px-6 py-3 text-left">Status</th>
            <th className="px-6 py-3 text-right">Action</th>
          </tr>
        </thead>
        <tbody>
          {leads.map((lead, index) => (
            <tr
              key={lead.id}
              className={cn(
                'hover:bg-white/5 transition-all border-b border-white/5',
                index % 2 === 0 ? 'bg-white/2' : ''
              )}
            >
              <td className="px-6 py-3 font-medium text-white">{lead.name}</td>
              <td className="px-6 py-3">
                <a
                  href={`tel:${lead.phone}`}
                  className="text-violet-400 hover:text-violet-300 transition"
                >
                  {lead.phone}
                </a>
              </td>
              <td className="px-6 py-3">{lead.source}</td>
              <td className="px-6 py-3">
                <span
                  className={cn('px-2 py-0.5 rounded-md border text-xs font-medium', statusColors[lead.status])}
                >
                  {lead.status}
                </span>
              </td>
              <td className="px-6 py-3 text-right">
                <button className="flex items-center gap-1.5 bg-gradient-to-r from-violet-600 to-fuchsia-500 text-white text-xs font-medium px-3 py-1.5 rounded-md hover:opacity-90 transition-all shadow-md ml-auto">
                  <Send className="h-3.5 w-3.5" /> Reply
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
