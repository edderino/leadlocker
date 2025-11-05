'use client';

import { useState, useEffect } from 'react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { TrendingUp, Users, CheckCircle2, Clock, RefreshCw } from 'lucide-react';

interface AdvancedAnalyticsProps {
  orgId: string;
}

interface AnalyticsData {
  success: boolean;
  org_id: string;
  time_range: number;
  generated_at: string;
  data: {
    summary: {
      total_leads: number;
      total_approved: number;
      total_completed: number;
      approval_rate: number;
      avg_approval_time_hours: number;
      [key: string]: any;
    };
    lead_trends?: Array<{ date: string; count: number; [key: string]: any }>;
  };
}

export default function AdvancedAnalytics({ orgId }: AdvancedAnalyticsProps) {
  const [data, setData] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [timeRange, setTimeRange] = useState(7);

  useEffect(() => {
    const loadData = async () => {
      try {
        // For now, use empty data structure
        setData({
          success: true,
          org_id: orgId,
          time_range: timeRange,
          generated_at: new Date().toISOString(),
          data: {
            summary: {
              total_leads: 0,
              total_approved: 0,
              total_completed: 0,
              approval_rate: 0,
              avg_approval_time_hours: 0
            },
            lead_trends: []
          }
        });
      } catch (err) {
        console.error('Analytics error:', err);
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [orgId, timeRange]);

  if (loading || !data) {
    return (
      <div className="flex items-center justify-center p-12 bg-white rounded-2xl border border-gray-100">
        <RefreshCw className="h-5 w-5 animate-spin text-gray-400" />
      </div>
    );
  }

  const { summary, lead_trends = [] } = data.data;

  return (
    <div className="space-y-6">
      {/* Minimal Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold text-gray-900">Performance</h2>
          <p className="text-sm text-gray-500 mt-1">Last {timeRange} days</p>
        </div>
        <div className="flex items-center gap-2">
          <select
            value={timeRange}
            onChange={(e) => setTimeRange(Number(e.target.value))}
            className="px-3 py-1.5 text-sm border border-gray-200 rounded-lg bg-white hover:border-gray-300 transition-colors"
          >
            <option value={7}>7 days</option>
            <option value={14}>14 days</option>
            <option value={30}>30 days</option>
          </select>
        </div>
      </div>

      {/* Clean Stat Cards - Single Row */}
      <div className="grid grid-cols-4 gap-4">
        <div className="bg-white rounded-xl border border-gray-100 p-5 hover:border-gray-200 transition-colors">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-blue-50">
              <Users className="h-4 w-4 text-blue-600" />
            </div>
            <div>
              <p className="text-xs text-gray-500 font-medium">Total</p>
              <p className="text-2xl font-semibold text-gray-900">{summary.total_leads}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl border border-gray-100 p-5 hover:border-gray-200 transition-colors">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-green-50">
              <CheckCircle2 className="h-4 w-4 text-green-600" />
            </div>
            <div>
              <p className="text-xs text-gray-500 font-medium">Approved</p>
              <p className="text-2xl font-semibold text-gray-900">{summary.total_approved}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl border border-gray-100 p-5 hover:border-gray-200 transition-colors">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-purple-50">
              <TrendingUp className="h-4 w-4 text-purple-600" />
            </div>
            <div>
              <p className="text-xs text-gray-500 font-medium">Rate</p>
              <p className="text-2xl font-semibold text-gray-900">{summary.approval_rate.toFixed(0)}%</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl border border-gray-100 p-5 hover:border-gray-200 transition-colors">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-amber-50">
              <Clock className="h-4 w-4 text-amber-600" />
            </div>
            <div>
              <p className="text-xs text-gray-500 font-medium">Avg Time</p>
              <p className="text-2xl font-semibold text-gray-900">{summary.avg_approval_time_hours.toFixed(1)}h</p>
            </div>
          </div>
        </div>
      </div>

      {/* Single Clean Chart */}
      {lead_trends.length > 0 ? (
        <div className="bg-white rounded-xl border border-gray-100 p-6">
          <h3 className="text-sm font-medium text-gray-900 mb-6">Lead Activity</h3>
          <ResponsiveContainer width="100%" height={220}>
            <AreaChart data={lead_trends}>
              <defs>
                <linearGradient id="leadGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#3B82F6" stopOpacity={0.1}/>
                  <stop offset="100%" stopColor="#3B82F6" stopOpacity={0}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#F3F4F6" vertical={false} />
              <XAxis 
                dataKey="date"
                tick={{ fontSize: 11, fill: '#9CA3AF' }}
                tickLine={false}
                axisLine={false}
              />
              <YAxis 
                tick={{ fontSize: 11, fill: '#9CA3AF' }}
                tickLine={false}
                axisLine={false}
              />
              <Tooltip 
                contentStyle={{ 
                  backgroundColor: '#FFF',
                  border: 'none',
                  borderRadius: '8px',
                  boxShadow: '0 4px 12px rgba(0,0,0,0.08)',
                  fontSize: 12
                }}
              />
              <Area 
                type="monotone"
                dataKey="count"
                stroke="#3B82F6"
                strokeWidth={2}
                fill="url(#leadGradient)"
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-gray-100 p-12 text-center">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-gray-50 mb-3">
            <TrendingUp className="h-5 w-5 text-gray-400" />
          </div>
          <p className="text-sm text-gray-500">No activity data yet</p>
          <p className="text-xs text-gray-400 mt-1">Charts will appear as leads come in</p>
        </div>
      )}
    </div>
  );
}
