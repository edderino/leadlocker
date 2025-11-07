'use client'

// ⚠️ absolutely no imports that trigger server rendering above here
import dynamic from 'next/dynamic'
import { useEffect, useState } from 'react'
import { supabase } from '@/libs/supabaseClient'
import { useRouter } from 'next/navigation'

// completely client-side dashboard
const DashboardClientWrapper = dynamic(
  () => import('@/components/client/DashboardClientWrapper'),
  { ssr: false }
)

export default function ClientPage({ params }: any) {
  const router = useRouter()
  const [orgId, setOrgId] = useState<string | null>(null)
  const [ready, setReady] = useState(false)
  const [isAuthed, setIsAuthed] = useState(false)

  // Check auth on mount
  useEffect(() => {
    const checkAuth = async () => {
      const { data: { session } } = await supabase.auth.getSession()
      
      if (!session) {
        console.log('[ClientPage] No session, redirecting to login')
        router.push('/login?redirectedFrom=' + window.location.pathname)
        return
      }
      
      console.log('[ClientPage] Session found:', session.user.email)
      setIsAuthed(true)
    }
    
    checkAuth()
  }, [router])

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

  if (!isAuthed) return <div className="p-4">Checking authentication…</div>
  if (!ready || !orgId) return <div className="p-4">Loading…</div>

  return (
    <div className="bg-ink-900 min-h-screen">
      <DashboardClientWrapper orgId={orgId} />
    </div>
  )
}
