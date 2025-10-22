'use client'

// ⚠️ absolutely no imports that trigger server rendering above here
import dynamic from 'next/dynamic'
import { useEffect, useState } from 'react'

// completely client-side dashboard
const DashboardClientRoot = dynamic(
  () => import('@/components/client/DashboardClientRoot'),
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

  // only run after client hydration
  useEffect(() => {
    if (!orgId) return
    const hasCookie = document.cookie.includes('ll_client_org=')
    if (!hasCookie) {
      document.cookie = `ll_client_org=${orgId}; path=/; SameSite=Lax`
      console.log('[ClientPage] cookie set for', orgId)
    }
    setReady(true)
  }, [orgId])

  if (!ready || !orgId) return <div className="p-4">Authorizing session…</div>

  return <DashboardClientRoot orgId={orgId} />
}
