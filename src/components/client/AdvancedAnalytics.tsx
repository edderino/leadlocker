'use client';

import { useState, useEffect } from 'react';
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer
} from 'recharts';
import { TrendingUp, BarChart3, PieChart as PieChartIcon, Clock, Loader2, RefreshCw } from 'lucide-react';

// ========================================
// TYPE DEFINITIONS
// ========================================

interface AdvancedAnalyticsProps {
  orgId: string;
}

interface AnalyticsData {
  success: boolean;
  org_id: string;
  time_range: number;
  generated_at: string;
  data: {
    lead_trends: LeadTrend[];
    approval_metrics: ApprovalMetric[];
    source_distribution: SourceDistribution[];
    followup_completion: FollowUpMetric[];
    summary: Summary;
  };
  error?: string;
}

interface LeadTrend {
  date: string;
  count: number;
  status_breakdown: {
    new: number;
    approved: number;
    completed: number;
  };
}

interface ApprovalMetric {
  week: string;
  approval_rate: number;
  avg_time_hours: number;
  total_leads: number;
}

interface SourceDistribution {
  source: string;
  count: number;
  percentage: number;
}

interface FollowUpMetric {
  date: string;
  triggered: number;
  completed: number;
  completion_rate: number;
}

interface Summary {
  total_leads: number;
  total_approved: number;
  total_completed: number;
  avg_approval_time_hours: number;
  approval_rate: number;
  followup_completion_rate: number;
}

// Chart colors
const COLORS = {
  primary: '#2563EB',
  success: '#10B981',
  warning: '#F59E0B',
  danger: '#EF4444',
  purple: '#8B5CF6',
  indigo: '#6366F1',
};

const PIE_COLORS = ['#2563EB', '#10B981', '#F59E0B', '#EF4444'];

// ========================================
// ADVANCED ANALYTICS COMPONENT
// ========================================

export default function AdvancedAnalytics({ orgId }: AdvancedAnalyticsProps) {
  const [analyticsData, setAnalyticsData] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [timeRange, setTimeRange] = useState<number>(7);
  const [refreshing, setRefreshing] = useState(false);
  const [mounted, setMounted] = useState(false);

  // Prevent hydration mismatch
  useEffect(() => {
    setMounted(true);
  }, []);

  const fetchAnalytics = async (showRefreshing = false) => {
    if (showRefreshing) {
      setRefreshing(true);
    } else {
      setLoading(true);
    }
    setError(null);

    try {
      console.log(`[AdvancedAnalytics] Initializing for new client org: ${orgId}`);
      // For new clients, start with empty analytics data
      setAnalyticsData({
        success: true,
        org_id: orgId,
        time_range: timeRange,
        generated_at: new Date().toISOString(),
        data: {
          lead_trends: [],
          approval_metrics: [],
          source_distribution: [],
          followup_completion: [],
          summary: {
            total_leads: 0,
            new_leads: 0,
            approved_leads: 0,
            completed_leads: 0,
            avg_approval_time: 0,
            conversion_rate: 0
          }
        }
      });
      console.log(`[AdvancedAnalytics] ✅ Initialized empty analytics for new client: ${orgId}`);
    } catch (err: any) {
      console.error('[AdvancedAnalytics] ❌ Error initializing analytics:', err);
      setError('Failed to initialize analytics');
      setAnalyticsData(null);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchAnalytics();
    const interval = setInterval(() => fetchAnalytics(true), 60000); // Auto-refresh every 60 seconds
    return () => clearInterval(interval);
  }, [orgId, timeRange]);

  // Prevent hydration mismatch - don't render until mounted
  if (!mounted) {
    return (
      <div className="bg-white border border-gray-200 rounded-lg p-8 flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-blue-600 mr-3" />
        <p className="text-gray-600">Initializing analytics...</p>
      </div>
    );
  }

  // Loading state
  if (loading) {
    return (
      <div className="bg-white border border-gray-200 rounded-lg p-8 flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-blue-600 mr-3" />
        <p className="text-gray-600">Loading advanced analytics...</p>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-6">
        <div className="flex items-start gap-3">
          <div className="flex-shrink-0">
            <svg className="h-6 w-6 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <div>
            <h3 className="text-sm font-medium text-red-800">Error loading analytics</h3>
            <p className="text-sm text-red-600 mt-1">{error}</p>
            <button
              onClick={() => fetchAnalytics()}
              className="mt-3 text-sm text-red-700 hover:text-red-800 underline"
            >
              Try again
            </button>
          </div>
        </div>
      </div>
    );
  }

  // No data state
  if (!analyticsData || !analyticsData.data) {
    console.log('[AdvancedAnalytics] No data available, showing fallback');
    return (
      <div className="bg-gray-50 border border-gray-200 rounded-lg p-6">
        <div className="text-center">
          <BarChart3 className="h-12 w-12 text-gray-400 mx-auto mb-3" />
          <p className="text-sm font-medium text-gray-700">No Analytics Data Available</p>
          <p className="text-xs text-gray-500 mt-1">
            Analytics will appear once you have lead data for the selected time range.
          </p>
        </div>
      </div>
    );
  }

  console.log('[AdvancedAnalytics] Rendering with data:', {
    hasTrends: !!analyticsData.data?.lead_trends,
    hasApprovalMetrics: !!analyticsData.data?.approval_metrics,
    hasSources: !!analyticsData.data?.source_distribution,
    hasSummary: !!analyticsData.data?.summary
  });

  const { data, generated_at } = analyticsData;
  
  // Defensive extraction with defaults - ensure all data is arrays
  const lead_trends = Array.isArray(data?.lead_trends) ? data.lead_trends : [];
  const approval_metrics = Array.isArray(data?.approval_metrics) ? data.approval_metrics : [];
  const source_distribution = Array.isArray(data?.source_distribution) ? data.source_distribution : [];
  const summary = data?.summary || {
    total_leads: 0,
    total_approved: 0,
    total_completed: 0,
    avg_approval_time_hours: 0,
    approval_rate: 0,
    followup_completion_rate: 0
  };

  console.log('[AdvancedAnalytics] Data safety check:', {
    lead_trends_length: lead_trends.length,
    approval_metrics_length: approval_metrics.length,
    source_distribution_length: source_distribution.length,
    lead_trends_isArray: Array.isArray(lead_trends),
    approval_metrics_isArray: Array.isArray(approval_metrics),
    source_distribution_isArray: Array.isArray(source_distribution)
  });

  // Format date for display
  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  // Format week for display
  const formatWeek = (weekStr: string) => {
    const [year, week] = weekStr.split('-W');
    return `W${week}`;
  };

  // Wrap entire render in try/catch
  try {
    console.log('[AdvancedAnalytics] Beginning render');
    
    return (
      <div className="bg-white border border-gray-200 rounded-lg p-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-xl font-semibold text-gray-900 flex items-center gap-2">
              <TrendingUp className="h-6 w-6 text-blue-600" />
              Advanced Analytics
            </h2>
            <p className="text-xs text-gray-500 mt-1">
              Generated {new Date(generated_at).toLocaleTimeString()}
              {refreshing && <span className="ml-2 text-blue-600">• Refreshing...</span>}
            </p>
          </div>
          <div className="flex items-center gap-3">
            {/* Time Range Selector */}
            <select
              value={timeRange}
              onChange={(e) => setTimeRange(parseInt(e.target.value, 10))}
              className="px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value={7}>Last 7 days</option>
              <option value={14}>Last 14 days</option>
              <option value={30}>Last 30 days</option>
            </select>
            
            {/* Manual Refresh Button */}
            <button
              onClick={() => fetchAnalytics(true)}
              disabled={refreshing}
              className="p-2 text-gray-600 hover:text-blue-600 hover:bg-blue-50 rounded-md transition-colors disabled:opacity-50"
              title="Refresh analytics"
            >
              <RefreshCw className={`h-5 w-5 ${refreshing ? 'animate-spin' : ''}`} />
            </button>
          </div>
        </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
        <div className="bg-blue-50 border border-blue-100 rounded-lg p-4">
          <p className="text-xs font-medium text-blue-600 uppercase tracking-wide">Total Leads</p>
          <p className="text-3xl font-bold text-blue-900 mt-2">{summary.total_leads}</p>
        </div>
        <div className="bg-green-50 border border-green-100 rounded-lg p-4">
          <p className="text-xs font-medium text-green-600 uppercase tracking-wide">Approval Rate</p>
          <p className="text-3xl font-bold text-green-900 mt-2">{summary.approval_rate.toFixed(1)}%</p>
        </div>
        <div className="bg-purple-50 border border-purple-100 rounded-lg p-4">
          <p className="text-xs font-medium text-purple-600 uppercase tracking-wide">Avg Approval Time</p>
          <p className="text-3xl font-bold text-purple-900 mt-2">{summary.avg_approval_time_hours.toFixed(1)}h</p>
        </div>
        <div className="bg-orange-50 border border-orange-100 rounded-lg p-4">
          <p className="text-xs font-medium text-orange-600 uppercase tracking-wide">Completed</p>
          <p className="text-3xl font-bold text-orange-900 mt-2">{summary.total_completed}</p>
        </div>
      </div>

      {/* Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Lead Trends Chart */}
        <div className="border border-gray-200 rounded-lg p-4">
          <h3 className="text-sm font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <TrendingUp className="h-4 w-4 text-blue-600" />
            Lead Trends Over Time
          </h3>
          {(() => {
            try {
              console.log('[AdvancedAnalytics] Rendering Lead Trends Chart with data:', lead_trends.length);
              const safeData = Array.isArray(lead_trends) ? lead_trends : [];
              
              if (safeData.length === 0) {
                return (
                  <div className="flex items-center justify-center h-[250px] text-gray-500 text-sm">
                    No lead trend data available
                  </div>
                );
              }

              return (
                <ResponsiveContainer width="100%" height={250}>
                  <LineChart data={safeData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
                    <XAxis 
                      dataKey="date" 
                      tickFormatter={formatDate}
                      tick={{ fontSize: 11 }}
                      stroke="#6B7280"
                    />
                    <YAxis tick={{ fontSize: 11 }} stroke="#6B7280" />
                    <Tooltip 
                      contentStyle={{ fontSize: 12, backgroundColor: '#FFF', border: '1px solid #E5E7EB' }}
                      labelFormatter={formatDate}
                    />
                    <Legend wrapperStyle={{ fontSize: 11 }} />
                    <Line 
                      type="monotone" 
                      dataKey="count" 
                      stroke={COLORS.primary} 
                      strokeWidth={2}
                      name="Total Leads"
                      dot={{ fill: COLORS.primary, r: 4 }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              );
            } catch (error) {
              console.error('[AdvancedAnalytics] Error rendering Lead Trends Chart:', error);
              return (
                <div className="flex items-center justify-center h-[250px] text-red-500 text-sm">
                  Error rendering lead trends chart
                </div>
              );
            }
          })()}
        </div>

        {/* Approval Metrics Chart */}
        <div className="border border-gray-200 rounded-lg p-4">
          <h3 className="text-sm font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <BarChart3 className="h-4 w-4 text-green-600" />
            Approval Rate by Week
          </h3>
          {(() => {
            try {
              console.log('[AdvancedAnalytics] Rendering Approval Metrics Chart with data:', approval_metrics.length);
              const safeData = Array.isArray(approval_metrics) ? approval_metrics : [];
              
              if (safeData.length === 0) {
                return (
                  <div className="flex items-center justify-center h-[250px] text-gray-500 text-sm">
                    No approval metrics data available
                  </div>
                );
              }

              return (
                <ResponsiveContainer width="100%" height={250}>
                  <BarChart data={safeData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
                    <XAxis 
                      dataKey="week" 
                      tickFormatter={formatWeek}
                      tick={{ fontSize: 11 }}
                      stroke="#6B7280"
                    />
                    <YAxis tick={{ fontSize: 11 }} stroke="#6B7280" />
                    <Tooltip 
                      contentStyle={{ fontSize: 12, backgroundColor: '#FFF', border: '1px solid #E5E7EB' }}
                      labelFormatter={formatWeek}
                      formatter={(value: number, name: string) => {
                        if (name === 'approval_rate') return `${value.toFixed(1)}%`;
                        if (name === 'avg_time_hours') return `${value.toFixed(1)}h`;
                        return value;
                      }}
                    />
                    <Legend wrapperStyle={{ fontSize: 11 }} />
                    <Bar 
                      dataKey="approval_rate" 
                      fill={COLORS.success} 
                      name="Approval Rate (%)"
                      radius={[4, 4, 0, 0]}
                    />
                  </BarChart>
                </ResponsiveContainer>
              );
            } catch (error) {
              console.error('[AdvancedAnalytics] Error rendering Approval Metrics Chart:', error);
              return (
                <div className="flex items-center justify-center h-[250px] text-red-500 text-sm">
                  Error rendering approval metrics chart
                </div>
              );
            }
          })()}
        </div>

        {/* Source Distribution Chart */}
        <div className="border border-gray-200 rounded-lg p-4">
          <h3 className="text-sm font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <PieChartIcon className="h-4 w-4 text-purple-600" />
            Lead Source Distribution
          </h3>
          {(() => {
            try {
              console.log('[AdvancedAnalytics] Rendering Source Distribution Chart with data:', source_distribution.length);
              const safeData = Array.isArray(source_distribution) ? source_distribution : [];
              
              if (safeData.length === 0) {
                return (
                  <div className="flex items-center justify-center h-[250px] text-gray-500 text-sm">
                    No source data available
                  </div>
                );
              }

              return (
                <ResponsiveContainer width="100%" height={250}>
                  <PieChart>
                    <Pie
                      data={safeData as any}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={(props: any) => `${props.source}: ${props.percentage.toFixed(0)}%`}
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="count"
                    >
                      {safeData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={PIE_COLORS[index % PIE_COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip 
                      contentStyle={{ fontSize: 12, backgroundColor: '#FFF', border: '1px solid #E5E7EB' }}
                      formatter={(value: number, name: string, props: any) => {
                        const percentage = props.payload.percentage;
                        return [`${value} (${percentage.toFixed(1)}%)`, props.payload.source];
                      }}
                    />
                  </PieChart>
                </ResponsiveContainer>
              );
            } catch (error) {
              console.error('[AdvancedAnalytics] Error rendering Source Distribution Chart:', error);
              return (
                <div className="flex items-center justify-center h-[250px] text-red-500 text-sm">
                  Error rendering source distribution chart
                </div>
              );
            }
          })()}
        </div>

        {/* Approval Time Trend */}
        <div className="border border-gray-200 rounded-lg p-4">
          <h3 className="text-sm font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <Clock className="h-4 w-4 text-orange-600" />
            Avg Approval Time (Hours)
          </h3>
          {(() => {
            try {
              console.log('[AdvancedAnalytics] Rendering Approval Time Chart with data:', approval_metrics.length);
              const safeData = Array.isArray(approval_metrics) ? approval_metrics : [];
              
              if (safeData.length === 0) {
                return (
                  <div className="flex items-center justify-center h-[250px] text-gray-500 text-sm">
                    No approval time data available
                  </div>
                );
              }

              return (
                <ResponsiveContainer width="100%" height={250}>
                  <LineChart data={safeData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
                    <XAxis 
                      dataKey="week" 
                      tickFormatter={formatWeek}
                      tick={{ fontSize: 11 }}
                      stroke="#6B7280"
                    />
                    <YAxis tick={{ fontSize: 11 }} stroke="#6B7280" />
                    <Tooltip 
                      contentStyle={{ fontSize: 12, backgroundColor: '#FFF', border: '1px solid #E5E7EB' }}
                      labelFormatter={formatWeek}
                      formatter={(value: number) => `${value.toFixed(1)}h`}
                    />
                    <Legend wrapperStyle={{ fontSize: 11 }} />
                    <Line 
                      type="monotone" 
                      dataKey="avg_time_hours" 
                      stroke={COLORS.warning} 
                      strokeWidth={2}
                      name="Avg Time (hours)"
                      dot={{ fill: COLORS.warning, r: 4 }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              );
            } catch (error) {
              console.error('[AdvancedAnalytics] Error rendering Approval Time Chart:', error);
              return (
                <div className="flex items-center justify-center h-[250px] text-red-500 text-sm">
                  Error rendering approval time chart
                </div>
              );
            }
          })()}
        </div>
      </div>
    </div>
    );
  } catch (renderError) {
    console.error('[AdvancedAnalytics] ❌ Render error:', renderError);
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-6">
        <div className="flex items-start gap-3">
          <div className="flex-shrink-0">
            <svg className="h-6 w-6 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <div>
            <h3 className="text-sm font-medium text-red-800">Error rendering analytics</h3>
            <p className="text-sm text-red-600 mt-1">
              {renderError instanceof Error ? renderError.message : 'An unexpected error occurred'}
            </p>
            <button
              onClick={() => window.location.reload()}
              className="mt-3 text-sm text-red-700 hover:text-red-800 underline"
            >
              Reload page
            </button>
          </div>
        </div>
      </div>
    );
  }
}
