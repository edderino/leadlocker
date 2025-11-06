'use client';

import { useMemo } from 'react';
import type { Lead } from './WorkspaceLayout';
import { Users, AlertTriangle, CheckCircle, Clock } from 'lucide-react';

export default function Overview({ leads, totals }: { leads: Lead[]; totals: { all: number; needs: number; approved: number; completed: number } }) {
  const recent = useMemo(() => leads.slice(0, 5), [leads]);

  return (
    <div className="space-y-8">
      {/* KPI Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-6">
        <KpiCard
          icon={<Users className="h-5 w-5 text-violet-400" />}
          label="Total Leads"
          value={totals.all}
          accent="from-violet-500/40 via-violet-500/10 to-transparent"
        />
        <KpiCard
          icon={<AlertTriangle className="h-5 w-5 text-orange-400" />}
          label="Needs Attention"
          value={totals.needs}
          accent="from-orange-500/40 via-orange-500/10 to-transparent"
        />
        <KpiCard
          icon={<Clock className="h-5 w-5 text-amber-400" />}
          label="Approved"
          value={totals.approved}
          accent="from-amber-500/40 via-amber-500/10 to-transparent"
        />
        <KpiCard
          icon={<CheckCircle className="h-5 w-5 text-emerald-400" />}
          label="Completed"
          value={totals.completed}
          accent="from-emerald-500/40 via-emerald-500/10 to-transparent"
        />
      </div>

      {/* Recent Activity */}
      <div className="rounded-2xl border border-white/10 bg-gradient-to-b from-white/[0.04] to-transparent backdrop-blur-sm p-6 shadow-[0_0_20px_-5px_rgba(0,0,0,0.5)]">
        <h3 className="text-lg font-semibold text-white/90 mb-4">Recent Activity</h3>

        {recent.length === 0 ? (
          <p className="text-sm text-gray-500">No recent leads yet. Once new messages come in, they'll show here.</p>
        ) : (
          <ul className="space-y-2">
            {recent.map((lead) => (
              <li
                key={lead.id}
                className="flex items-center justify-between rounded-xl border border-white/10 bg-[#12161d]/70 hover:bg-[#161b23]/90 px-4 py-3 transition"
              >
                <div className="flex items-center gap-3 truncate">
                  <StatusDot status={lead.status} />
                  <div>
                    <div className="text-sm font-medium text-white/90">{lead.name}</div>
                    <div className="text-xs text-gray-500 uppercase tracking-widest">{lead.source}</div>
                  </div>
                </div>
                <div className="text-xs text-gray-500">{new Date(lead.created_at).toLocaleDateString()}</div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}

function KpiCard({ icon, label, value, accent }: { icon: React.ReactNode; label: string; value: number; accent: string }) {
  return (
    <div className="relative rounded-2xl border border-white/10 bg-[#12161d]/70 overflow-hidden shadow-[0_0_20px_-6px_rgba(0,0,0,0.6)]">
      <div className={`absolute inset-0 bg-gradient-to-br ${accent}`} />
      <div className="relative p-5">
        <div className="flex items-center justify-between mb-2">
          <div className="text-xs uppercase tracking-widest text-gray-400">{label}</div>
          {icon}
        </div>
        <div className="text-3xl font-bold text-white/90">{value}</div>
      </div>
      <div className="h-1 bg-gradient-to-r from-white/10 to-transparent" />
    </div>
  );
}

function StatusDot({ status }: { status: Lead['status'] }) {
  const color =
    status === 'NEW'
      ? 'bg-orange-400'
      : status === 'APPROVED'
      ? 'bg-amber-400'
      : 'bg-emerald-400';
  return <div className={`h-2.5 w-2.5 rounded-full ${color}`} />;
}
