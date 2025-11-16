'use client'

// ⚠️ absolutely no imports that trigger server rendering above here
import dynamic from 'next/dynamic'
import { useEffect, useState } from 'react'
import ClientGuard from '@/components/auth/ClientGuard'

// completely client-side dashboard
const DashboardClientWrapper = dynamic(
  () => import('@/components/client/DashboardClientWrapper'),
  { ssr: false }
)

export default function ClientPage({ params }: any) {
  const [orgId, setOrgId] = useState<string | null>(null)
  const [ready, setReady] = useState(false)

  // unwrap params safely for Next 15
  useEffect(() => {
    ;(async () => {
      const p = await params
      setOrgId(p.orgId)
    })()
  }, [params])

  // set cookie BEFORE rendering components
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

  if (!ready || !orgId) return <div className="p-4">Loading…</div>

  return (
    <ClientGuard orgId={orgId}>
      <div className="bg-ink-900 min-h-screen">
        <DashboardClientWrapper orgId={orgId} />
      </div>
    </ClientGuard>
  )
}
