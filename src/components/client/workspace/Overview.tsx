'use client';

import Card from '@/components/ui/Card';
import type { Lead } from './WorkspaceLayout';
import { useThemeStyles } from './ThemeContext';
import { useLeadsStore } from '@/store/useLeadsStore';

interface OverviewProps {
  leads?: Lead[];
  totals?: { all: number; needs: number; approved: number; completed: number };
}

export default function Overview({ leads: _propLeads, totals: _propTotals }: OverviewProps) {
  const themeStyles = useThemeStyles();
  const leads = useLeadsStore((s) => s.leads);
  
  const totalLeads = leads.length;
  const newCount = leads.filter(
    (l) => l.status?.toUpperCase() === "NEW"
  ).length;
  const approvedCount = leads.filter(
    (l) => l.status?.toUpperCase() === "APPROVED"
  ).length;
  const completedCount = leads.filter(
    (l) => l.status?.toUpperCase() === "COMPLETED"
  ).length;

  const stats = [
    { label: 'Total Leads', value: totalLeads },
    { label: 'New', value: newCount },
    { label: 'Approved', value: approvedCount },
    { label: 'Completed', value: completedCount },
  ];

  const recent = (leads.length > 0
    ? leads.slice(0, 4).map((lead) => ({
        name: lead.name || 'Unknown',
        action: `New lead created from ${lead.source}`,
        date: new Date(lead.created_at).toLocaleDateString(),
      }))
    : [
        { name: 'reg', action: 'New lead created from FB', date: '05/11/2025' },
        { name: 'Feed Smoke Test', action: 'New lead created from API', date: '05/11/2025' },
        { name: 'john doe', action: 'New lead created from FB', date: '20/10/2025' },
        { name: 'ray', action: 'New lead created from fb', date: '20/10/2025' },
      ]) as Array<{ name: string; action: string; date: string }>;

  return (
    <div className="p-6 space-y-6">
      <h2 className="text-xl font-semibold text-neutral-100">Overview</h2>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left side: Stats + Summary */}
        <div className="lg:col-span-2 space-y-5">
          <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {stats.map((s) => (
              <Card
                key={s.label}
                className={`p-5 bg-neutral-950 border border-neutral-800 transition-all duration-300 ${themeStyles.cardBaseClass} ${themeStyles.cardHoverClass}`}
              >
                <p className="text-xs uppercase tracking-wide text-neutral-400">{s.label}</p>
                <p className={`text-4xl font-bold mt-1 ${themeStyles.accentTextClass}`}>
                  {s.value}
                </p>
              </Card>
            ))}
          </div>

          <Card className={`p-6 bg-neutral-950 border border-neutral-800 transition-all duration-300 ${themeStyles.cardBaseClass} ${themeStyles.cardHoverClass}`}>
            <h3 className="text-sm font-semibold uppercase text-neutral-300 mb-3 tracking-wide">
              Performance Summary
            </h3>
            <p className="text-neutral-400 text-sm leading-relaxed">
              Charts and analytics will appear here once live data is connected.
              Layout preserved for spacing and hierarchy checks.
            </p>
          </Card>
        </div>

        {/* Right side: Recent Activity */}
        <div>
          <Card className={`p-6 bg-neutral-950 border border-neutral-800 transition-all duration-300 ${themeStyles.cardBaseClass} ${themeStyles.cardHoverClass}`}>
            <h3 className="text-sm font-semibold uppercase text-neutral-300 mb-3 tracking-wide">
              Recent Activity
            </h3>
            <ul className="divide-y divide-neutral-800">
              {recent.map((r, i) => (
                <li key={`${r.name}-${i}`} className="py-3">
                  <p className="text-neutral-100 text-sm font-medium">{r.name}</p>
                  <p className="text-neutral-400 text-xs">{r.action}</p>
                  <p className="text-neutral-500 text-xs mt-1">{r.date}</p>
                </li>
              ))}
            </ul>
          </Card>
        </div>
      </div>
    </div>
  );
}
