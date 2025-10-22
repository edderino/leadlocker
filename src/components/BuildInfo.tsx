'use client'

import { useEffect, useState } from 'react'

export default function BuildInfo() {
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  if (!mounted) {
    return null
  }

  return (
    <footer className="text-xs text-gray-400 text-center py-2">
      Env: {process.env.NEXT_PUBLIC_APP_ENV} · Build: {process.env.NEXT_PUBLIC_BUILD_ID}
    </footer>
  )
}
