'use client';

import { useState } from 'react';
import { MessageSquare, Phone, MapPin } from 'lucide-react';

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

  const filtered =
    filter === 'ALL' ? leads : leads.filter((l) => l.status === filter);

  return (
    <div className="min-h-screen bg-[#0f1115] text-gray-200 px-6 py-8 transition-all">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-semibold text-gray-100 tracking-tight">
            Leads
          </h1>
          <p className="text-sm text-gray-500">
            Manage and respond to incoming leads in one place.
          </p>
        </div>
        <div className="flex gap-2">
          {['ALL', 'NEW', 'APPROVED', 'COMPLETED'].map((t) => (
            <button
              key={t}
              onClick={() => setFilter(t as any)}
              className={`px-4 py-1.5 text-sm rounded-md border transition-all ${
                filter === t
                  ? 'bg-[#1c1f25] border-[#2e3340] text-indigo-400'
                  : 'border-[#2a2d35] text-gray-400 hover:text-gray-200 hover:border-[#3a3f4f]'
              }`}
            >
              {t === 'ALL' ? 'All' : STATUS_MAP[t as keyof typeof STATUS_MAP]?.label || t}
            </button>
          ))}
        </div>
      </div>

      {/* Grid */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {filtered.length === 0 ? (
          <div className="col-span-full py-16 text-center text-gray-500">
            No leads found.
          </div>
        ) : (
          filtered.map((lead) => (
            <div
              key={lead.id}
              className="rounded-xl bg-[#14171d] border border-[#1e2128] p-5 hover:border-[#2e3340] hover:shadow-[0_0_15px_#00000050] hover:scale-[1.01] transition-all"
            >
              <div className="flex justify-between items-start mb-3">
                <div>
                  <h3 className="text-base font-medium text-gray-100">
                    {lead.name}
                  </h3>
                  <p className="text-sm text-gray-500">{lead.source}</p>
                </div>
                <span className={`text-xs font-medium ${STATUS_MAP[lead.status].color}`}>
                  ● {STATUS_MAP[lead.status].label}
                </span>
              </div>

              {lead.description && (
                <p className="text-sm text-gray-400 mb-4 line-clamp-2">
                  {lead.description}
                </p>
              )}

              <div className="flex items-center justify-between text-sm text-gray-400">
                <a
                  href={`tel:${lead.phone}`}
                  className="inline-flex items-center gap-1 hover:text-gray-200"
                >
                  <Phone className="h-4 w-4" />
                  {lead.phone}
                </a>
                <button className="inline-flex items-center gap-1 px-3 py-1.5 border border-[#2a2d35] rounded-md hover:bg-[#1c1f25] hover:text-indigo-400 transition-all">
                  <MessageSquare className="h-4 w-4" />
                  Reply
                </button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
