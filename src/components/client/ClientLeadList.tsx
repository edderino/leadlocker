'use client';

import { relativeTime } from '@/libs/time';
import { Phone, MapPin, Send } from 'lucide-react';
import { useState } from 'react';

interface Lead {
  id: string;
  name: string;
  phone: string;
  source: string;
  description: string | null;
  status: 'NEW' | 'APPROVED' | 'COMPLETED';
  created_at: string;
}

interface ClientLeadListProps {
  leads: Lead[];
}

const statusColors = {
  NEW: 'bg-red-100 text-red-700 border-red-200',
  APPROVED: 'bg-yellow-100 text-yellow-700 border-yellow-200',
  COMPLETED: 'bg-green-100 text-green-700 border-green-200',
};

const statusLabels = {
  NEW: 'Needs Attention',
  APPROVED: 'Approved',
  COMPLETED: 'Completed',
};

const getStatusBadge = (status: Lead['status']) => {
  return (
    <span className={`px-3 py-1 text-xs font-semibold rounded-full border ${statusColors[status]}`}>
      {statusLabels[status]}
    </span>
  );
};

export default function ClientLeadList({ leads }: ClientLeadListProps) {
  const [replyingTo, setReplyingTo] = useState<string | null>(null);
  const [replyMessages, setReplyMessages] = useState<Record<string, string>>({});
  const [sending, setSending] = useState<string | null>(null);

  const handleSendReply = async (lead: Lead) => {
    const message = replyMessages[lead.id]?.trim();
    if (!message) {
      alert('Type a message first');
      return;
    }

    setSending(lead.id);
    
    try {
      const res = await fetch('/api/client/messages/send', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-client-token': process.env.NEXT_PUBLIC_CLIENT_PORTAL_SECRET || '',
        },
        body: JSON.stringify({
          orgId: document.cookie
            .split('; ')
            .find((r) => r.startsWith('ll_client_org='))
            ?.split('=')[1],
          body: message,
        }),
      });
      
      const data = await res.json();
      
      if (data.ok) {
        setReplyMessages({ ...replyMessages, [lead.id]: '' });
        setReplyingTo(null);
        alert('Message sent ✅');
      } else {
        alert('Failed: ' + data.error);
      }
    } catch (err) {
      alert('Error sending message');
    } finally {
      setSending(null);
    }
  };

  if (leads.length === 0) {
    return (
      <div className="bg-gray-50 rounded-lg p-8 text-center">
        <p className="text-gray-500">No leads yet</p>
      </div>
    );
  }

  return (
    <div className="bg-white shadow-md rounded-lg border border-gray-200 overflow-hidden">
      {/* Desktop Table View */}
      <div className="hidden md:block overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Lead
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Contact
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Source
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Status
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Time
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Reply
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {leads.map((lead, index) => (
              <>
                <tr 
                  key={lead.id} 
                  className={`hover:bg-gray-50 transition-colors ${index % 2 === 0 ? 'bg-white' : 'bg-gray-50/30'}`}
                >
                  <td className="px-6 py-4">
                    <div>
                      <div className="text-sm font-semibold text-gray-900">{lead.name}</div>
                      {lead.description && (
                        <div className="text-sm text-gray-500 truncate max-w-xs mt-1">
                          {lead.description}
                        </div>
                      )}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <a
                      href={`tel:${lead.phone}`}
                      className="inline-flex items-center gap-1.5 text-sm text-blue-600 hover:text-blue-800 hover:underline"
                    >
                      <Phone className="h-3.5 w-3.5" />
                      {lead.phone}
                    </a>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="inline-flex items-center gap-1.5 text-sm text-gray-700">
                      <MapPin className="h-3.5 w-3.5 text-gray-400" />
                      {lead.source}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {getStatusBadge(lead.status)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {relativeTime(lead.created_at)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <button
                      onClick={() => setReplyingTo(replyingTo === lead.id ? null : lead.id)}
                      className="text-sm text-blue-600 hover:text-blue-800 font-medium"
                    >
                      {replyingTo === lead.id ? 'Cancel' : 'Reply'}
                    </button>
                  </td>
                </tr>
                
                {/* Reply Row */}
                {replyingTo === lead.id && (
                  <tr key={`${lead.id}-reply`}>
                    <td colSpan={6} className="px-6 py-3 bg-blue-50">
                      <div className="flex items-center gap-2">
                        <input
                          type="text"
                          placeholder={`Reply to ${lead.name}...`}
                          value={replyMessages[lead.id] || ''}
                          onChange={(e) => setReplyMessages({ ...replyMessages, [lead.id]: e.target.value })}
                          onKeyPress={(e) => {
                            if (e.key === 'Enter') {
                              handleSendReply(lead);
                            }
                          }}
                          className="flex-1 border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                          autoFocus
                        />
                        <button
                          onClick={() => handleSendReply(lead)}
                          disabled={sending === lead.id}
                          className="inline-flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-md text-sm hover:bg-blue-700 transition disabled:opacity-50"
                        >
                          <Send className="h-4 w-4" />
                          {sending === lead.id ? 'Sending...' : 'Send'}
                        </button>
                      </div>
                    </td>
                  </tr>
                )}
              </>
            ))}
          </tbody>
        </table>
      </div>

      {/* Mobile Stacked List View */}
      <div className="md:hidden divide-y divide-gray-200">
        {leads.map((lead, index) => (
          <div 
            key={lead.id} 
            className={`p-4 ${index % 2 === 0 ? 'bg-white' : 'bg-gray-50/30'}`}
          >
            <div className="flex justify-between items-start mb-3">
              <div className="font-semibold text-gray-900">{lead.name}</div>
              {getStatusBadge(lead.status)}
            </div>
            <div className="space-y-2 text-sm">
              <div className="flex items-center gap-1.5">
                <Phone className="h-3.5 w-3.5 text-gray-400" />
                <a
                  href={`tel:${lead.phone}`}
                  className="text-blue-600 hover:text-blue-800 hover:underline"
                >
                  {lead.phone}
                </a>
              </div>
              <div className="flex items-center gap-1.5 text-gray-600">
                <MapPin className="h-3.5 w-3.5 text-gray-400" />
                {lead.source}
              </div>
              {lead.description && (
                <div className="text-gray-500 mt-2 text-xs">
                  {lead.description}
                </div>
              )}
              <div className="text-gray-400 text-xs mt-2">
                {relativeTime(lead.created_at)}
              </div>
            </div>
            
            {/* Mobile Reply Button */}
            <div className="mt-3">
              <button
                onClick={() => setReplyingTo(replyingTo === lead.id ? null : lead.id)}
                className="text-sm text-blue-600 hover:text-blue-800 font-medium"
              >
                {replyingTo === lead.id ? 'Cancel' : 'Reply via SMS'}
              </button>
            </div>
            
            {/* Mobile Reply Input */}
            {replyingTo === lead.id && (
              <div className="mt-3 p-3 bg-blue-50 rounded-lg">
                <div className="flex flex-col gap-2">
                  <input
                    type="text"
                    placeholder={`Reply to ${lead.name}...`}
                    value={replyMessages[lead.id] || ''}
                    onChange={(e) => setReplyMessages({ ...replyMessages, [lead.id]: e.target.value })}
                    className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                  <button
                    onClick={() => handleSendReply(lead)}
                    disabled={sending === lead.id}
                    className="inline-flex items-center justify-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-md text-sm hover:bg-blue-700 transition disabled:opacity-50"
                  >
                    <Send className="h-4 w-4" />
                    {sending === lead.id ? 'Sending...' : 'Send SMS'}
                  </button>
                </div>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
