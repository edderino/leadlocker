'use client';

import { useState } from 'react';
import { Phone, MessageSquare, Grid, List, X } from 'lucide-react';

interface Lead {
  id: string;
  name: string;
  phone: string;
  source: string;
  description: string | null;
  status: 'NEW' | 'APPROVED' | 'COMPLETED';
  created_at: string;
}

const STATUS_MAP = {
  NEW: { label: 'Needs Attention', color: 'text-red-400' },
  APPROVED: { label: 'In Progress', color: 'text-yellow-400' },
  COMPLETED: { label: 'Completed', color: 'text-green-400' },
};

export default function Leads({ leads = [] }: { leads: Lead[] }) {
  const [filter, setFilter] = useState<'ALL' | 'NEW' | 'APPROVED' | 'COMPLETED'>('ALL');
  const [view, setView] = useState<'GRID' | 'TABLE'>('GRID');
  const [replyLead, setReplyLead] = useState<Lead | null>(null);

  const filtered = filter === 'ALL' ? leads : leads.filter(l => l.status === filter);

  return (
    <div className="relative min-h-screen bg-[#0e1014] text-gray-200 px-6 py-8 transition-all">

      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-semibold text-gray-100 tracking-tight">Leads</h1>
          <p className="text-sm text-gray-500">
            Manage and respond to incoming leads.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="flex gap-2">
            {['ALL', 'NEW', 'APPROVED', 'COMPLETED'].map(t => (
              <button
                key={t}
                onClick={() => setFilter(t as any)}
                className={`px-3 py-1.5 text-sm rounded-md border transition-all ${
                  filter === t
                    ? 'bg-[#1a1d23] border-[#2d3140] text-indigo-400 shadow-[0_0_10px_#6366f155]'
                    : 'border-[#2a2d35] text-gray-400 hover:text-gray-200 hover:border-[#3a3f4f]'
                }`}
              >
                {t === 'ALL' ? 'All' : STATUS_MAP[t as keyof typeof STATUS_MAP]?.label || t}
              </button>
            ))}
          </div>

          {/* View toggle */}
          <button
            onClick={() => setView(view === 'GRID' ? 'TABLE' : 'GRID')}
            className="ml-4 p-2 rounded-md border border-[#2a2d35] hover:border-[#3a3f4f] hover:text-indigo-400 transition-all"
            title={view === 'GRID' ? 'Switch to Table View' : 'Switch to Grid View'}
          >
            {view === 'GRID' ? <List className="h-4 w-4" /> : <Grid className="h-4 w-4" />}
          </button>
        </div>
      </div>

      {/* Views */}
      {view === 'GRID' ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {filtered.length === 0 ? (
            <div className="col-span-full py-16 text-center text-gray-500">
              No leads found.
            </div>
          ) : (
            filtered.map(lead => (
              <div
                key={lead.id}
                className="rounded-xl bg-[#13161c] border border-[#1e2128] p-5 hover:border-[#2e3340] hover:shadow-[0_0_20px_#00000070] hover:scale-[1.01] transition-all"
              >
                <div className="flex justify-between items-start mb-3">
                  <div>
                    <h3 className="text-base font-medium text-gray-100">{lead.name}</h3>
                    <p className="text-sm text-gray-500">{lead.source}</p>
                  </div>
                  <span className={`text-xs font-medium ${STATUS_MAP[lead.status].color}`}>
                    ● {STATUS_MAP[lead.status].label}
                  </span>
                </div>

                {lead.description && (
                  <p className="text-sm text-gray-400 mb-4 line-clamp-2">{lead.description}</p>
                )}

                <div className="flex items-center justify-between text-sm text-gray-400">
                  <a
                    href={`tel:${lead.phone}`}
                    className="inline-flex items-center gap-1 hover:text-gray-200"
                  >
                    <Phone className="h-4 w-4" />
                    {lead.phone}
                  </a>
                  <button
                    onClick={() => setReplyLead(lead)}
                    className="inline-flex items-center gap-1 px-3 py-1.5 border border-[#2a2d35] rounded-md hover:bg-[#1a1d23] hover:text-indigo-400 transition-all"
                  >
                    <MessageSquare className="h-4 w-4" />
                    Reply
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      ) : (
        <div className="overflow-hidden rounded-xl border border-[#1e2128]">
          <table className="min-w-full text-sm text-gray-300">
            <thead className="bg-[#16191f] text-gray-400 uppercase text-xs tracking-wide">
              <tr>
                <th className="px-4 py-3 text-left">Lead</th>
                <th className="px-4 py-3 text-left">Source</th>
                <th className="px-4 py-3 text-left">Status</th>
                <th className="px-4 py-3 text-left">Phone</th>
                <th className="px-4 py-3 text-left">Action</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map(lead => (
                <tr key={lead.id} className="border-t border-[#1c1f25] hover:bg-[#15181e]/70 transition-colors">
                  <td className="px-4 py-3 font-medium">{lead.name}</td>
                  <td className="px-4 py-3">{lead.source}</td>
                  <td className={`px-4 py-3 ${STATUS_MAP[lead.status].color}`}>
                    {STATUS_MAP[lead.status].label}
                  </td>
                  <td className="px-4 py-3">
                    <a href={`tel:${lead.phone}`} className="hover:text-indigo-400">{lead.phone}</a>
                  </td>
                  <td className="px-4 py-3">
                    <button
                      onClick={() => setReplyLead(lead)}
                      className="inline-flex items-center gap-1 px-3 py-1 border border-[#2a2d35] rounded-md hover:bg-[#1a1d23] hover:text-indigo-400 transition-all"
                    >
                      <MessageSquare className="h-4 w-4" />
                      Reply
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Slide-in reply drawer */}
      {replyLead && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex justify-end z-50">
          <div className="w-full max-w-md h-full bg-[#111317] border-l border-[#2a2d35] shadow-[0_0_30px_#00000090] p-6 flex flex-col">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-gray-100">
                Reply to {replyLead.name}
              </h2>
              <button
                onClick={() => setReplyLead(null)}
                className="text-gray-400 hover:text-gray-200"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="text-sm text-gray-400 mb-2">
              Source: {replyLead.source}
            </div>
            <div className="text-sm text-gray-400 mb-6">
              Phone: {replyLead.phone}
            </div>

            <textarea
              className="flex-grow bg-[#1a1d23] border border-[#2a2d35] rounded-md p-3 text-gray-200 text-sm focus:outline-none focus:border-indigo-500 resize-none"
              placeholder="Type your reply..."
            />
            <button
              className="mt-4 px-4 py-2 bg-indigo-500 text-white rounded-md hover:bg-indigo-600 transition-all"
              onClick={() => setReplyLead(null)}
            >
              Send Reply
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
