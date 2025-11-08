'use client';

import { useState, useMemo } from 'react';
import { RefreshCw } from 'lucide-react';
import Sidebar from './Sidebar';
import Overview from './Overview';
import Leads from './Leads';
import Messages from './Messages';
import Analytics from './Analytics';
import Settings from './Settings';
import { ThemeProvider } from './ThemeContext';

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

export default function WorkspaceLayout({ leads, orgId }: WorkspaceLayoutProps) {
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
    messages: 'Messages',
    analytics: 'Analytics',
    settings: 'Settings',
  };

  const renderContent = () => {
    switch (currentSection) {
      case 'overview':
        return <Overview leads={leads} totals={totals} />;
      case 'leads':
        return <Leads leads={leads} />;
      case 'messages':
        return <Messages />;
      case 'analytics':
        return <Analytics orgId={orgId} />;
      case 'settings':
        return <Settings />;
      default:
        return <Overview leads={leads} totals={totals} />;
    }
  };

  return (
    <ThemeProvider>
      <div className="flex h-screen bg-gradient-to-br from-[#0c0f15] via-[#161b22] to-[#0c0f15] overflow-hidden">
        {/* Sidebar */}
        <Sidebar
          currentSection={currentSection}
          onSectionChange={setCurrentSection}
          orgId={orgId}
        />

        {/* Main Panel */}
        <main className="flex-1 flex flex-col overflow-hidden">
          {/* Header */}
          <header className="h-16 border-b border-white/10 bg-black/20 backdrop-blur-xl flex items-center justify-between px-8">
            <h1 className="text-white text-xl font-semibold">{sectionTitles[currentSection]}</h1>
            <button
              onClick={handleRefresh}
              disabled={refreshing}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-white/10 hover:bg-white/20 transition text-white text-sm font-medium disabled:opacity-50"
            >
              <RefreshCw className={`h-4 w-4 ${refreshing ? 'animate-spin' : ''}`} />
              Refresh
            </button>
          </header>

          {/* Content */}
          <div className="flex-1 overflow-y-auto p-8">
            {renderContent()}
          </div>
        </main>
      </div>
    </ThemeProvider>
  );
}

