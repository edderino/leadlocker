"use client";

import { useEffect, useMemo, useState } from "react";
import toast from "react-hot-toast";
import Card from "@/components/ui/Card";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { ConfirmDialog } from "@/components/ui/Dialog";
import { List, Grid, ArrowDownUp, Filter } from "lucide-react";
import { useThemeStyles } from "./ThemeContext";
import { supabase } from "@/libs/supabaseClient";
import { useLeadsStore } from "@/store/useLeadsStore";

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

export default function Leads({ leads: _initialLeads, orgId }: LeadsProps) {
  const themeStyles = useThemeStyles();
  const leads = useLeadsStore((s) => s.leads);
  const setLeads = useLeadsStore((s) => s.setLeads);
  const [view, setView] = useState<"cards" | "table">("cards");
  const [sortOrder, setSortOrder] = useState<"desc" | "asc">("desc");
  const [sourceFilter, setSourceFilter] = useState<string>("all");
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [leadToDelete, setLeadToDelete] = useState<string | null>(null);

  // Auto-refresh is now handled by DashboardClientRoot, so we just read from the store
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

  // Manual fetch removed - DashboardClientRoot handles all fetching and updates the store

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

  const isLoading = useLeadsStore((s) => s.isLoading);
  const error = useLeadsStore((s) => s.error);

  const displayLeads = useMemo(() => {
    const filtered = leads.filter((lead) => {
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
  }, [leads, sortOrder, sourceFilter]);

  async function updateStatus(id: string, status: Lead["status"]) {
    try {
      const res = await fetch("/api/leads/status", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, status }),
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        console.error("[Leads] Failed to update status:", data.error);
        return;
      }
      setLeads(
        leads.map((lead) =>
          lead.id === id ? { ...lead, status } : lead
        )
      );
    } catch (err) {
      console.error("[Leads] Error updating status:", err);
    }
  }

  function handleDeleteClick(id: string) {
    setLeadToDelete(id);
    setDeleteConfirmOpen(true);
  }

  async function deleteLead() {
    if (!leadToDelete) return;
    
    try {
      const res = await fetch("/api/leads/delete", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ id: leadToDelete }),
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        console.error("[Leads] Failed to delete lead:", data.error);
        toast.error(data.error || "Failed to delete lead");
        return;
      }
      setLeads(leads.filter((lead) => lead.id !== leadToDelete));
      toast.success("Lead deleted successfully");
      setLeadToDelete(null);
    } catch (err: any) {
      console.error("[Leads] Error deleting lead:", err);
      toast.error(err?.message || "Failed to delete lead");
    }
  }

  if (isLoading && leads.length === 0) {
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
    <div className="p-0 md:p-2">
      <div className="flex flex-col gap-3 mb-4 sm:flex-row sm:items-center sm:justify-between">
        <h2 className="text-lg md:text-xl font-semibold text-white px-2 md:px-0">Leads</h2>
        <div className="flex flex-wrap items-center gap-2 px-2 md:px-0">
          <div className="flex items-center gap-2 bg-neutral-900/70 border border-neutral-800 rounded-lg px-2 md:px-3 py-2 md:py-1.5 text-sm text-neutral-300 min-h-[44px]">
            <Filter className="h-4 w-4 text-neutral-500 flex-shrink-0" />
            <select
              value={sourceFilter}
              onChange={(event) => setSourceFilter(event.target.value)}
              className="bg-transparent focus:outline-none text-sm text-neutral-200 flex-1 min-w-0"
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
            className="flex items-center gap-2 min-h-[44px] text-xs md:text-sm"
          >
            <ArrowDownUp className="h-4 w-4 flex-shrink-0" />
            <span className="hidden sm:inline">{sortOrder === "desc" ? "Newest → Oldest" : "Oldest → Newest"}</span>
            <span className="sm:hidden">{sortOrder === "desc" ? "New" : "Old"}</span>
          </Button>
          <Button
            variant={view === "cards" ? "default" : "secondary"}
            size="icon"
            onClick={() => setView("cards")}
            className="min-w-[44px] min-h-[44px]"
          >
            <Grid className="h-4 w-4" />
          </Button>
          <Button
            variant={view === "table" ? "default" : "secondary"}
            size="icon"
            onClick={() => setView("table")}
            className="min-w-[44px] min-h-[44px]"
          >
            <List className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {view === "cards" ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 md:gap-4 px-2 md:px-0">
          {displayLeads.map((lead) => (
            <Card
              key={lead.id}
              className={`p-4 md:p-5 bg-neutral-950 border border-neutral-800 transition-all duration-300 overflow-hidden ${themeStyles.cardBaseClass} ${themeStyles.cardHoverClass}`}
            >
              <div className="flex justify-between items-start mb-3 gap-3">
                <div className="flex-1 min-w-0 overflow-hidden">
                  <p className="text-white font-semibold text-base leading-tight truncate">{lead.name}</p>
                  <a
                    href={`tel:${lead.phone}`}
                    className={`text-neutral-400 text-sm transition-colors break-all ${themeStyles.linkHoverClass}`}
                  >
                    {lead.phone}
                  </a>
                  <p className="text-neutral-500 text-xs uppercase tracking-wide mt-1 truncate">
                    {formatSource(lead.source)}
                  </p>
                </div>
                <div className="flex flex-col items-end gap-2 flex-shrink-0">
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
              </div>
              <p className="text-sm text-neutral-300 mb-4 line-clamp-3">{lead.description || 'No description'}</p>
              <div className="flex flex-wrap gap-2 pt-3 border-t border-neutral-800">
                {lead.status !== "APPROVED" && lead.status !== "COMPLETED" && (
                  <Button
                    variant="outline"
                    size="sm"
                    className="border-yellow-600/50 text-yellow-400 hover:bg-yellow-600/10 flex-1 min-w-[80px] min-h-[44px] text-sm"
                    onClick={() => updateStatus(lead.id, "APPROVED")}
                  >
                    Approve
                  </Button>
                )}
                {lead.status !== "COMPLETED" && (
                  <Button
                    variant="outline"
                    size="sm"
                    className="border-green-600/50 text-green-400 hover:bg-green-600/10 flex-1 min-w-[80px] min-h-[44px] text-sm"
                    onClick={() => updateStatus(lead.id, "COMPLETED")}
                  >
                    Complete
                  </Button>
                )}
                <Button
                  variant="outline"
                  size="sm"
                  className="border-red-600/50 text-red-400 hover:bg-red-600/10 flex-1 min-w-[80px] min-h-[44px] text-sm"
                  onClick={() => handleDeleteClick(lead.id)}
                >
                  Delete
                </Button>
              </div>
              <p className="text-xs text-neutral-500 mt-4 flex items-center gap-2">
                <span className="text-neutral-300">{formatLeadDate(lead.created_at)}</span>
                <span className="text-neutral-600">{formatLeadTime(lead.created_at)}</span>
              </p>
            </Card>
          ))}
        </div>
      ) : (
        <Card className={`border border-neutral-800 bg-neutral-950 transition-all duration-300 ${themeStyles.cardBaseClass} ${themeStyles.cardHoverClass} overflow-x-auto`}>
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
                  <TableCell className="text-neutral-200 max-w-[150px] truncate">{lead.name}</TableCell>
                  <TableCell className="text-neutral-400">
                    <a
                      href={`tel:${lead.phone}`}
                      className={`transition-colors break-all ${themeStyles.linkHoverClass}`}
                    >
                      {lead.phone}
                    </a>
                  </TableCell>
                  <TableCell className="text-neutral-400 max-w-[100px] truncate">{formatSource(lead.source)}</TableCell>
                  <TableCell className="text-neutral-400 max-w-[200px]">
                    <p className="truncate" title={lead.description || undefined}>{lead.description || '-'}</p>
                  </TableCell>
                  <TableCell className="min-w-[180px] max-w-[250px]">
                    <div className="flex flex-col gap-2">
                      <span className={`text-xs px-2 py-1 rounded w-fit ${
                        lead.status === 'NEW' ? 'bg-red-500/20 text-red-400' :
                        lead.status === 'APPROVED' ? 'bg-yellow-500/20 text-yellow-400' :
                        'bg-green-500/20 text-green-400'
                      }`}>
                        {lead.status}
                      </span>
                      <div className="flex flex-wrap gap-1.5">
                        {lead.status !== "APPROVED" && lead.status !== "COMPLETED" && (
                          <Button
                            variant="outline"
                            size="sm"
                            className="border-yellow-600/50 text-yellow-400 hover:bg-yellow-600/10 text-xs px-2 py-1 h-auto whitespace-nowrap"
                            onClick={() => updateStatus(lead.id, "APPROVED")}
                          >
                            Approve
                          </Button>
                        )}
                        {lead.status !== "COMPLETED" && (
                          <Button
                            variant="outline"
                            size="sm"
                            className="border-green-600/50 text-green-400 hover:bg-green-600/10 text-xs px-2 py-1 h-auto whitespace-nowrap"
                            onClick={() => updateStatus(lead.id, "COMPLETED")}
                          >
                            Complete
                          </Button>
                        )}
                        <Button
                          variant="outline"
                          size="sm"
                          className="border-red-600/50 text-red-400 hover:bg-red-600/10 text-xs px-2 py-1 h-auto whitespace-nowrap"
                          onClick={() => handleDeleteClick(lead.id)}
                        >
                          Delete
                        </Button>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell className="text-neutral-400 text-right">
                    <div className="flex flex-col items-end leading-tight">
                      <span className="text-neutral-200 text-sm whitespace-nowrap">{formatLeadDate(lead.created_at)}</span>
                      <span className="text-neutral-500 text-xs whitespace-nowrap">{formatLeadTime(lead.created_at)}</span>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </Card>
      )}
      
      <ConfirmDialog
        open={deleteConfirmOpen}
        onClose={() => {
          setDeleteConfirmOpen(false);
          setLeadToDelete(null);
        }}
        onConfirm={deleteLead}
        title="Delete Lead"
        message="Are you sure you want to delete this lead? This action cannot be undone."
        confirmText="Delete"
        cancelText="Cancel"
        variant="destructive"
      />
    </div>
  );
}
