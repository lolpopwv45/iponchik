import type { Viewport } from 'next'
import { Nunito } from 'next/font/google'
import { CookieConsent } from '@/components/cookie-consent'
import { SiteAnalytics } from '@/components/site-analytics'
import { buildRootMetadata } from '@/lib/site'
import './globals.css'

const _nunito = Nunito({
  subsets: ['latin', 'cyrillic'],
  variable: '--font-nunito',
})

export const metadata = buildRootMetadata()

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  colorScheme: 'light',
  themeColor: '#f97316',
  userScalable: true,
  viewportFit: 'cover',
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="ru" className={`${_nunito.variable} bg-background`}>
      <body className="antialiased font-sans">
        {children}
        <CookieConsent />
        <SiteAnalytics />
      </body>
    </html>
  )
}
