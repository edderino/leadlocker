'use client';

import { useEffect, useMemo, useState } from 'react';
import Sidebar from './Sidebar';
import Overview from './Overview';
import Leads from './Leads';
import Messages from './Messages';
import Analytics from './Analytics';
import Settings from './Settings';
import { RotateCw } from 'lucide-react';

export type Lead = {
  id: string;
  name: string;
  phone: string;
  source: string;
  description: string | null;
  status: 'NEW' | 'APPROVED' | 'COMPLETED';
  created_at: string;
};

type Props = {
  orgId: string;
  leads: Lead[];
  onRefresh?: () => void;
};

type Section = 'overview' | 'leads' | 'messages' | 'analytics' | 'settings';

export default function WorkspaceLayout({ orgId, leads, onRefresh }: Props) {
  const [section, setSection] = useState<Section>('overview');
  const [collapsed, setCollapsed] = useState(false);

  // remember sidebar state
  useEffect(() => {
    const saved = localStorage.getItem('ll.sidebar.collapsed');
    if (saved) setCollapsed(saved === '1');
  }, []);
  useEffect(() => {
    localStorage.setItem('ll.sidebar.collapsed', collapsed ? '1' : '0');
  }, [collapsed]);

  const totals = useMemo(() => {
    const all = leads.length;
    const needs = leads.filter(l => l.status === 'NEW').length;
    const completed = leads.filter(l => l.status === 'COMPLETED').length;
    const approved = leads.filter(l => l.status === 'APPROVED').length;
    return { all, needs, approved, completed };
  }, [leads]);

  return (
    <div className="min-h-screen bg-[#0d1117] text-gray-100">
      {/* subtle backdrop gradient */}
      <div className="pointer-events-none fixed inset-0 bg-[radial-gradient(1200px_600px_at_20%_-10%,rgba(139,92,246,.10),transparent),radial-gradient(900px_500px_at_85%_-10%,rgba(16,185,129,.08),transparent)]" />
      <div className="relative flex">
        <Sidebar
          orgId={orgId}
          active={section}
          collapsed={collapsed}
          onToggle={() => setCollapsed(v => !v)}
          onNavigate={(s) => setSection(s as Section)}
        />
        <main className={`flex-1 transition-[padding] duration-200 ${collapsed ? 'pl-16' : 'pl-64'} pr-6`}>
          {/* header */}
          <div className="sticky top-0 z-10 -mx-6 px-6 py-4 backdrop-blur-md bg-black/10 border-b border-white/10 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="text-xs uppercase tracking-widest text-gray-400">LeadLocker</div>
              <span className="text-gray-500">/</span>
              <div className="text-xs uppercase tracking-widest text-violet-300">{section}</div>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-xs text-gray-400 bg-white/5 px-2 py-1 rounded border border-white/10">org: {orgId}</span>
              <button
                onClick={onRefresh}
                className="inline-flex items-center gap-2 rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 px-3 py-1.5 text-sm"
              >
                <RotateCw className="h-4 w-4" />
                Refresh
              </button>
            </div>
          </div>

          {/* content */}
          <div className="py-6 space-y-6">
            {section === 'overview' && <Overview leads={leads} totals={totals} />}
            {section === 'leads' && <Leads leads={leads} />}
            {section === 'messages' && <Messages orgId={orgId} />}
            {section === 'analytics' && <Analytics leads={leads} />}
            {section === 'settings' && <Settings orgId={orgId} />}
          </div>
        </main>
      </div>
    </div>
  );
}
