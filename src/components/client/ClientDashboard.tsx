'use client';

import { useState } from 'react';
import { X } from 'lucide-react';
import { relativeTime } from '@/libs/time';

interface Lead {
  id: string;
  name: string;
  phone: string;
  source: string;
  description: string | null;
  status: 'NEW' | 'APPROVED' | 'COMPLETED';
  created_at: string;
}

interface Props {
  leads: Lead[];
  orgId: string;
}

export default function ClientDashboard({ leads, orgId }: Props) {
  const [selectedLead, setSelectedLead] = useState<Lead | null>(null);
  const [replyMessage, setReplyMessage] = useState('');
  const [sending, setSending] = useState(false);

  const handleSend = async () => {
    if (!replyMessage.trim() || !selectedLead) return;
    
    setSending(true);
    try {
      const res = await fetch('/api/client/messages/send', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-client-token': process.env.NEXT_PUBLIC_CLIENT_PORTAL_SECRET || '',
        },
        body: JSON.stringify({ orgId, body: replyMessage }),
      });
      
      const data = await res.json();
      if (data.ok) {
        setReplyMessage('');
        setSelectedLead(null);
        alert('Message sent ✅');
      } else {
        alert('Failed: ' + data.error);
      }
    } catch {
      alert('Error sending message');
    } finally {
      setSending(false);
    }
  };

  const stats = {
    new: leads.filter(l => l.status === 'NEW').length,
    approved: leads.filter(l => l.status === 'APPROVED').length,
    done: leads.filter(l => l.status === 'COMPLETED').length,
  };

  return (
    <div className="max-w-6xl mx-auto p-6">
      {/* Stats */}
      <div className="grid grid-cols-3 gap-4 mb-8">
        <div className="text-center p-4 bg-white rounded-lg border">
          <div className="text-3xl font-bold">{stats.new}</div>
          <div className="text-sm text-gray-500 mt-1">New</div>
        </div>
        <div className="text-center p-4 bg-white rounded-lg border">
          <div className="text-3xl font-bold">{stats.approved}</div>
          <div className="text-sm text-gray-500 mt-1">Active</div>
        </div>
        <div className="text-center p-4 bg-white rounded-lg border">
          <div className="text-3xl font-bold">{stats.done}</div>
          <div className="text-sm text-gray-500 mt-1">Done</div>
        </div>
      </div>

      {/* Leads */}
      {leads.length === 0 ? (
        <div className="text-center py-20 text-gray-400">
          <p>No leads yet</p>
        </div>
      ) : (
        <div className="space-y-3">
          {leads.map((lead) => (
            <div key={lead.id} className="bg-white border rounded-lg p-4 hover:shadow-sm transition">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <h3 className="font-semibold text-lg">{lead.name}</h3>
                    <span className={`text-xs px-2 py-1 rounded ${
                      lead.status === 'NEW' ? 'bg-blue-100 text-blue-700' :
                      lead.status === 'APPROVED' ? 'bg-yellow-100 text-yellow-700' :
                      'bg-green-100 text-green-700'
                    }`}>
                      {lead.status === 'NEW' ? 'New' : lead.status === 'APPROVED' ? 'Active' : 'Done'}
                    </span>
                  </div>
                  <div className="text-sm text-gray-600 space-y-1">
                    <div>{lead.phone}</div>
                    {lead.description && <div className="text-gray-500">{lead.description}</div>}
                    <div className="text-xs text-gray-400">{lead.source} · {relativeTime(lead.created_at)}</div>
                  </div>
                </div>
                <button
                  onClick={() => setSelectedLead(lead)}
                  className="ml-4 px-4 py-2 bg-black text-white text-sm rounded hover:bg-gray-800 transition"
                >
                  Reply
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Reply Modal */}
      {selectedLead && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-md w-full p-6 relative">
            <button
              onClick={() => { setSelectedLead(null); setReplyMessage(''); }}
              className="absolute top-4 right-4 text-gray-400 hover:text-gray-600"
            >
              <X className="h-5 w-5" />
            </button>
            
            <h3 className="text-lg font-semibold mb-4">Reply to {selectedLead.name}</h3>
            
            <textarea
              value={replyMessage}
              onChange={(e) => setReplyMessage(e.target.value)}
              placeholder="Type your message..."
              className="w-full h-32 p-3 border rounded-lg text-sm resize-none focus:outline-none focus:ring-2 focus:ring-black mb-4"
              autoFocus
            />
            
            <div className="flex justify-end gap-2">
              <button
                onClick={() => { setSelectedLead(null); setReplyMessage(''); }}
                className="px-4 py-2 text-sm text-gray-600 hover:text-gray-800"
              >
                Cancel
              </button>
              <button
                onClick={handleSend}
                disabled={sending || !replyMessage.trim()}
                className="px-4 py-2 bg-black text-white text-sm rounded hover:bg-gray-800 transition disabled:opacity-50"
              >
                {sending ? 'Sending...' : 'Send'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
