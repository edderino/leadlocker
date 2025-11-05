'use client';

import { TrendingUp, Users, CheckCircle2, Clock } from 'lucide-react';

type Lead = {
  id: string;
  status: 'NEW' | 'APPROVED' | 'COMPLETED';
  created_at: string;
};

interface OverviewProps {
  leads: Lead[];
}

export default function Overview({ leads }: OverviewProps) {
  const stats = {
    total: leads.length,
    new: leads.filter(l => l.status === 'NEW').length,
    approved: leads.filter(l => l.status === 'APPROVED').length,
    completed: leads.filter(l => l.status === 'COMPLETED').length,
  };

  const kpis = [
    {
      label: 'Total Leads',
      value: stats.total,
      icon: Users,
      gradient: 'from-[#8b5cf6] to-[#6d28d9]',
      bgGradient: 'from-[#8b5cf6]/10 to-[#6d28d9]/5',
    },
    {
      label: 'Needs Attention',
      value: stats.new,
      icon: TrendingUp,
      gradient: 'from-[#f97316] to-[#ea580c]',
      bgGradient: 'from-[#f97316]/10 to-[#ea580c]/5',
    },
    {
      label: 'Approved',
      value: stats.approved,
      icon: Clock,
      gradient: 'from-[#fbbf24] to-[#f59e0b]',
      bgGradient: 'from-[#fbbf24]/10 to-[#f59e0b]/5',
    },
    {
      label: 'Completed',
      value: stats.completed,
      icon: CheckCircle2,
      gradient: 'from-[#10b981] to-[#059669]',
      bgGradient: 'from-[#10b981]/10 to-[#059669]/5',
    },
  ];

  return (
    <div className="space-y-6">
      {/* KPI Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {kpis.map((kpi, i) => {
          const Icon = kpi.icon;
          return (
            <div
              key={i}
              className={`relative rounded-xl bg-gradient-to-br ${kpi.bgGradient} backdrop-blur-md border border-white/10 p-6 overflow-hidden group hover:scale-[1.02] transition-all duration-200`}
            >
              {/* Gradient bar */}
              <div className={`absolute top-0 left-0 h-1 w-full bg-gradient-to-r ${kpi.gradient}`} />
              
              {/* Icon */}
              <div className={`inline-flex p-3 rounded-lg bg-gradient-to-br ${kpi.gradient} mb-4`}>
                <Icon className="h-6 w-6 text-white" />
              </div>
              
              {/* Content */}
              <div className="text-gray-400 text-sm uppercase tracking-wider mb-2">{kpi.label}</div>
              <div className="text-4xl font-bold text-white mb-1">{kpi.value}</div>
              
              {/* Mini sparkline placeholder */}
              <div className="mt-4 h-1 w-full bg-white/5 rounded-full overflow-hidden">
                <div 
                  className={`h-full bg-gradient-to-r ${kpi.gradient} rounded-full`}
                  style={{ width: `${Math.min((kpi.value / (stats.total || 1)) * 100, 100)}%` }}
                />
              </div>
            </div>
          );
        })}
      </div>

      {/* Recent Activity */}
      <div className="rounded-xl bg-white/5 backdrop-blur-md border border-white/10 p-6">
        <h3 className="text-white text-lg font-semibold mb-4">Recent Activity</h3>
        {leads.length === 0 ? (
          <div className="text-center py-12 text-gray-400">
            <p>No leads yet. Start adding leads to see activity here.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {leads.slice(0, 5).map((lead) => (
              <div
                key={lead.id}
                className="flex items-center justify-between p-3 rounded-lg bg-white/5 hover:bg-white/10 transition"
              >
                <div className="flex items-center gap-3">
                  <div className={`w-2 h-2 rounded-full ${
                    lead.status === 'NEW' ? 'bg-orange-500' :
                    lead.status === 'APPROVED' ? 'bg-yellow-500' :
                    'bg-green-500'
                  }`} />
                  <span className="text-white text-sm">Lead #{lead.id.slice(0, 8)}</span>
                </div>
                <span className="text-gray-400 text-xs">
                  {new Date(lead.created_at).toLocaleDateString()}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

