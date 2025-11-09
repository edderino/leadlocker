"use client";

import { useEffect, useMemo, useState } from "react";
import Card from "@/components/ui/Card";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { List, Grid, ArrowDownUp, Filter } from "lucide-react";
import { useThemeStyles } from "./ThemeContext";
import { supabase } from "@/libs/supabaseClient";

const RECOGNIZED_SOURCES = [
  { key: "gmail", label: "Gmail" },
  { key: "facebook", label: "Facebook" },
  { key: "instagram", label: "Instagram" },
] as const;

const UNCATEGORISED_KEY = "uncategorized";
const UNCATEGORISED_LABEL = "Uncategorised";

const recognizedLabels = RECOGNIZED_SOURCES.reduce<Record<string, string>>((acc, item) => {
  acc[item.key] = item.label;
  return acc;
}, { [UNCATEGORISED_KEY]: UNCATEGORISED_LABEL });

const normalizeSource = (source: string | null | undefined) =>
  (source || "").toLowerCase().replace(/[^a-z0-9]+/g, "");

const getSourceKey = (source: string | null | undefined) => {
  const normalized = normalizeSource(source);
  if (!normalized) return UNCATEGORISED_KEY;
  const recognized = RECOGNIZED_SOURCES.find(({ key }) => normalized.includes(key));
  if (recognized) return recognized.key;
  return UNCATEGORISED_KEY;
};

const getSourceLabel = (key: string) => {
  return recognizedLabels[key] ?? UNCATEGORISED_LABEL;
};

interface Lead {
  id: string;
  name: string;
  phone: string;
  source: string;
  description: string | null;
  status: 'NEW' | 'APPROVED' | 'COMPLETED';
  created_at: string;
}

interface LeadsProps {
  leads?: Lead[];
  orgId?: string;
}

export default function Leads({ leads: initialLeads = [], orgId }: LeadsProps) {
  const themeStyles = useThemeStyles();
  const [view, setView] = useState<"cards" | "table">("cards");
  const [sortOrder, setSortOrder] = useState<"desc" | "asc">("desc");
  const [sourceFilter, setSourceFilter] = useState<string>("all");
  const [leads, setLeads] = useState<Lead[]>(initialLeads);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const dateFormatter = useMemo(
    () =>
      new Intl.DateTimeFormat("en-US", {
        month: "short",
        day: "numeric",
        year: "numeric",
      }),
    []
  );
  const timeFormatter = useMemo(
    () =>
      new Intl.DateTimeFormat("en-US", {
        hour: "numeric",
        minute: "2-digit",
      }),
    []
  );
  const sourceOptions = useMemo(
    () => [
      { key: "all", label: "All Sources" },
      ...RECOGNIZED_SOURCES.map(({ key, label }) => ({ key, label })),
    ],
    []
  );

  useEffect(() => {
    if (!orgId) return;

    let mounted = true;

    async function fetchLeads() {
      setLoading(true);
      setError(null);

      try {
        const {
          data: { session },
          error: sessionError,
        } = await supabase.auth.getSession();

        if (sessionError || !session?.access_token) {
          if (mounted) setError("Unauthenticated. Please log in again.");
          return;
        }

        const response = await fetch(`/api/client/leads?orgId=${orgId}`, {
          headers: {
            Authorization: `Bearer ${session.access_token}`,
          },
          cache: "no-store",
        });

        if (!response.ok) {
          const json = await response.json().catch(() => ({ error: "Failed to load leads" }));
          if (mounted) setError(json.error || "Failed to load leads");
          return;
        }

        const json = await response.json();
        if (mounted) {
          setLeads(json.leads || []);
        }
      } catch (err: any) {
        if (mounted) setError(err?.message || "Failed to load leads");
      } finally {
        if (mounted) setLoading(false);
      }
    }

    fetchLeads();

    return () => {
      mounted = false;
    };
  }, [initialLeads, orgId]);

  useEffect(() => {
    if (
      sourceFilter !== "all" &&
      !sourceOptions.some((option) => option.key === sourceFilter)
    ) {
      setSourceFilter("all");
    }
  }, [sourceFilter, sourceOptions]);
  const formatLeadDate = (isoString: string) => {
    try {
      return dateFormatter.format(new Date(isoString));
    } catch {
      return isoString;
    }
  };
  const formatLeadTime = (isoString: string) => {
    try {
      return timeFormatter.format(new Date(isoString));
    } catch {
      return "";
    }
  };
  const formatSource = (source: string) => getSourceLabel(getSourceKey(source));

  const displayLeads = useMemo(() => {
    const list = leads.length > 0 ? leads : initialLeads;
    const filtered = list.filter((lead) => {
      if (sourceFilter === "all") return true;
      return getSourceKey(lead.source) === sourceFilter;
    });

    return filtered
      .slice()
      .sort((a, b) => {
        const dateA = new Date(a.created_at).getTime();
        const dateB = new Date(b.created_at).getTime();
        return sortOrder === "desc" ? dateB - dateA : dateA - dateB;
      });
  }, [initialLeads, leads, sortOrder, sourceFilter]);

  if (loading && leads.length === 0 && initialLeads.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-64 text-neutral-400">
        <p className="text-sm">Loading leads…</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center h-64 text-neutral-400">
        <p className="text-sm">{error}</p>
      </div>
    );
  }

  // Empty state
  if (displayLeads.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-64 text-neutral-400">
        <p className="text-sm">No leads yet.</p>
        <p className="text-xs text-neutral-500">New inquiries will appear here automatically.</p>
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="flex flex-col gap-3 mb-4 sm:flex-row sm:items-center sm:justify-between">
        <h2 className="text-xl font-semibold text-white">Leads</h2>
        <div className="flex flex-wrap items-center gap-2">
          <div className="flex items-center gap-2 bg-neutral-900/70 border border-neutral-800 rounded-lg px-3 py-1.5 text-sm text-neutral-300">
            <Filter className="h-4 w-4 text-neutral-500" />
            <select
              value={sourceFilter}
              onChange={(event) => setSourceFilter(event.target.value)}
              className="bg-transparent focus:outline-none text-sm text-neutral-200"
            >
              {sourceOptions.map((option) => (
                <option key={option.key} value={option.key}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>
          <Button
            variant="secondary"
            onClick={() => setSortOrder((prev) => (prev === "desc" ? "asc" : "desc"))}
            className="flex items-center gap-2"
          >
            <ArrowDownUp className="h-4 w-4" />
            {sortOrder === "desc" ? "Newest → Oldest" : "Oldest → Newest"}
          </Button>
          <Button
            variant={view === "cards" ? "default" : "secondary"}
            size="icon"
            onClick={() => setView("cards")}
          >
            <Grid className="h-4 w-4" />
          </Button>
          <Button
            variant={view === "table" ? "default" : "secondary"}
            size="icon"
            onClick={() => setView("table")}
          >
            <List className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {view === "cards" ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {displayLeads.map((lead) => (
            <Card
              key={lead.id}
              className={`p-5 bg-neutral-950 border border-neutral-800 transition-all duration-300 ${themeStyles.cardBaseClass} ${themeStyles.cardHoverClass}`}
            >
              <div className="flex justify-between items-start mb-2">
                <div>
                  <p className="text-white font-semibold text-base leading-tight">{lead.name}</p>
                  <a
                    href={`tel:${lead.phone}`}
                    className={`text-neutral-400 text-sm transition-colors ${themeStyles.linkHoverClass}`}
                  >
                    {lead.phone}
                  </a>
                  <p className="text-neutral-500 text-xs uppercase tracking-wide">
                    {formatSource(lead.source)}
                  </p>
                </div>
                <span
                  className={`px-2 py-1 text-xs font-semibold rounded ${
                    lead.status === "NEW"
                      ? "bg-red-600/20 text-red-400"
                      : lead.status === "COMPLETED"
                      ? "bg-green-600/20 text-green-400"
                      : "bg-yellow-600/20 text-yellow-400"
                  }`}
                >
                  {lead.status}
                </span>
              </div>
              <p className="text-sm text-neutral-300 mt-3 line-clamp-3">{lead.description || 'No description'}</p>
              <p className="text-xs text-neutral-500 mt-4 flex items-center gap-2">
                <span className="text-neutral-300">{formatLeadDate(lead.created_at)}</span>
                <span className="text-neutral-600">{formatLeadTime(lead.created_at)}</span>
              </p>
            </Card>
          ))}
        </div>
      ) : (
        <Card className={`border border-neutral-800 bg-neutral-950 transition-all duration-300 ${themeStyles.cardBaseClass} ${themeStyles.cardHoverClass}`}>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="text-neutral-300">Name</TableHead>
                <TableHead className="text-neutral-300">Phone</TableHead>
                <TableHead className="text-neutral-300">Source</TableHead>
                <TableHead className="text-neutral-300">Message</TableHead>
                <TableHead className="text-neutral-300">Status</TableHead>
                <TableHead className="text-neutral-300 text-right">Received</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {displayLeads.map((lead) => (
                <TableRow key={lead.id} className="border-neutral-800/60">
                  <TableCell className="text-neutral-200">{lead.name}</TableCell>
                  <TableCell className="text-neutral-400">
                    <a
                      href={`tel:${lead.phone}`}
                      className={`transition-colors ${themeStyles.linkHoverClass}`}
                    >
                      {lead.phone}
                    </a>
                  </TableCell>
                  <TableCell className="text-neutral-400">{formatSource(lead.source)}</TableCell>
                  <TableCell className="text-neutral-400">{lead.description || '-'}</TableCell>
                  <TableCell>
                    <span className={`text-xs px-2 py-1 rounded ${
                      lead.status === 'NEW' ? 'bg-red-500/20 text-red-400' :
                      lead.status === 'APPROVED' ? 'bg-yellow-500/20 text-yellow-400' :
                      'bg-green-500/20 text-green-400'
                    }`}>
                      {lead.status}
                    </span>
                  </TableCell>
                  <TableCell className="text-neutral-400 text-right whitespace-nowrap">
                    <div className="flex flex-col items-end leading-tight">
                      <span className="text-neutral-200 text-sm">{formatLeadDate(lead.created_at)}</span>
                      <span className="text-neutral-500 text-xs">{formatLeadTime(lead.created_at)}</span>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </Card>
      )}
    </div>
  );
}
