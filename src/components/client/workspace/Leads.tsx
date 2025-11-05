'use client';

import { Phone, Reply, MapPin } from 'lucide-react';
import type { Lead } from './WorkspaceLayout';

export default function Leads({ leads }: { leads: Lead[] }) {
  return (
    <div className="space-y-4">
      <div className="text-sm text-gray-400">{leads.length} total</div>
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {leads.map(l => (
          <article key={l.id} className="rounded-xl border border-white/10 bg-white/5 p-4 hover:bg-white/7 transition">
            <header className="flex items-center justify-between">
              <div className="font-semibold truncate">{l.name}</div>
              <StatusPill status={l.status} />
            </header>
            {l.description && <p className="mt-2 text-sm text-gray-300 line-clamp-2">{l.description}</p>}

            <div className="mt-3 flex items-center gap-3 text-sm text-gray-400">
              <MapPin className="h-4 w-4 text-gray-500" />
              <span className="uppercase tracking-widest text-[11px]">{l.source}</span>
            </div>

            <footer className="mt-4 flex items-center justify-between">
              <a
                href={`tel:${l.phone}`}
                className="inline-flex items-center gap-2 rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm hover:bg-white/10"
              >
                <Phone className="h-4 w-4" />
                {l.phone || 'No phone'}
              </a>
              <button
                className="inline-flex items-center gap-2 rounded-lg border border-violet-500/30 bg-violet-500/10 px-3 py-2 text-sm text-violet-200 hover:bg-violet-500/20"
                onClick={() => {
                  const msg = prompt(`Reply to ${l.name}:`);
                  if (!msg) return;
                  // hook up to /api/client/messages/send later (already scaffolded in your repo)
                  alert('Queued message: ' + msg);
                }}
              >
                <Reply className="h-4 w-4" />
                Reply
              </button>
            </footer>
          </article>
        ))}
        {leads.length === 0 && (
          <div className="rounded-xl border border-white/10 bg-white/5 p-6 text-gray-400">
            No leads yet. Once your Zap runs, they'll appear here.
          </div>
        )}
      </div>
    </div>
  );
}

function StatusPill({ status }: { status: Lead['status'] }) {
  const map = {
    NEW: 'bg-rose-500/15 text-rose-300 border-rose-400/20',
    APPROVED: 'bg-amber-500/15 text-amber-300 border-amber-400/20',
    COMPLETED: 'bg-emerald-500/15 text-emerald-300 border-emerald-400/20',
  } as const;
  return <span className={`text-xs px-2 py-1 rounded-full border ${map[status]}`}>{status === 'NEW' ? 'Needs Attention' : status}</span>;
}
