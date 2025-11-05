'use client';

import type { Lead } from './WorkspaceLayout';
import Sparkline from './Sparkline';

export default function Analytics({ leads }: { leads: Lead[] }) {
  const bySource = leads.reduce<Record<string, number>>((acc, l) => {
    acc[l.source] = (acc[l.source] ?? 0) + 1;
    return acc;
  }, {});

  const series = Object.entries(bySource).map(([k, v]) => ({ label: k, value: v }));

  return (
    <div className="grid gap-4 md:grid-cols-2">
      <div className="rounded-xl border border-white/10 bg-white/5 p-4">
        <div className="text-[11px] uppercase tracking-widest text-gray-400">Volume (sparkline)</div>
        <div className="mt-2">
          <Sparkline values={leads.slice(0, 20).map((_, i) => (i % 3) + 1)} />
        </div>
      </div>
      <div className="rounded-xl border border-white/10 bg-white/5 p-4">
        <div className="text-[11px] uppercase tracking-widest text-gray-400">By Source</div>
        <ul className="mt-3 space-y-2">
          {series.map(s => (
            <li key={s.label} className="flex items-center justify-between text-sm">
              <span className="text-gray-300">{s.label}</span>
              <span className="font-medium">{s.value}</span>
            </li>
          ))}
          {series.length === 0 && <div className="text-gray-500">No data yet.</div>}
        </ul>
      </div>
    </div>
  );
}
