"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/libs/supabaseClient";
import Card from "@/components/ui/Card";
import { Button } from "@/components/ui/button";
import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  LineChart,
  Line,
  LabelList,
  Tooltip,
} from "recharts";

const COLORS = ["#60a5fa", "#a78bfa", "#fbbf24", "#34d399", "#f87171"];
const tooltipContentStyle = {
  background: "rgba(15, 23, 42, 0.92)",
  border: "1px solid rgba(148,163,184,0.35)",
  borderRadius: "8px",
  color: "#f8fafc",
  boxShadow: "0 8px 22px rgba(15,23,42,0.45)",
};
const tooltipLabelStyle = {
  color: "#e2e8f0",
  fontWeight: 600,
  fontSize: 13,
};
const tooltipItemStyle = {
  color: "#cbd5f5",
  fontSize: 12,
};

function AnalyticsSkeleton() {
  return (
    <div className="animate-pulse space-y-6 p-6">
      {[...Array(2)].map((_, i) => (
        <div
          key={i}
          className="h-64 bg-neutral-900/80 border border-neutral-800 rounded-md shadow-[0_0_15px_rgba(255,255,255,0.05)]"
        ></div>
      ))}
    </div>
  );
}

type LeadRow = {
  status: string;
  source: string;
};

interface AnalyticsProps {
  orgId: string;
}

export default function Analytics({ orgId }: AnalyticsProps) {
  const [leads, setLeads] = useState<LeadRow[]>([]);
  const [chartType, setChartType] = useState<"pie" | "bar" | "line">("bar");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const renderPieLabel = ({
    cx,
    cy,
    midAngle,
    innerRadius,
    outerRadius,
    value,
  }: any) => {
    const RADIAN = Math.PI / 180;
    const radius = innerRadius + (outerRadius - innerRadius) * 0.6;
    const x = cx + radius * Math.cos(-midAngle * RADIAN);
    const y = cy + radius * Math.sin(-midAngle * RADIAN);

    return (
      <text
        x={x}
        y={y}
        fill="#ffffff"
        textAnchor="middle"
        dominantBaseline="central"
        fontSize={12}
        fontWeight={600}
      >
        {value}
      </text>
    );
  };

  useEffect(() => {
    fetchLeads();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [orgId]);

  async function fetchLeads() {
    setLoading(true);
    setError(null);

    try {
      if (!orgId) {
        setError("Missing organization context.");
        setLeads([]);
        return;
      }

      const {
        data: { session },
        error: sessionError,
      } = await supabase.auth.getSession();

      if (sessionError || !session?.access_token) {
        setError("Authentication error. Please log in again.");
        setLeads([]);
        return;
      }

      const response = await fetch(`/api/analytics/leads?orgId=${orgId}`, {
        headers: {
          Authorization: `Bearer ${session.access_token}`,
        },
      });

      if (!response.ok) {
        const result = await response.json().catch(() => ({ error: "Failed to fetch analytics data" }));
        setError(result.error || "Failed to fetch analytics data");
        setLeads([]);
        return;
      }

      const result = await response.json();
      setLeads((result.leads as LeadRow[]) ?? []);
    } catch (err: any) {
      console.error("[Analytics] Error fetching analytics data:", err);
      setError(err?.message || "Failed to fetch analytics data");
      setLeads([]);
    } finally {
      setLoading(false);
    }
  }

  // Loading state
  if (loading) return <AnalyticsSkeleton />;

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center h-64 text-neutral-400">
        <p className="text-sm">Analytics unavailable.</p>
        <p className="text-xs text-neutral-500">{error}</p>
      </div>
    );
  }

  // Empty state check
  if (!leads.length) {
    return (
      <div className="flex flex-col items-center justify-center h-64 text-neutral-400">
        <p className="text-sm">Not enough data for analytics yet.</p>
        <p className="text-xs text-neutral-500">Charts will activate once new leads come in.</p>
      </div>
    );
  }

  const statusCounts = leads.reduce<Record<string, number>>((acc, lead) => {
    if (!lead.status) return acc;
    acc[lead.status] = (acc[lead.status] || 0) + 1;
    return acc;
  }, {});

  const allowedSources = [
    { key: "gmail", label: "Gmail" },
    { key: "facebook", label: "Facebook" },
    { key: "instagram", label: "Instagram" },
  ];
  const sourceCounts = leads.reduce<Record<string, number>>((acc, lead) => {
    const source = lead.source?.toLowerCase() || "";
    const matchedSource = allowedSources.find((option) =>
      source.includes(option.key)
    );

    if (matchedSource) {
      acc[matchedSource.key] = (acc[matchedSource.key] || 0) + 1;
    }
    return acc;
  }, {});

  const statusData = Object.entries(statusCounts).map(([status, count]) => ({
    name: status,
    value: count,
  }));

  const sourceData = allowedSources
    .filter((option) => sourceCounts[option.key])
    .map((option) => ({
      name: option.label,
      value: sourceCounts[option.key],
    }));

  return (
    <div className="p-6 space-y-6">
      <h2 className="text-xl font-semibold text-neutral-100">Analytics</h2>

      <div className="flex gap-2 mb-2">
        <Button
          variant={chartType === "bar" ? "default" : "secondary"}
          onClick={() => setChartType("bar")}
        >
          Bar
        </Button>
        <Button
          variant={chartType === "line" ? "default" : "secondary"}
          onClick={() => setChartType("line")}
        >
          Line
        </Button>
        <Button
          variant={chartType === "pie" ? "default" : "secondary"}
          onClick={() => setChartType("pie")}
        >
          Pie
        </Button>
      </div>

      {/* Leads by Status */}
      <Card className="p-6 bg-neutral-950 border border-neutral-800 shadow-none">
        <h3 className="text-sm font-semibold uppercase text-neutral-300 mb-3 tracking-wide">
          Leads by Status
        </h3>
        <div className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            {chartType === "pie" ? (
              <PieChart>
                <Pie
                  data={statusData}
                  dataKey="value"
                  nameKey="name"
                  outerRadius={100}
                  fill="#8884d8"
                  labelLine={false}
                  label={renderPieLabel}
                >
                  {statusData.map((_, i) => (
                    <Cell key={i} fill={COLORS[i % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip
                  cursor={{ fill: "rgba(255,255,255,0.04)" }}
                  contentStyle={tooltipContentStyle}
                  labelStyle={tooltipLabelStyle}
                  itemStyle={tooltipItemStyle}
                  formatter={(value: number, name: string) => [value, name]}
                />
              </PieChart>
            ) : chartType === "bar" ? (
              <BarChart data={statusData}>
                <XAxis dataKey="name" stroke="#999" tickLine={false} axisLine={false} />
                <YAxis stroke="#999" tickLine={false} axisLine={false} allowDecimals={false} />
                <Tooltip
                  cursor={{ fill: "rgba(96,165,250,0.12)" }}
                  contentStyle={tooltipContentStyle}
                  labelStyle={tooltipLabelStyle}
                  itemStyle={tooltipItemStyle}
                  formatter={(value: number, name: string) => [value, name]}
                />
                <Bar dataKey="value" fill="#60a5fa" radius={[6, 6, 0, 0]}>
                  <LabelList dataKey="value" position="top" fill="#dbeafe" fontSize={12} />
                </Bar>
              </BarChart>
            ) : (
              <LineChart data={statusData}>
                <XAxis dataKey="name" stroke="#999" tickLine={false} axisLine={false} />
                <YAxis stroke="#999" tickLine={false} axisLine={false} allowDecimals={false} />
                <Tooltip
                  cursor={{ stroke: "rgba(148, 163, 184, 0.35)", strokeWidth: 1 }}
                  contentStyle={tooltipContentStyle}
                  labelStyle={tooltipLabelStyle}
                  itemStyle={tooltipItemStyle}
                  formatter={(value: number, name: string) => [value, name]}
                />
                <Line
                  type="monotone"
                  dataKey="value"
                  stroke="#60a5fa"
                  strokeWidth={3}
                  dot={{ r: 4 }}
                  activeDot={{ r: 6 }}
                />
              </LineChart>
            )}
          </ResponsiveContainer>
        </div>
      </Card>

      {/* Leads by Source */}
      <Card className="p-6 bg-neutral-950 border border-neutral-800 shadow-none">
        <h3 className="text-sm font-semibold uppercase text-neutral-300 mb-3 tracking-wide">
          Leads by Source
        </h3>
        <div className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            {chartType === "pie" ? (
              <PieChart>
                <Pie
                  data={sourceData}
                  dataKey="value"
                  nameKey="name"
                  outerRadius={100}
                  fill="#8884d8"
                  labelLine={false}
                  label={renderPieLabel}
                >
                  {sourceData.map((_, i) => (
                    <Cell key={i} fill={COLORS[i % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip
                  cursor={{ fill: "rgba(255,255,255,0.04)" }}
                  contentStyle={tooltipContentStyle}
                  labelStyle={tooltipLabelStyle}
                  itemStyle={tooltipItemStyle}
                  formatter={(value: number, name: string) => [value, name]}
                />
              </PieChart>
            ) : chartType === "bar" ? (
              <BarChart data={sourceData}>
                <XAxis dataKey="name" stroke="#999" tickLine={false} axisLine={false} />
                <YAxis stroke="#999" tickLine={false} axisLine={false} allowDecimals={false} />
                <Tooltip
                  cursor={{ fill: "rgba(167,139,250,0.12)" }}
                  contentStyle={tooltipContentStyle}
                  labelStyle={tooltipLabelStyle}
                  itemStyle={tooltipItemStyle}
                  formatter={(value: number, name: string) => [value, name]}
                />
                <Bar dataKey="value" fill="#a78bfa" radius={[6, 6, 0, 0]}>
                  <LabelList dataKey="value" position="top" fill="#ede9fe" fontSize={12} />
                </Bar>
              </BarChart>
            ) : (
              <LineChart data={sourceData}>
                <XAxis dataKey="name" stroke="#999" tickLine={false} axisLine={false} />
                <YAxis stroke="#999" tickLine={false} axisLine={false} allowDecimals={false} />
                <Tooltip
                  cursor={{ stroke: "rgba(167, 139, 250, 0.35)", strokeWidth: 1 }}
                  contentStyle={tooltipContentStyle}
                  labelStyle={tooltipLabelStyle}
                  itemStyle={tooltipItemStyle}
                  formatter={(value: number, name: string) => [value, name]}
                />
                <Line
                  type="monotone"
                  dataKey="value"
                  stroke="#a78bfa"
                  strokeWidth={3}
                  dot={{ r: 4 }}
                  activeDot={{ r: 6 }}
                />
              </LineChart>
            )}
          </ResponsiveContainer>
        </div>
      </Card>
    </div>
  );
}

