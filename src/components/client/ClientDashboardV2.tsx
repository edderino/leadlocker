'use client'

import { useState } from 'react'
import { RefreshCw, Send, Clock, CheckCircle2, AlertTriangle, User } from 'lucide-react'
import { relativeTime } from '@/libs/time'

interface Lead {
  id: string
  name: string
  phone: string
  source: string
  description: string | null
  status: 'NEW' | 'APPROVED' | 'COMPLETED'
  created_at: string
}

interface Props {
  leads: Lead[]
  orgId: string
}

export default function ClientDashboardV2({ leads, orgId }: Props) {
  const [isRefreshing, setIsRefreshing] = useState(false)
  const [selectedLead, setSelectedLead] = useState<Lead | null>(null)
  const [replyMessage, setReplyMessage] = useState('')
  const [sending, setSending] = useState(false)

  const handleRefresh = () => {
    setIsRefreshing(true)
    window.location.reload()
  }

  const handleSendReply = async () => {
    if (!replyMessage.trim() || !selectedLead) {
      alert('Please type a message first')
      return
    }

    setSending(true)
    try {
      const res = await fetch('/api/client/messages/send', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-client-token': process.env.NEXT_PUBLIC_CLIENT_PORTAL_SECRET || '',
        },
        body: JSON.stringify({ orgId, body: replyMessage }),
      })
      
      const data = await res.json()
      if (data.ok) {
        setReplyMessage('')
        setSelectedLead(null)
        alert('Message sent ✅')
      } else {
        alert('Failed: ' + data.error)
      }
    } catch {
      alert('Error sending message')
    } finally {
      setSending(false)
    }
  }

  const stats = {
    total: leads.length,
    needs: leads.filter(l => l.status === 'NEW').length,
    approved: leads.filter(l => l.status === 'APPROVED').length,
    completed: leads.filter(l => l.status === 'COMPLETED').length,
  }

  return (
    <div className="min-h-screen bg-neutral-950 text-neutral-100">
      {/* Header */}
      <header className="flex justify-between items-center px-6 py-4 border-b border-neutral-800">
        <h1 className="text-lg font-semibold tracking-wide">LeadLocker</h1>
        <div className="flex items-center gap-3">
          <span className="text-sm text-neutral-400">{orgId}</span>
          <button
            onClick={handleRefresh}
            disabled={isRefreshing}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-neutral-800 hover:bg-neutral-700 transition text-sm"
          >
            <RefreshCw className={`h-4 w-4 ${isRefreshing ? 'animate-spin' : ''}`} />
            Refresh
          </button>
        </div>
      </header>

      {/* Quick Stats */}
      <section className="grid grid-cols-2 md:grid-cols-4 gap-4 p-6">
        <StatCard icon={<User className="h-4 w-4" />} label="Total Leads" value={stats.total} color="text-neutral-100" />
        <StatCard icon={<AlertTriangle className="h-4 w-4 text-red-400" />} label="Needs Attention" value={stats.needs} color="text-red-400" />
        <StatCard icon={<Clock className="h-4 w-4 text-yellow-400" />} label="Approved" value={stats.approved} color="text-yellow-400" />
        <StatCard icon={<CheckCircle2 className="h-4 w-4 text-green-400" />} label="Completed" value={stats.completed} color="text-green-400" />
      </section>

      {/* Lead Table */}
      <section className="p-6">
        {leads.length === 0 ? (
          <div className="text-center py-24 text-neutral-400">
            <p className="text-lg font-medium mb-1">No leads yet</p>
            <p className="text-sm text-neutral-500">New messages will appear here automatically.</p>
          </div>
        ) : (
          <div className="overflow-hidden rounded-lg border border-neutral-800 bg-neutral-900/40 backdrop-blur">
            <table className="w-full text-sm">
              <thead className="bg-neutral-900/70 border-b border-neutral-800">
                <tr className="text-left text-neutral-400">
                  <th className="py-3 px-4 font-medium">Lead</th>
                  <th className="py-3 px-4 font-medium">Message</th>
                  <th className="py-3 px-4 font-medium">Source</th>
                  <th className="py-3 px-4 font-medium">Status</th>
                  <th className="py-3 px-4 font-medium">Time</th>
                  <th className="py-3 px-4 font-medium text-right">Action</th>
                </tr>
              </thead>
              <tbody>
                {leads.map((lead, idx) => (
                  <tr
                    key={lead.id}
                    className={`border-b border-neutral-800/60 hover:bg-neutral-800/30 transition ${
                      idx % 2 === 0 ? 'bg-neutral-900/50' : ''
                    }`}
                  >
                    <td className="py-3 px-4 font-semibold text-neutral-100">{lead.name}</td>
                    <td className="py-3 px-4 text-neutral-300 truncate max-w-[250px]">{lead.description || '-'}</td>
                    <td className="py-3 px-4 text-neutral-400">{lead.source}</td>
                    <td className="py-3 px-4">
                      <StatusBadge status={lead.status} />
                    </td>
                    <td className="py-3 px-4 text-neutral-500">{relativeTime(lead.created_at)}</td>
                    <td className="py-3 px-4 text-right">
                      <button
                        onClick={() => setSelectedLead(lead)}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-md text-xs font-medium transition"
                      >
                        <Send className="h-3.5 w-3.5" /> Reply
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      {/* Reply Modal */}
      {selectedLead && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="bg-neutral-900 border border-neutral-800 rounded-xl w-full max-w-md p-6 shadow-lg">
            <h3 className="text-lg font-semibold mb-4">Reply to {selectedLead.name}</h3>
            <textarea
              value={replyMessage}
              onChange={(e) => setReplyMessage(e.target.value)}
              placeholder="Type your reply..."
              className="w-full h-28 rounded-md bg-neutral-800 text-neutral-100 border border-neutral-700 px-3 py-2 text-sm outline-none focus:ring-1 focus:ring-blue-500 resize-none"
              autoFocus
            />
            <div className="flex justify-end gap-2 mt-4">
              <button
                onClick={() => {
                  setSelectedLead(null)
                  setReplyMessage('')
                }}
                className="px-4 py-1.5 rounded-md bg-neutral-800 text-neutral-300 hover:bg-neutral-700 text-sm transition"
              >
                Cancel
              </button>
              <button
                onClick={handleSendReply}
                disabled={sending || !replyMessage.trim()}
                className="px-4 py-1.5 rounded-md bg-blue-600 hover:bg-blue-700 text-white text-sm transition disabled:opacity-50"
              >
                {sending ? 'Sending...' : 'Send'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

/* ----------------- Subcomponents ----------------- */

function StatCard({
  icon,
  label,
  value,
  color,
}: {
  icon: React.ReactNode
  label: string
  value: number
  color: string
}) {
  return (
    <div className="bg-neutral-900/60 rounded-xl p-4 border border-neutral-800 flex flex-col items-start justify-center gap-2">
      <div className={`flex items-center gap-2 ${color}`}>
        {icon}
        <span className="text-sm font-medium text-neutral-400">{label}</span>
      </div>
      <p className={`text-2xl font-semibold ${color}`}>{value}</p>
    </div>
  )
}

function StatusBadge({ status }: { status: Lead['status'] }) {
  const map = {
    NEW: 'bg-red-500/20 text-red-400 border border-red-500/30',
    APPROVED: 'bg-yellow-500/20 text-yellow-400 border border-yellow-500/30',
    COMPLETED: 'bg-green-500/20 text-green-400 border border-green-500/30',
  }
  const label = {
    NEW: 'Needs Attention',
    APPROVED: 'Approved',
    COMPLETED: 'Completed',
  }[status]
  return (
    <span className={`px-2 py-0.5 text-xs rounded-full font-medium ${map[status]}`}>
      {label}
    </span>
  )
}

