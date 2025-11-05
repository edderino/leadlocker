'use client';

import { motion } from 'framer-motion';
import { BarChart3, CheckCircle2, Cog, Inbox, MessageSquare, PanelLeftClose, PanelLeftOpen } from 'lucide-react';

type Props = {
  orgId: string;
  active: string;
  collapsed: boolean;
  onToggle: () => void;
  onNavigate: (k: string) => void;
};

const nav = [
  { key: 'overview', label: 'Overview', icon: BarChart3 },
  { key: 'leads', label: 'Leads', icon: Inbox },
  { key: 'messages', label: 'Messages', icon: MessageSquare },
  { key: 'analytics', label: 'Analytics', icon: CheckCircle2 },
  { key: 'settings', label: 'Settings', icon: Cog },
];

export default function Sidebar({ orgId, active, collapsed, onToggle, onNavigate }: Props) {
  return (
    <motion.aside
      initial={false}
      animate={{ width: collapsed ? 64 : 256 }}
      className="fixed left-0 top-0 bottom-0 z-20 border-r border-white/10 bg-[#0b0f14]/90 backdrop-blur-md"
    >
      <div className="h-16 flex items-center justify-between px-3">
        <div className="flex items-center gap-2">
          <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-violet-500/60 to-emerald-500/60 grid place-items-center font-bold">LL</div>
          {!collapsed && <div className="text-sm font-semibold tracking-wide text-white/90">LeadLocker</div>}
        </div>
        <button
          onClick={onToggle}
          className="rounded-lg border border-white/10 bg-white/5 hover:bg-white/10 p-2"
          title="Toggle sidebar"
        >
          {collapsed ? <PanelLeftOpen className="h-4 w-4" /> : <PanelLeftClose className="h-4 w-4" />}
        </button>
      </div>

      {!collapsed && (
        <div className="px-3 pb-3">
          <div className="rounded-xl border border-white/10 bg-white/5 p-3">
            <div className="text-xs text-gray-400">Client</div>
            <div className="mt-1 font-medium">{orgId}</div>
          </div>
        </div>
      )}

      <nav className="px-2 space-y-1">
        {nav.map(item => {
          const Icon = item.icon;
          const selected = active === item.key;
          return (
            <button
              key={item.key}
              onClick={() => onNavigate(item.key)}
              className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg border transition 
                ${selected ? 'border-violet-500/40 bg-violet-500/10 text-white' : 'border-white/0 text-gray-300 hover:border-white/10 hover:bg-white/5'}`}
            >
              <Icon className="h-4 w-4" />
              {!collapsed && <span className="text-sm">{item.label}</span>}
            </button>
          );
        })}
      </nav>

      <div className="absolute bottom-4 left-0 right-0 px-3">
        {!collapsed && (
          <div className="text-[11px] text-gray-500 text-center border-t border-white/10 pt-3">
            © LeadLocker
          </div>
        )}
      </div>
    </motion.aside>
  );
}
