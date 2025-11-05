'use client';

import { useState, useEffect } from 'react';
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer
} from 'recharts';
import { 
  TrendingUp, 
  BarChart3, 
  Users, 
  CheckCircle2, 
  Clock, 
  Loader2, 
  RefreshCw,
  ArrowUpRight,
  ArrowDownRight,
  Minus
} from 'lucide-react';

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

// Modern professional color scheme
const COLORS = {
  primary: '#3B82F6',      // Blue 500
  secondary: '#8B5CF6',    // Purple 500
  success: '#10B981',      // Green 500
  warning: '#F59E0B',      // Amber 500
  danger: '#EF4444',       // Red 500
  gray: {
    50: '#F9FAFB',
    100: '#F3F4F6',
    200: '#E5E7EB',
    300: '#D1D5DB',
    400: '#9CA3AF',
    500: '#6B7280',
    600: '#4B5563',
    700: '#374151',
    800: '#1F2937',
    900: '#111827',
  }
};

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
      console.log(`[AdvancedAnalytics] Fetching analytics for org: ${orgId}, range: ${timeRange}d`);
      const response = await fetch(`/api/analytics/advanced?orgId=${orgId}&range=${timeRange}`);
      const data: AnalyticsData = await response.json();

      console.log('[AdvancedAnalytics] API response:', { success: data.success, hasData: !!data.data });

      if (!response.ok) {
        throw new Error(data.error || 'Failed to fetch analytics');
      }

      if (data.success && data.data) {
        setAnalyticsData(data);
        console.log(`[AdvancedAnalytics] ✅ Loaded analytics for org: ${orgId}, range: ${timeRange}d, trends: ${data.data.lead_trends?.length || 0}`);
      } else {
        console.warn('[AdvancedAnalytics] ⚠️ No data returned');
        setError(data.error || 'No analytics data available');
        setAnalyticsData(null);
      }
    } catch (err: any) {
      console.error('[AdvancedAnalytics] ❌ Error fetching analytics:', err);
      setError(err.message || 'Failed to load analytics');
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
      <div className="space-y-6">
        {/* Modern Header */}
        <div className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <div className="flex items-center gap-3 mb-2">
                <div className="p-2.5 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl shadow-sm">
                  <TrendingUp className="h-6 w-6 text-white" />
                </div>
                <div>
                  <h2 className="text-2xl font-bold text-gray-900">Analytics Dashboard</h2>
                  <p className="text-sm text-gray-500 mt-0.5">
                    Real-time performance insights
                  </p>
                </div>
              </div>
            </div>
            <div className="flex items-center gap-3">
              {/* Time Range Selector */}
              <select
                value={timeRange}
                onChange={(e) => setTimeRange(parseInt(e.target.value, 10))}
                className="px-4 py-2.5 text-sm font-medium border border-gray-300 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all hover:border-gray-400 cursor-pointer"
              >
                <option value={7}>Last 7 days</option>
                <option value={14}>Last 14 days</option>
                <option value={30}>Last 30 days</option>
              </select>
              
              {/* Manual Refresh Button */}
              <button
                onClick={() => fetchAnalytics(true)}
                disabled={refreshing}
                className="p-2.5 text-gray-600 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                title="Refresh analytics"
              >
                <RefreshCw className={`h-5 w-5 ${refreshing ? 'animate-spin' : ''}`} />
              </button>
            </div>
          </div>
          {refreshing && (
            <div className="mt-3 flex items-center gap-2 text-xs text-blue-600">
              <div className="h-1.5 w-1.5 bg-blue-600 rounded-full animate-pulse"></div>
              <span>Refreshing data...</span>
            </div>
          )}
          {!refreshing && (
            <p className="text-xs text-gray-400 mt-3">
              Last updated {new Date(generated_at).toLocaleString()}
            </p>
          )}
        </div>

      {/* Modern Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {/* Total Leads Card */}
        <div className="group relative bg-gradient-to-br from-blue-50 to-white border border-gray-200 rounded-xl p-6 shadow-sm hover:shadow-md transition-all duration-300 hover:-translate-y-0.5">
          <div className="flex items-start justify-between mb-3">
            <div className="p-2 bg-blue-100 rounded-lg">
              <Users className="h-5 w-5 text-blue-600" />
            </div>
            <div className="flex items-center text-xs font-medium text-green-600">
              <ArrowUpRight className="h-3 w-3 mr-0.5" />
              12%
            </div>
          </div>
          <p className="text-sm font-medium text-gray-600 mb-1">Total Leads</p>
          <p className="text-3xl font-bold text-gray-900 tracking-tight">{summary.total_leads}</p>
          <p className="text-xs text-gray-500 mt-2">Last {timeRange} days</p>
        </div>

        {/* Approval Rate Card */}
        <div className="group relative bg-gradient-to-br from-green-50 to-white border border-gray-200 rounded-xl p-6 shadow-sm hover:shadow-md transition-all duration-300 hover:-translate-y-0.5">
          <div className="flex items-start justify-between mb-3">
            <div className="p-2 bg-green-100 rounded-lg">
              <CheckCircle2 className="h-5 w-5 text-green-600" />
            </div>
            <div className="flex items-center text-xs font-medium text-green-600">
              <ArrowUpRight className="h-3 w-3 mr-0.5" />
              8%
            </div>
          </div>
          <p className="text-sm font-medium text-gray-600 mb-1">Approval Rate</p>
          <p className="text-3xl font-bold text-gray-900 tracking-tight">{summary.approval_rate.toFixed(1)}%</p>
          <p className="text-xs text-gray-500 mt-2">{summary.total_approved} approved</p>
        </div>

        {/* Average Time Card */}
        <div className="group relative bg-gradient-to-br from-purple-50 to-white border border-gray-200 rounded-xl p-6 shadow-sm hover:shadow-md transition-all duration-300 hover:-translate-y-0.5">
          <div className="flex items-start justify-between mb-3">
            <div className="p-2 bg-purple-100 rounded-lg">
              <Clock className="h-5 w-5 text-purple-600" />
            </div>
            <div className="flex items-center text-xs font-medium text-gray-600">
              <Minus className="h-3 w-3 mr-0.5" />
              0%
            </div>
          </div>
          <p className="text-sm font-medium text-gray-600 mb-1">Avg Response</p>
          <p className="text-3xl font-bold text-gray-900 tracking-tight">{summary.avg_approval_time_hours.toFixed(1)}h</p>
          <p className="text-xs text-gray-500 mt-2">Response time</p>
        </div>

        {/* Completed Card */}
        <div className="group relative bg-gradient-to-br from-amber-50 to-white border border-gray-200 rounded-xl p-6 shadow-sm hover:shadow-md transition-all duration-300 hover:-translate-y-0.5">
          <div className="flex items-start justify-between mb-3">
            <div className="p-2 bg-amber-100 rounded-lg">
              <TrendingUp className="h-5 w-5 text-amber-600" />
            </div>
            <div className="flex items-center text-xs font-medium text-green-600">
              <ArrowUpRight className="h-3 w-3 mr-0.5" />
              15%
            </div>
          </div>
          <p className="text-sm font-medium text-gray-600 mb-1">Completed</p>
          <p className="text-3xl font-bold text-gray-900 tracking-tight">{summary.total_completed}</p>
          <p className="text-xs text-gray-500 mt-2">{((summary.total_completed / summary.total_leads) * 100 || 0).toFixed(1)}% completion</p>
        </div>
      </div>

      {/* Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Lead Trends Chart */}
        <div className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm hover:shadow-md transition-shadow duration-300">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-50 rounded-lg">
                <TrendingUp className="h-5 w-5 text-blue-600" />
              </div>
              <div>
                <h3 className="text-base font-semibold text-gray-900">Lead Volume</h3>
                <p className="text-xs text-gray-500">Daily trend analysis</p>
              </div>
            </div>
          </div>
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
                <ResponsiveContainer width="100%" height={280}>
                  <AreaChart data={safeData}>
                    <defs>
                      <linearGradient id="colorLeads" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor={COLORS.primary} stopOpacity={0.3}/>
                        <stop offset="95%" stopColor={COLORS.primary} stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke={COLORS.gray[200]} vertical={false} />
                    <XAxis 
                      dataKey="date" 
                      tickFormatter={formatDate}
                      tick={{ fontSize: 12, fill: COLORS.gray[600] }}
                      stroke={COLORS.gray[300]}
                      tickLine={false}
                    />
                    <YAxis 
                      tick={{ fontSize: 12, fill: COLORS.gray[600] }}
                      stroke={COLORS.gray[300]}
                      tickLine={false}
                      axisLine={false}
                    />
                    <Tooltip 
                      contentStyle={{ 
                        fontSize: 13, 
                        backgroundColor: '#FFF', 
                        border: '1px solid #E5E7EB',
                        borderRadius: '8px',
                        boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)'
                      }}
                      labelFormatter={formatDate}
                    />
                    <Area 
                      type="monotone" 
                      dataKey="count" 
                      stroke={COLORS.primary} 
                      strokeWidth={2}
                      fill="url(#colorLeads)"
                      name="Leads"
                    />
                  </AreaChart>
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
        <div className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm hover:shadow-md transition-shadow duration-300">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-green-50 rounded-lg">
                <BarChart3 className="h-5 w-5 text-green-600" />
              </div>
              <div>
                <h3 className="text-base font-semibold text-gray-900">Conversion Rate</h3>
                <p className="text-xs text-gray-500">Weekly performance</p>
              </div>
            </div>
          </div>
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
                <ResponsiveContainer width="100%" height={280}>
                  <BarChart data={safeData}>
                    <CartesianGrid strokeDasharray="3 3" stroke={COLORS.gray[200]} vertical={false} />
                    <XAxis 
                      dataKey="week" 
                      tickFormatter={formatWeek}
                      tick={{ fontSize: 12, fill: COLORS.gray[600] }}
                      stroke={COLORS.gray[300]}
                      tickLine={false}
                    />
                    <YAxis 
                      tick={{ fontSize: 12, fill: COLORS.gray[600] }}
                      stroke={COLORS.gray[300]}
                      tickLine={false}
                      axisLine={false}
                    />
                    <Tooltip 
                      contentStyle={{ 
                        fontSize: 13, 
                        backgroundColor: '#FFF', 
                        border: '1px solid #E5E7EB',
                        borderRadius: '8px',
                        boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)'
                      }}
                      labelFormatter={formatWeek}
                      formatter={(value: number, name: string) => {
                        if (name === 'Approval Rate') return `${value.toFixed(1)}%`;
                        return value;
                      }}
                    />
                    <Bar 
                      dataKey="approval_rate" 
                      fill={COLORS.success} 
                      name="Approval Rate"
                      radius={[8, 8, 0, 0]}
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
