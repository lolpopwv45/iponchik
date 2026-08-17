import { Analytics } from '@vercel/analytics/next'
import { SpeedInsights } from '@vercel/speed-insights/next'
import type { Metadata, Viewport } from 'next'
import { Nunito } from 'next/font/google'
import './globals.css'

const _nunito = Nunito({
  subsets: ['latin', 'cyrillic'],
  variable: '--font-nunito',
})

export const metadata: Metadata = {
  title: 'Я-пончик — Свежие пончики и горячая пицца',
  description:
    'Кулинария и пекарня «Я-пончик»: свежие пончики, горячая пицца, пирожки и десерты. Заказ онлайн без очереди.',
  generator: 'v0.app',
}

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
        {process.env.NODE_ENV === 'production' && (
          <>
            <Analytics />
            <SpeedInsights />
          </>
        )}
      </body>
    </html>
  )
}
