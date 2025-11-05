'use client';

import { useMemo } from 'react';
import type { Lead } from './WorkspaceLayout';
import Sparkline from './Sparkline';

export default function Overview({ leads, totals }: { leads: Lead[]; totals: { all: number; needs: number; approved: number; completed: number } }) {
  // build a tiny timeline for sparkline (last 14 items just for vibe)
  const series = useMemo(() => {
    const arr = leads
      .slice(0, 14)
      .map((l) => (l.status === 'NEW' ? 2 : l.status === 'APPROVED' ? 4 : 6))
      .reverse();
    return arr.length ? arr : [0, 1, 0.5, 1.5, 0.8, 1.2, 0.7, 1.3];
  }, [leads]);

  return (
    <div className="space-y-6">
      {/* KPI row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Kpi title="Total Leads" value={totals.all} accent="from-violet-500/60 to-violet-400/20">
          <Sparkline values={series} />
        </Kpi>
        <Kpi title="Needs Attention" value={totals.needs} accent="from-rose-500/60 to-rose-400/20">
          <Sparkline values={series.map(v => Math.max(0, v - 1))} />
        </Kpi>
        <Kpi title="Approved" value={totals.approved} accent="from-amber-500/60 to-amber-400/20">
          <Sparkline values={series.map(v => v * .8)} />
        </Kpi>
        <Kpi title="Completed" value={totals.completed} accent="from-emerald-500/60 to-emerald-400/20">
          <Sparkline values={series.map(v => Math.min(8, v + 1))} />
        </Kpi>
      </div>

      {/* Two-up cards */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <Card title="Recent Activity">
          <ul className="space-y-2 text-sm">
            {leads.slice(0, 6).map(l => (
              <li key={l.id} className="flex items-center justify-between rounded-lg border border-white/10 bg-white/5 px-3 py-2">
                <div className="truncate">
                  <span className="font-medium">{l.name}</span>
                  <span className="mx-2 text-gray-500">•</span>
                  <span className="text-gray-400">{l.source}</span>
                </div>
                <StatusPill status={l.status} />
              </li>
            ))}
            {leads.length === 0 && <div className="text-gray-500">No leads yet.</div>}
          </ul>
        </Card>

        <Card title="Quick Tips">
          <ul className="text-sm text-gray-300 space-y-2">
            <li>• Reply within 5–10 minutes to double conversion.</li>
            <li>• Mark jobs "Completed" to keep the board tidy.</li>
            <li>• Use the phone tap to call straight from the list.</li>
          </ul>
        </Card>
      </div>
    </div>
  );
}

function Kpi({ title, value, children, accent }: { title: string; value: number | string; children?: React.ReactNode; accent: string }) {
  return (
    <div className="rounded-xl border border-white/10 bg-white/5 overflow-hidden">
      <div className="p-4">
        <div className="text-[11px] uppercase tracking-widest text-gray-400">{title}</div>
        <div className="mt-2 text-3xl font-bold">{value}</div>
      </div>
      <div className={`h-2 bg-gradient-to-r ${accent}`} />
      <div className="px-3 py-2">{children}</div>
    </div>
  );
}

function Card({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="rounded-xl border border-white/10 bg-white/5 p-4">
      <div className="text-[11px] uppercase tracking-widest text-gray-400">{title}</div>
      <div className="mt-3">{children}</div>
    </div>
  );
}

function StatusPill({ status }: { status: Lead['status'] }) {
  const map = {
    NEW: 'bg-rose-500/15 text-rose-300 border-rose-400/20',
    APPROVED: 'bg-amber-500/15 text-amber-300 border-amber-400/20',
    COMPLETED: 'bg-emerald-500/15 text-emerald-300 border-emerald-400/20',
  } as const;
  return <span className={`text-xs px-2 py-1 rounded-full border ${map[status]}`}>{status === 'NEW' ? 'Needs Attention' : status}</span>;
}
