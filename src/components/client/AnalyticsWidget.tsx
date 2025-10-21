'use client';

import { useState, useEffect } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { TrendingUp, CheckCircle, ClipboardCheck } from 'lucide-react';

interface AnalyticsData {
  totalLeads: number;
  approved: number;
  completed: number;
  newStatus: number;
  newThisWeek: number;
  trend: Array<{ date: string; count: number }>;
}

interface AnalyticsWidgetProps {
  orgId: string;
}

export default function AnalyticsWidget({ orgId }: AnalyticsWidgetProps) {
  const [analytics, setAnalytics] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchAnalytics = async () => {
    try {
      const res = await fetch(`/api/analytics/summary?orgId=${orgId}`);
      if (!res.ok) throw new Error('Failed to fetch analytics');
      
      const data = await res.json();
      if (data.success) {
        setAnalytics(data);
        setError(null);
      } else {
        setError(data.error || 'Failed to load analytics');
      }
    } catch (err) {
      console.error('Error fetching analytics:', err);
      setError('Failed to load analytics');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAnalytics();

    // Auto-refresh every 30 seconds
    const interval = setInterval(fetchAnalytics, 30000);

    return () => clearInterval(interval);
  }, [orgId]);

  if (loading) {
    return (
      <div className="bg-white shadow-md rounded-lg border border-gray-200 p-6">
        <h3 className="text-lg font-semibold text-gray-800 mb-4">Analytics</h3>
        <div className="text-center text-gray-500 py-8">Loading analytics...</div>
      </div>
    );
  }

  if (error || !analytics) {
    return (
      <div className="bg-white shadow-md rounded-lg border border-gray-200 p-6">
        <h3 className="text-lg font-semibold text-gray-800 mb-4">Analytics</h3>
        <div className="text-center text-red-500 py-8">{error || 'No data available'}</div>
      </div>
    );
  }

  const statCards = [
    {
      label: 'Total Leads',
      value: analytics.totalLeads,
      icon: TrendingUp,
      color: 'text-blue-600',
      bgColor: 'bg-blue-50',
      borderColor: 'border-blue-200',
    },
    {
      label: 'Approved',
      value: analytics.approved,
      icon: ClipboardCheck,
      color: 'text-yellow-600',
      bgColor: 'bg-yellow-50',
      borderColor: 'border-yellow-200',
    },
    {
      label: 'Completed',
      value: analytics.completed,
      icon: CheckCircle,
      color: 'text-green-600',
      bgColor: 'bg-green-50',
      borderColor: 'border-green-200',
    },
  ];

  // Format dates for chart
  const chartData = analytics.trend.map(item => ({
    date: new Date(item.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
    count: item.count,
  }));

  return (
    <div className="bg-white shadow-md rounded-lg border border-gray-200 p-6">
      <div className="flex justify-between items-center mb-6">
        <h3 className="text-lg font-semibold text-gray-800">Analytics Overview</h3>
        <span className="text-xs text-gray-500">Last 7 days</span>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        {statCards.map((stat) => {
          const Icon = stat.icon;
          return (
            <div
              key={stat.label}
              className={`${stat.bgColor} ${stat.borderColor} rounded-lg border p-4 flex items-center gap-3 transition-shadow hover:shadow-md`}
            >
              <Icon className={`h-8 w-8 ${stat.color} flex-shrink-0`} />
              <div className="flex-1">
                <div className={`text-3xl font-bold ${stat.color}`}>
                  {stat.value}
                </div>
                <div className="text-sm font-medium text-gray-600">
                  {stat.label}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* New This Week Badge */}
      {analytics.newThisWeek > 0 && (
        <div className="mb-6 inline-flex items-center gap-2 bg-blue-50 border border-blue-200 rounded-full px-4 py-2">
          <TrendingUp className="h-4 w-4 text-blue-600" />
          <span className="text-sm font-medium text-blue-700">
            {analytics.newThisWeek} new {analytics.newThisWeek === 1 ? 'lead' : 'leads'} this week
          </span>
        </div>
      )}

      {/* 7-Day Trend Chart */}
      <div className="mt-6">
        <h4 className="text-sm font-semibold text-gray-700 mb-4">Lead Trend (7 Days)</h4>
        {chartData.every(d => d.count === 0) ? (
          <div className="text-center text-gray-500 py-8 bg-gray-50 rounded-lg">
            No leads created in the last 7 days
          </div>
        ) : (
          <ResponsiveContainer width="100%" height={200}>
            <LineChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis 
                dataKey="date" 
                tick={{ fontSize: 12 }}
                stroke="#9ca3af"
              />
              <YAxis 
                tick={{ fontSize: 12 }}
                stroke="#9ca3af"
                allowDecimals={false}
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: 'white',
                  border: '1px solid #e5e7eb',
                  borderRadius: '0.5rem',
                  fontSize: '12px',
                }}
              />
              <Line 
                type="monotone" 
                dataKey="count" 
                stroke="#3b82f6" 
                strokeWidth={2}
                dot={{ fill: '#3b82f6', r: 4 }}
                activeDot={{ r: 6 }}
              />
            </LineChart>
          </ResponsiveContainer>
        )}
      </div>
    </div>
  );
}

