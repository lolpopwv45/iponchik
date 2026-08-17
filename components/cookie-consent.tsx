'use client'

import { Cookie } from 'lucide-react'
import Link from 'next/link'
import { useEffect, useRef, useState } from 'react'
import { readCookieConsent, writeCookieConsent, type CookieConsentValue } from '@/lib/cookie-consent'

export function CookieConsent() {
  const [open, setOpen] = useState(false)
  const acceptRef = useRef<HTMLButtonElement>(null)

  useEffect(() => {
    if (!readCookieConsent()) setOpen(true)
  }, [])

  useEffect(() => {
    if (open) acceptRef.current?.focus()
  }, [open])

  useEffect(() => {
    if (!open) return

    const previousOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'

    return () => {
      document.body.style.overflow = previousOverflow
    }
  }, [open])

  function accept(value: CookieConsentValue) {
    writeCookieConsent(value)
    setOpen(false)
  }

  if (!open) return null

  return (
    <div className="fixed inset-0 z-[80] flex items-end justify-center p-4 sm:items-center sm:p-6">
      <div className="absolute inset-0 bg-foreground/40 backdrop-blur-[2px]" aria-hidden="true" />

      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="cookie-consent-title"
        aria-describedby="cookie-consent-text"
        className="animate-cookie-dialog relative w-full max-w-[28rem] overflow-hidden rounded-3xl border border-border bg-card shadow-2xl"
      >
        <div
          className="pointer-events-none absolute -right-8 -top-10 size-32 rounded-full bg-primary/15"
          aria-hidden="true"
        />
        <div
          className="pointer-events-none absolute -bottom-12 -left-10 size-28 rounded-full bg-accent/10"
          aria-hidden="true"
        />

        <div className="relative flex flex-col gap-5 px-5 py-6 sm:px-7 sm:py-8">
          <div className="flex items-start gap-3">
            <span className="flex size-12 shrink-0 items-center justify-center rounded-2xl bg-primary/12 text-primary">
              <Cookie className="size-6" aria-hidden="true" />
            </span>
            <div className="min-w-0 pt-0.5">
              <p className="text-xs font-bold uppercase tracking-[0.14em] text-primary">Я-пончик</p>
              <h2 id="cookie-consent-title" className="text-xl font-extrabold tracking-tight text-card-foreground">
                Мы используем cookies
              </h2>
            </div>
          </div>

          <div className="flex flex-col gap-3">
            <p id="cookie-consent-text" className="text-pretty text-sm leading-relaxed text-muted-foreground">
              Сайт сохраняет файлы cookie и похожие данные, чтобы страница работала стабильно, помнила
              ваши настройки и, с вашего согласия, собирала обезличенную статистику посещений.
            </p>
            <Link
              href="/privacy#cookies"
              className="w-fit text-sm font-semibold text-foreground underline decoration-primary/50 underline-offset-4 transition-colors hover:text-primary hover:decoration-primary"
            >
              Политика конфиденциальности
            </Link>
          </div>

          <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
            <button
              type="button"
              onClick={() => accept('necessary')}
              className="flex min-h-12 items-center justify-center rounded-full border border-border bg-background px-5 text-sm font-bold text-foreground transition-colors hover:bg-secondary"
            >
              Только необходимые
            </button>
            <button
              ref={acceptRef}
              type="button"
              onClick={() => accept('all')}
              className="flex min-h-12 items-center justify-center rounded-full bg-primary px-6 text-sm font-bold text-primary-foreground shadow-sm transition-shadow hover:shadow-md"
            >
              Принять все
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
