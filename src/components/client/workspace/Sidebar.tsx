'use client';

import { motion } from 'framer-motion';
import { LayoutDashboard, Users, BarChart3, Settings, ChevronLeft, LogOut } from 'lucide-react';
import { useState, useEffect } from 'react';

interface SidebarProps {
  currentSection: string;
  onSectionChange: (section: string) => void;
  orgId: string;
}

export default function Sidebar({ currentSection, onSectionChange, orgId }: SidebarProps) {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [clientName, setClientName] = useState<string | null>(null);

  // Load client data to show name instead of ID
  useEffect(() => {
    async function loadClient() {
      try {
        console.log("[Sidebar] Loading client data...");
        const res = await fetch("/api/auth/me", {
          credentials: "include",
          cache: "no-store",
        });
        const data = await res.json();
        if (data.client) {
          const name = data.client.owner_name || data.client.business_name || data.client.name || orgId;
          console.log("[Sidebar] Setting client name to:", name);
          setClientName(name);
        } else {
          console.warn("[Sidebar] No client data in response");
          setClientName(orgId); // Fallback to orgId
        }
      } catch (err) {
        console.error("[Sidebar] Failed to load client data:", err);
        setClientName(orgId); // Fallback to orgId
      }
    }
    loadClient();

    // Listen for custom event when profile is updated
    const handleClientUpdate = () => {
      console.log("[Sidebar] clientUpdated event received, reloading...");
      // Small delay to ensure DB update is complete
      setTimeout(loadClient, 100);
    };
    window.addEventListener('clientUpdated', handleClientUpdate);

    // Also poll periodically as a fallback (every 10 seconds)
    const pollInterval = setInterval(loadClient, 10000);

    return () => {
      window.removeEventListener('clientUpdated', handleClientUpdate);
      clearInterval(pollInterval);
    };
  }, [orgId]);

  const navItems = [
    { id: 'overview', label: 'Overview', icon: LayoutDashboard },
    { id: 'leads', label: 'Leads', icon: Users },
    { id: 'analytics', label: 'Analytics', icon: BarChart3 },
    { id: 'settings', label: 'Settings', icon: Settings },
  ];

  return (
    <motion.aside
      initial={false}
      animate={{ width: isCollapsed ? 80 : 240 }}
      transition={{ duration: 0.2, ease: 'easeInOut' }}
      className="relative h-screen bg-gradient-to-b from-[#0c0f15] to-[#161b22] border-r border-white/10 flex flex-col"
    >
      {/* Header */}
      <div className="p-6 border-b border-white/10 flex items-center justify-between">
        {!isCollapsed && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="font-bold text-xl bg-gradient-to-r from-[#8b5cf6] to-[#10b981] bg-clip-text text-transparent"
          >
            LeadLocker
          </motion.div>
        )}
        <button
          onClick={() => setIsCollapsed(!isCollapsed)}
          className="p-2 hover:bg-white/10 rounded-lg transition"
        >
          <ChevronLeft className={`h-5 w-5 text-white/70 transition-transform ${isCollapsed ? 'rotate-180' : ''}`} />
        </button>
      </div>

      {/* Client Info */}
      <div className="p-4 border-b border-white/10">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[#8b5cf6] to-[#10b981] flex items-center justify-center flex-shrink-0">
            <span className="text-white font-semibold text-sm">
              {clientName ? clientName.slice(0, 2).toUpperCase() : orgId.slice(0, 2).toUpperCase()}
            </span>
          </div>
          {!isCollapsed && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="overflow-hidden"
            >
              <div className="text-white text-sm font-medium truncate">
                {clientName || orgId}
              </div>
              <div className="text-gray-400 text-xs">Client Portal</div>
            </motion.div>
          )}
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-4 space-y-2">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = currentSection === item.id;
          
          return (
            <button
              key={item.id}
              onClick={() => onSectionChange(item.id)}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-all ${
                isActive
                  ? 'bg-white/10 text-white'
                  : 'text-gray-400 hover:bg-white/5 hover:text-white'
              }`}
            >
              <Icon className="h-5 w-5 flex-shrink-0" />
              {!isCollapsed && (
                <motion.span
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="text-sm font-medium"
                >
                  {item.label}
                </motion.span>
              )}
            </button>
          );
        })}
      </nav>

      {/* Logout */}
      <div className="p-4 border-t border-white/10">
        <button
          onClick={async () => {
            await fetch("/api/auth/logout", { method: "POST", credentials: "include" });
            window.location.href = '/login';
          }}
          className="w-full flex items-center gap-3 px-4 py-3 rounded-lg text-gray-400 hover:bg-white/5 hover:text-white transition-all"
        >
          <LogOut className="h-5 w-5 flex-shrink-0" />
          {!isCollapsed && (
            <motion.span
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="text-sm font-medium"
            >
              Logout
            </motion.span>
          )}
        </button>
      </div>
    </motion.aside>
  );
}

