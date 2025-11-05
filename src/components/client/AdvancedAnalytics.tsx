'use client';

import { useState, useEffect } from 'react';
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';
import { TrendingUp, ArrowUpRight, Activity } from 'lucide-react';

interface AdvancedAnalyticsProps {
  orgId: string;
}

export default function AdvancedAnalytics({ orgId }: AdvancedAnalyticsProps) {
  const [data, setData] = useState({
    total_leads: 0,
    total_approved: 0,
    approval_rate: 0,
    avg_time: 0,
    trend: [] as Array<{ date: string; count: number }>
  });

  useEffect(() => {
    // Initialize with empty data for new clients
    setData({
      total_leads: 0,
      total_approved: 0,
      approval_rate: 0,
      avg_time: 0,
      trend: []
    });
  }, [orgId]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-50 p-8">
      {/* Full Width Hero Stats */}
      <div className="max-w-7xl mx-auto">
        <div className="mb-8">
          <div className="flex items-baseline gap-3 mb-2">
            <h1 className="text-5xl font-bold text-slate-900">{data.total_leads}</h1>
            <span className="text-lg text-slate-500">total leads</span>
          </div>
          <div className="flex items-center gap-2 text-sm text-emerald-600">
            <ArrowUpRight className="h-4 w-4" />
            <span>Getting started</span>
          </div>
        </div>

        {/* Horizontal Metric Strip */}
        <div className="flex gap-12 mb-12 pb-8 border-b border-slate-200">
          <div className="flex flex-col">
            <span className="text-xs uppercase tracking-wider text-slate-500 mb-2">Approved</span>
            <span className="text-3xl font-semibold text-slate-900">{data.total_approved}</span>
          </div>
          
          <div className="flex flex-col">
            <span className="text-xs uppercase tracking-wider text-slate-500 mb-2">Conversion</span>
            <span className="text-3xl font-semibold text-slate-900">{data.approval_rate}%</span>
          </div>
          
          <div className="flex flex-col">
            <span className="text-xs uppercase tracking-wider text-slate-500 mb-2">Avg Response</span>
            <span className="text-3xl font-semibold text-slate-900">{data.avg_time.toFixed(1)}h</span>
          </div>
        </div>

        {/* Large Full-Width Chart Area */}
        {data.trend.length > 0 ? (
          <div className="bg-white/50 backdrop-blur rounded-3xl p-8 border border-slate-200/50 shadow-xl shadow-slate-200/20">
            <div className="flex items-center gap-2 mb-8">
              <Activity className="h-5 w-5 text-slate-400" />
              <h2 className="text-sm font-medium text-slate-600 uppercase tracking-wide">Activity Timeline</h2>
            </div>
            <ResponsiveContainer width="100%" height={400}>
              <AreaChart data={data.trend}>
                <defs>
                  <linearGradient id="areaGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#0EA5E9" stopOpacity={0.3}/>
                    <stop offset="100%" stopColor="#0EA5E9" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <XAxis 
                  dataKey="date"
                  tick={{ fontSize: 12, fill: '#94A3B8' }}
                  tickLine={false}
                  axisLine={false}
                />
                <YAxis 
                  tick={{ fontSize: 12, fill: '#94A3B8' }}
                  tickLine={false}
                  axisLine={false}
                />
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: '#0F172A',
                    border: 'none',
                    borderRadius: '12px',
                    color: '#FFF',
                    fontSize: 14,
                    padding: '12px 16px'
                  }}
                />
                <Area 
                  type="monotone"
                  dataKey="count"
                  stroke="#0EA5E9"
                  strokeWidth={3}
                  fill="url(#areaGradient)"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-24 text-center">
            <div className="mb-6 p-6 rounded-full bg-slate-100">
              <TrendingUp className="h-12 w-12 text-slate-400" />
            </div>
            <h3 className="text-xl font-medium text-slate-900 mb-2">No data yet</h3>
            <p className="text-slate-500 max-w-sm">
              Your analytics will appear here once you start receiving leads
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
