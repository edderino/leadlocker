'use client'

import { useEffect, useState } from 'react'
import dynamic from 'next/dynamic'

const DashboardClientRoot = dynamic(
  () => import('@/components/client/DashboardClientRoot'),
  { ssr: false, loading: () => <div>Loading dashboard…</div> }
)

export default function ClientPage(props: any) {
  const [orgId, setOrgId] = useState<string | null>(null)
  const [ready, setReady] = useState(false)

  // ✅ unwrap params safely (Next 15 changed this)
  useEffect(() => {
    ;(async () => {
      const p = await props.params
      setOrgId(p.orgId)
    })()
  }, [props.params])

  // ✅ ensure we only ever render on the client
  useEffect(() => {
    if (!orgId) return

    const existing = document.cookie.includes('ll_client_org=')
    if (!existing) {
      document.cookie = `ll_client_org=${orgId}; path=/; SameSite=Lax`
      console.log('[ClientPage] Cookie bootstrapped for org:', orgId)
    }

    setReady(true)
  }, [orgId])

  if (!ready || !orgId) return <div>Authorizing session…</div>

  return <DashboardClientRoot orgId={orgId} />
}
