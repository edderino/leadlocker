'use client';

import { Phone, Mail, Send } from 'lucide-react';
import { useState } from 'react';

type Lead = {
  id: string;
  name: string;
  phone: string;
  source: string;
  description: string | null;
  status: 'NEW' | 'APPROVED' | 'COMPLETED';
  created_at: string;
};

interface LeadsProps {
  leads: Lead[];
  orgId: string;
}

export default function Leads({ leads, orgId }: LeadsProps) {
  const [filter, setFilter] = useState<'all' | 'NEW' | 'APPROVED' | 'COMPLETED'>('all');

  const filtered = filter === 'all' ? leads : leads.filter(l => l.status === filter);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'NEW': return 'bg-orange-500/10 text-orange-400 border-orange-500/20';
      case 'APPROVED': return 'bg-yellow-500/10 text-yellow-400 border-yellow-500/20';
      case 'COMPLETED': return 'bg-green-500/10 text-green-400 border-green-500/20';
      default: return 'bg-gray-500/10 text-gray-400 border-gray-500/20';
    }
  };

  const handleReply = async (lead: Lead) => {
    const message = prompt(`Reply to ${lead.name}:`);
    if (!message) return;

    try {
      const res = await fetch('/api/client/messages/send', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-client-token': process.env.NEXT_PUBLIC_CLIENT_PORTAL_SECRET || '',
        },
        body: JSON.stringify({ orgId, body: message }),
      });

      const data = await res.json();
      if (data.ok) {
        alert('Message sent ✅');
      } else {
        alert('Failed to send: ' + data.error);
      }
    } catch (err) {
      alert('Error sending message');
    }
  };

  return (
    <div className="space-y-6">
      {/* Filter Bar */}
      <div className="flex items-center gap-2">
        {(['all', 'NEW', 'APPROVED', 'COMPLETED'] as const).map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition ${
              filter === f
                ? 'bg-white/10 text-white'
                : 'bg-white/5 text-gray-400 hover:bg-white/10'
            }`}
          >
            {f === 'all' ? 'All' : f === 'NEW' ? 'New' : f === 'APPROVED' ? 'Active' : 'Done'}
          </button>
        ))}
        <div className="ml-auto text-sm text-gray-400">
          {filtered.length} lead{filtered.length !== 1 ? 's' : ''}
        </div>
      </div>

      {/* Leads Grid */}
      {filtered.length === 0 ? (
        <div className="rounded-xl bg-white/5 backdrop-blur-md border border-white/10 p-12 text-center">
          <p className="text-gray-400">No leads match your filter.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map((lead) => (
            <div
              key={lead.id}
              className="rounded-xl bg-white/5 backdrop-blur-md border border-white/10 p-5 hover:bg-white/10 transition group"
            >
              {/* Header */}
              <div className="flex items-start justify-between mb-4">
                <div>
                  <h3 className="text-white font-semibold text-lg">{lead.name}</h3>
                  <p className="text-gray-400 text-xs mt-1">
                    {new Date(lead.created_at).toLocaleDateString()}
                  </p>
                </div>
                <span className={`px-2.5 py-1 text-xs font-semibold rounded-full border ${getStatusColor(lead.status)}`}>
                  {lead.status === 'NEW' ? 'New' : lead.status === 'APPROVED' ? 'Active' : 'Done'}
                </span>
              </div>

              {/* Details */}
              <div className="space-y-2 mb-4">
                <div className="flex items-center gap-2 text-sm">
                  <Phone className="h-4 w-4 text-gray-400" />
                  <a href={`tel:${lead.phone}`} className="text-blue-400 hover:underline">
                    {lead.phone}
                  </a>
                </div>
                <div className="flex items-center gap-2 text-sm text-gray-400">
                  <Mail className="h-4 w-4" />
                  <span>{lead.source}</span>
                </div>
                {lead.description && (
                  <p className="text-gray-400 text-sm mt-3 line-clamp-2">{lead.description}</p>
                )}
              </div>

              {/* Actions */}
              <button
                onClick={() => handleReply(lead)}
                className="w-full flex items-center justify-center gap-2 px-4 py-2 rounded-lg bg-gradient-to-r from-[#8b5cf6] to-[#6d28d9] hover:opacity-90 transition text-white text-sm font-medium"
              >
                <Send className="h-4 w-4" />
                Reply via SMS
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

