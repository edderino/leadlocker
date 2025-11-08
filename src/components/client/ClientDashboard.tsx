'use client';

import Card from '@/components/ui/Card';
import StatusPill from '@/components/ui/StatusPill';
import { RefreshCw, Send, Phone, MessageSquare } from 'lucide-react';
import { supabase } from '@/libs/supabaseClient';

type Lead = {
  id: string;
  name: string;
  phone: string;
  source: string;
  description: string | null;
  status: 'NEW' | 'APPROVED' | 'COMPLETED';
  created_at: string;
};

export default function ClientDashboard({ leads, orgId }: { leads: Lead[]; orgId: string }) {
  const totals = {
    all: leads.length,
    new: leads.filter(l => l.status === 'NEW').length,
    approved: leads.filter(l => l.status === 'APPROVED').length,
    done: leads.filter(l => l.status === 'COMPLETED').length,
  };

  return (
    <div className="min-h-screen bg-ink-900 text-white">
      {/* Top bar */}
      <div className="sticky top-0 z-10 backdrop-blur bg-ink-900/75 border-b border-edge/60">
        <div className="mx-auto max-w-6xl px-4 h-14 flex items-center justify-between">
          <div className="font-semibold tracking-tight text-white/90">LeadLocker</div>
          <div className="flex items-center gap-3">
            <span className="text-xs text-soft/80 bg-edge/70 px-2 py-1 rounded">org: {orgId}</span>
            <button
              onClick={() => location.reload()}
              className="inline-flex items-center gap-2 rounded-lg px-3 py-1.5 bg-edge/80 hover:bg-edge transition border border-white/5"
              aria-label="Refresh"
            >
              <RefreshCw className="h-4 w-4" />
              <span className="text-sm">Refresh</span>
            </button>
          </div>
        </div>
      </div>
      {/* Content */}
      <div className="mx-auto max-w-6xl px-4 py-6 space-y-6">
        {/* KPIs */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <Card className="p-4">
            <div className="text-soft text-xs uppercase">Total Leads</div>
            <div className="mt-2 text-3xl font-bold tracking-tight">{totals.all}</div>
            <div className="mt-2 h-1 rounded bg-edge/70">
              <div className="h-1 rounded bg-acc-violet" style={{ width: `${(totals.all ? 100 : 0)}%` }} />
            </div>
          </Card>
          <Card className="p-4">
            <div className="text-soft text-xs uppercase">Needs Attention</div>
            <div className="mt-2 text-3xl font-bold tracking-tight text-acc-red">{totals.new}</div>
            <div className="mt-2 h-1 rounded bg-edge/70">
              <div className="h-1 rounded bg-acc-red" style={{ width: `${totals.all ? (totals.new / totals.all) * 100 : 0}%` }} />
            </div>
          </Card>
          <Card className="p-4">
            <div className="text-soft text-xs uppercase">Completed</div>
            <div className="mt-2 text-3xl font-bold tracking-tight text-acc-green">{totals.done}</div>
            <div className="mt-2 h-1 rounded bg-edge/70">
              <div className="h-1 rounded bg-acc-green" style={{ width: `${totals.all ? (totals.done / totals.all) * 100 : 0}%` }} />
            </div>
          </Card>
        </div>
        {/* Leads table */}
        <Card className="overflow-hidden">
          <div className="border-b border-edge/60 px-4 py-3 flex items-center justify-between">
            <div className="text-sm text-soft">Leads</div>
            <div className="text-xs text-soft/70">{leads.length} items</div>
          </div>
          {leads.length === 0 ? (
            <div className="px-6 py-14 text-center">
              <div className="mx-auto mb-3 h-12 w-12 rounded-full bg-edge/70 flex items-center justify-center">
                <MessageSquare className="h-6 w-6 text-soft" />
              </div>
              <div className="text-white/90 font-medium">No leads yet</div>
              <div className="text-soft/80 text-sm mt-1">New enquiries will land here the second they come in.</div>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full text-sm">
                <thead className="bg-ink-800/70 border-b border-edge/60">
                  <tr className="text-soft/80">
                    <th className="px-4 py-3 text-left font-medium">Lead</th>
                    <th className="px-4 py-3 text-left font-medium">Message</th>
                    <th className="px-4 py-3 text-left font-medium">Source</th>
                    <th className="px-4 py-3 text-left font-medium">Status</th>
                    <th className="px-4 py-3 text-left font-medium">Phone</th>
                    <th className="px-4 py-3"></th>
                  </tr>
                </thead>
                <tbody>
                  {leads.map((l, i) => (
                    <tr
                      key={l.id}
                      className={`border-b border-edge/50 ${i % 2 ? 'bg-ink-800/40' : 'bg-ink-800/20'}`}
                    >
                      <td className="px-4 py-3 font-medium text-white/90">{l.name}</td>
                      <td className="px-4 py-3 text-white/70 max-w-[420px] truncate">{l.description ?? '-'}</td>
                      <td className="px-4 py-3 text-soft">{l.source}</td>
                      <td className="px-4 py-3"><StatusPill v={l.status} /></td>
                      <td className="px-4 py-3">
                        <a href={`tel:${l.phone}`} className="inline-flex items-center gap-1 text-acc-blue hover:opacity-80">
                          <Phone className="h-4 w-4" /> {l.phone}
                        </a>
                      </td>
                      <td className="px-4 py-3">
                        <button
                          className="inline-flex items-center gap-2 rounded-lg px-3 py-1.5 bg-acc-violet/15 text-acc-violet border border-white/5 hover:bg-acc-violet/20"
                          onClick={async () => {
                            const msg = prompt('Reply message');
                            if (!msg) return;

                            const {
                              data: { session },
                              error: sessionError,
                            } = await supabase.auth.getSession();

                            if (sessionError || !session?.access_token) {
                              alert('Session expired. Please log in again.');
                              return;
                            }

                            const response = await fetch('/api/client/messages/send', {
                              method: 'POST',
                              headers: {
                                'Content-Type': 'application/json',
                                Authorization: `Bearer ${session.access_token}`,
                              },
                              body: JSON.stringify({ orgId, body: msg }),
                            });

                            if (!response.ok) {
                              const { error } = await response.json().catch(() => ({ error: 'Failed to send message' }));
                              alert(error || 'Failed to send message');
                            }
                          }}
                        >
                          <Send className="h-4 w-4" /> Reply
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </Card>
      </div>
    </div>
  );
}
