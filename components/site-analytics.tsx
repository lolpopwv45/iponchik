'use client'

import { Analytics } from '@vercel/analytics/next'
import { SpeedInsights } from '@vercel/speed-insights/next'
import { useEffect, useState } from 'react'
import { COOKIE_CONSENT_EVENT, readCookieConsent } from '@/lib/cookie-consent'

export function SiteAnalytics() {
  const [allowed, setAllowed] = useState(false)

  useEffect(() => {
    function sync() {
      setAllowed(readCookieConsent() === 'all')
    }

    sync()
    window.addEventListener(COOKIE_CONSENT_EVENT, sync)
    return () => window.removeEventListener(COOKIE_CONSENT_EVENT, sync)
  }, [])

  if (process.env.NODE_ENV !== 'production' || !allowed) return null

  return (
    <>
      <Analytics />
      <SpeedInsights />
    </>
  )
}
