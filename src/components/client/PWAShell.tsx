'use client';

import { useState } from 'react';
import { Menu, X, LayoutDashboard, BarChart3, Settings, LogOut } from 'lucide-react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

interface PWAShellProps {
  children: React.ReactNode;
  orgId: string;
}

export default function PWAShell({ children, orgId }: PWAShellProps) {
  const [menuOpen, setMenuOpen] = useState(false);
  const pathname = usePathname();

  const menuItems = [
    {
      name: 'Dashboard',
      href: `/client/${orgId}`,
      icon: LayoutDashboard,
    },
    {
      name: 'Analytics',
      href: `/client/${orgId}#analytics`,
      icon: BarChart3,
    },
    {
      name: 'Settings',
      href: `/client/${orgId}#settings`,
      icon: Settings,
    },
  ];

  const handleLogout = () => {
    // Clear cookie by setting expired cookie
    document.cookie = 'll_client_org=; Max-Age=0; Path=/';
    window.location.href = '/client-app';
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Top Navigation Bar */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-50 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            {/* Logo */}
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-blue-600 rounded flex items-center justify-center">
                <span className="text-white text-sm font-bold">LL</span>
              </div>
              <span className="font-semibold text-gray-900">LeadLocker</span>
            </div>

            {/* Desktop Navigation */}
            <nav className="hidden md:flex items-center gap-6">
              {menuItems.map((item) => {
                const Icon = item.icon;
                const isActive = pathname === item.href;
                return (
                  <Link
                    key={item.name}
                    href={item.href}
                    className={`flex items-center gap-2 px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                      isActive
                        ? 'bg-blue-50 text-blue-700'
                        : 'text-gray-700 hover:bg-gray-100'
                    }`}
                  >
                    <Icon className="h-4 w-4" />
                    {item.name}
                  </Link>
                );
              })}
              <button
                onClick={handleLogout}
                className="flex items-center gap-2 px-3 py-2 rounded-md text-sm font-medium text-red-700 hover:bg-red-50 transition-colors"
              >
                <LogOut className="h-4 w-4" />
                Logout
              </button>
            </nav>

            {/* Mobile Menu Button */}
            <button
              onClick={() => setMenuOpen(!menuOpen)}
              className="md:hidden p-2 rounded-md text-gray-700 hover:bg-gray-100"
            >
              {menuOpen ? (
                <X className="h-6 w-6" />
              ) : (
                <Menu className="h-6 w-6" />
              )}
            </button>
          </div>
        </div>

        {/* Mobile Menu Drawer */}
        {menuOpen && (
          <div className="md:hidden border-t border-gray-200 bg-white">
            <nav className="px-4 py-3 space-y-1">
              {menuItems.map((item) => {
                const Icon = item.icon;
                const isActive = pathname === item.href;
                return (
                  <Link
                    key={item.name}
                    href={item.href}
                    onClick={() => setMenuOpen(false)}
                    className={`flex items-center gap-3 px-4 py-3 rounded-md text-sm font-medium transition-colors ${
                      isActive
                        ? 'bg-blue-50 text-blue-700'
                        : 'text-gray-700 hover:bg-gray-100'
                    }`}
                  >
                    <Icon className="h-5 w-5" />
                    {item.name}
                  </Link>
                );
              })}
              <button
                onClick={handleLogout}
                className="flex items-center gap-3 px-4 py-3 rounded-md text-sm font-medium text-red-700 hover:bg-red-50 transition-colors w-full text-left"
              >
                <LogOut className="h-5 w-5" />
                Logout
              </button>
            </nav>
          </div>
        )}
      </header>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 py-6 sm:px-6 lg:px-8">
        {children}
      </div>
    </div>
  );
}

