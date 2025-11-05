'use client';

import { RefreshCw, Send, Phone } from 'lucide-react';

type Lead = {
  id: string;
  name: string;
  phone: string;
  source: string;
  description: string | null;
  status: 'NEW' | 'APPROVED' | 'COMPLETED';
  created_at: string;
};

export default function ClientDashboardV3({ leads, orgId }: { leads: Lead[]; orgId: string }) {
  const totals = {
    all: leads.length,
    new: leads.filter(l => l.status === 'NEW').length,
    approved: leads.filter(l => l.status === 'APPROVED').length,
    done: leads.filter(l => l.status === 'COMPLETED').length,
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#0c0f15] via-[#11141c] to-[#0c0f15] text-white">
      {/* Header */}
      <div className="sticky top-0 z-10 backdrop-blur-xl bg-black/20 border-b border-white/10">
        <div className="max-w-6xl mx-auto px-6 h-14 flex items-center justify-between">
          <h1 className="font-semibold text-lg tracking-tight text-white/90">LeadLocker</h1>
          <div className="flex items-center gap-3">
            <span className="text-xs text-white/50 bg-white/5 px-2 py-1 rounded-md">
              org: {orgId}
            </span>
            <button
              onClick={() => location.reload()}
              className="inline-flex items-center gap-2 rounded-lg px-3 py-1.5 bg-[#2a2f3b] hover:bg-[#3b4050] transition-all text-sm text-white/80"
            >
              <RefreshCw className="h-4 w-4" /> Refresh
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-6 py-10 space-y-10">
        {/* KPI Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
          {[
            { label: 'Total Leads', value: totals.all, color: 'from-[#9B87F5] to-[#7E5AE1]' },
            { label: 'Needs Attention', value: totals.new, color: 'from-[#FF6B6B] to-[#E04141]' },
            { label: 'Completed', value: totals.done, color: 'from-[#7CF29A] to-[#3CD072]' },
          ].map((card, i) => (
            <div
              key={i}
              className="relative rounded-xl bg-white/[0.03] border border-white/10 shadow-[0_0_20px_rgba(0,0,0,0.4)] backdrop-blur-md overflow-hidden"
            >
              <div
                className={`absolute top-0 left-0 h-[2px] w-full bg-gradient-to-r ${card.color}`}
              />
              <div className="p-6 space-y-2">
                <div className="text-sm text-white/60 uppercase tracking-widest">
                  {card.label}
                </div>
                <div className="text-4xl font-bold tracking-tight">{card.value}</div>
              </div>
            </div>
          ))}
        </div>

        {/* Leads Table */}
        <div className="rounded-xl bg-white/[0.03] border border-white/10 backdrop-blur-md shadow-[0_0_20px_rgba(0,0,0,0.3)] overflow-hidden">
          <div className="flex items-center justify-between border-b border-white/10 px-6 py-3">
            <div className="text-sm text-white/70">Leads</div>
            <div className="text-xs text-white/40">{leads.length} total</div>
          </div>

          {leads.length === 0 ? (
            <div className="p-12 text-center text-white/60">No leads yet.</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full text-sm text-white/90">
                <thead className="bg-white/[0.02] text-white/50 text-xs uppercase">
                  <tr>
                    <th className="py-3 px-6 text-left font-medium">Lead</th>
                    <th className="py-3 px-6 text-left font-medium">Message</th>
                    <th className="py-3 px-6 text-left font-medium">Source</th>
                    <th className="py-3 px-6 text-left font-medium">Status</th>
                    <th className="py-3 px-6 text-left font-medium">Phone</th>
                    <th className="py-3 px-6"></th>
                  </tr>
                </thead>
                <tbody>
                  {leads.map((l, i) => (
                    <tr
                      key={l.id}
                      className={`transition-all ${
                        i % 2 === 0 ? 'bg-white/[0.01]' : 'bg-white/[0.02]'
                      } hover:bg-white/[0.05]`}
                    >
                      <td className="px-6 py-4 font-medium">{l.name}</td>
                      <td className="px-6 py-4 text-white/70 max-w-[320px] truncate">
                        {l.description ?? '-'}
                      </td>
                      <td className="px-6 py-4 text-white/60">{l.source}</td>
                      <td className="px-6 py-4">
                        <span
                          className={`px-3 py-1 text-xs font-semibold rounded-full ${
                            l.status === 'NEW'
                              ? 'bg-[#E04141]/10 text-[#E04141]'
                              : l.status === 'COMPLETED'
                              ? 'bg-[#3CD072]/10 text-[#3CD072]'
                              : 'bg-[#F5C461]/10 text-[#F5C461]'
                          }`}
                        >
                          {l.status === 'NEW'
                            ? 'Needs Attention'
                            : l.status === 'APPROVED'
                            ? 'Approved'
                            : 'Completed'}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <a
                          href={`tel:${l.phone}`}
                          className="inline-flex items-center gap-1 text-[#66D5FF] hover:opacity-80"
                        >
                          <Phone className="h-4 w-4" /> {l.phone}
                        </a>
                      </td>
                      <td className="px-6 py-4">
                        <button
                          onClick={() => {
                            const msg = prompt('Reply message');
                            if (!msg) return;
                            fetch('/api/client/messages/send', {
                              method: 'POST',
                              headers: { 'Content-Type': 'application/json' },
                              body: JSON.stringify({
                                orgId,
                                leadId: l.id,
                                phone: l.phone,
                                message: msg,
                              }),
                            });
                          }}
                          className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg bg-gradient-to-r from-[#9B87F5] to-[#7E5AE1] hover:opacity-90 transition"
                        >
                          <Send className="h-4 w-4" /> Reply
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

