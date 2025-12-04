'use client';

import { useState, useMemo } from 'react';
import { RefreshCw } from 'lucide-react';
import Sidebar from './Sidebar';
import Overview from './Overview';
import Leads from './Leads';
import Analytics from './Analytics';
import Settings from './Settings';
import { ThemeProvider } from './ThemeContext';
import { useLeadsStore } from '@/store/useLeadsStore';

export type Lead = {
  id: string;
  name: string;
  phone: string;
  source: string;
  description: string | null;
  status: 'NEW' | 'APPROVED' | 'COMPLETED';
  created_at: string;
};

interface WorkspaceLayoutProps {
  leads: Lead[];
  orgId: string;
}

export default function WorkspaceLayout({ leads: _initialLeads, orgId }: WorkspaceLayoutProps) {
  const leads = useLeadsStore((s) => s.leads);
  const [currentSection, setCurrentSection] = useState('overview');
  const [refreshing, setRefreshing] = useState(false);

  const totals = useMemo(() => ({
    all: leads.length,
    needs: leads.filter(l => l.status === 'NEW').length,
    approved: leads.filter(l => l.status === 'APPROVED').length,
    completed: leads.filter(l => l.status === 'COMPLETED').length,
  }), [leads]);

  const handleRefresh = () => {
    setRefreshing(true);
    window.location.reload();
  };

  const sectionTitles: Record<string, string> = {
    overview: 'Overview',
    leads: 'Leads',
    analytics: 'Analytics',
    settings: 'Settings',
  };

  const renderContent = () => {
    switch (currentSection) {
      case 'overview':
        return <Overview leads={leads} totals={totals} />;
      case 'leads':
        return <Leads leads={leads} />;
      case 'analytics':
        return <Analytics orgId={orgId} />;
      case 'settings':
        return <Settings />;
      default:
        return <Overview leads={leads} totals={totals} />;
    }
  };

  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <ThemeProvider>
      <div className="flex h-screen bg-gradient-to-br from-[#0c0f15] via-[#161b22] to-[#0c0f15] overflow-hidden">
        {/* Mobile Sidebar Overlay */}
        {sidebarOpen && (
          <div 
            className="fixed inset-0 bg-black/50 z-40 md:hidden"
            onClick={() => setSidebarOpen(false)}
          />
        )}

        {/* Sidebar */}
        <div className={`${sidebarOpen ? 'translate-x-0' : '-translate-x-full'} md:translate-x-0 fixed md:static inset-y-0 left-0 z-50 transition-transform duration-300`}>
          <Sidebar
            currentSection={currentSection}
            onSectionChange={(section) => {
              setCurrentSection(section);
              setSidebarOpen(false); // Close sidebar on mobile after selection
            }}
            orgId={orgId}
          />
        </div>

        {/* Main Panel */}
        <main className="flex-1 flex flex-col overflow-hidden w-full">
          {/* Header */}
          <header className="h-14 md:h-16 border-b border-white/10 bg-black/20 backdrop-blur-xl flex items-center justify-between px-4 md:px-8">
            <div className="flex items-center gap-3">
              <button
                onClick={() => setSidebarOpen(!sidebarOpen)}
                className="md:hidden p-2 hover:bg-white/10 rounded-lg transition"
              >
                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                </svg>
              </button>
              <h1 className="text-white text-lg md:text-xl font-semibold">{sectionTitles[currentSection]}</h1>
            </div>
            <button
              onClick={handleRefresh}
              disabled={refreshing}
              className="inline-flex items-center gap-2 px-3 md:px-4 py-2 rounded-lg bg-white/10 hover:bg-white/20 transition text-white text-sm font-medium disabled:opacity-50"
            >
              <RefreshCw className={`h-4 w-4 ${refreshing ? 'animate-spin' : ''}`} />
              <span className="hidden sm:inline">Refresh</span>
            </button>
          </header>

          {/* Content */}
          <div className="flex-1 overflow-y-auto p-4 md:p-6 lg:p-8">
            {renderContent()}
          </div>
        </main>
      </div>
    </ThemeProvider>
  );
}

