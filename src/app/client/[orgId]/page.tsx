'use client'

import { useEffect, useState } from 'react'
import NotificationManager from '@/components/client/NotificationManager'
import AISuggestions from '@/components/client/AISuggestions'
import AdvancedAnalytics from '@/components/client/AdvancedAnalytics'
import ClientDashboard from '@/components/client/ClientDashboard'

interface Lead {
  id: string;
  name: string;
  phone: string;
  source: string;
  description: string | null;
  status: 'NEW' | 'APPROVED' | 'COMPLETED';
  created_at: string;
}

export default function ClientPage({ params }: any) {
  const [orgId, setOrgId] = useState<string | null>(null)
  const [ready, setReady] = useState(false)
  const [leads, setLeads] = useState<Lead[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // unwrap params safely (Next 15 changed this)
  useEffect(() => {
    ;(async () => {
      const p = await params
      setOrgId(p.orgId)
    })()
  }, [params])

  // Initialize with empty leads for new clients
  useEffect(() => {
    if (!orgId) return
    
    console.log('[ClientPage] Initializing dashboard for org:', orgId)
    setLeads([]) // Start with empty leads for new clients
    setLoading(false)
  }, [orgId])

  // ensure we only ever render on the client
  useEffect(() => {
    if (!orgId) return
    
    // Set cookie immediately
    document.cookie = `ll_client_org=${orgId}; path=/; SameSite=Lax`
    console.log('[ClientPage] cookie set for', orgId)
    
    // Small delay to ensure cookie is set before components render
    setTimeout(() => {
      setReady(true)
    }, 100)
  }, [orgId])

  if (!ready || !orgId) return <div className="p-4">Authorizing session…</div>

  if (loading) {
    return (
      <div className="bg-white border border-gray-200 rounded-lg p-8 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-3"></div>
          <p className="text-gray-600">Loading dashboard data...</p>
        </div>
      </div>
    )
  }

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
            <h3 className="text-sm font-medium text-red-800">Error loading dashboard</h3>
            <p className="text-sm text-red-600 mt-1">{error}</p>
            <button
              onClick={() => window.location.reload()}
              className="mt-3 text-sm text-red-700 hover:text-red-800 underline"
            >
              Reload page
            </button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <>
      {/* Push Notification Manager */}
      <div className="mb-6">
        <NotificationManager orgId={orgId} />
      </div>

      {/* AI Suggestions */}
      <div className="mb-6">
        <AISuggestions orgId={orgId} />
      </div>

      {/* Advanced Analytics Dashboard */}
      <div className="mb-6">
        <AdvancedAnalytics orgId={orgId} />
      </div>

      {/* Dashboard Content */}
      <ClientDashboard leads={leads} orgId={orgId} />
    </>
  )
}