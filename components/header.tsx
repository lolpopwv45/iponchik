'use client'

import { Menu, ShoppingBag, X } from 'lucide-react'
import { useEffect, useRef, useState } from 'react'
import { cn } from '@/lib/utils'
import { SITE_NAME, SITE_PHONE_HREF, SITE_PHONE_LABEL } from '@/lib/site'

interface HeaderProps {
  cartCount: number
  onOpenCart: () => void
}

const NAV_LINKS = [
  { href: '/#menu', label: 'Меню' },
  { href: '/#delivery', label: 'Доставка' },
  { href: '/#about', label: 'О нас' },
  { href: '/#contacts', label: 'Контакты' },
] as const

export function Header({ cartCount, onOpenCart }: HeaderProps) {
  const headerRef = useRef<HTMLElement>(null)
  const [menuOpen, setMenuOpen] = useState(false)
  const [cartBumpKey, setCartBumpKey] = useState(0)
  const prevCartCount = useRef(cartCount)

  useEffect(() => {
    if (cartCount > prevCartCount.current) {
      setCartBumpKey((key) => key + 1)
    }
    prevCartCount.current = cartCount
  }, [cartCount])

  useEffect(() => {
    const header = headerRef.current
    if (!header) return

    function syncHeight() {
      const el = headerRef.current
      if (!el) return
      document.documentElement.style.setProperty(
        '--site-header-height',
        `${el.getBoundingClientRect().height}px`,
      )
    }

    syncHeight()
    const observer = new ResizeObserver(syncHeight)
    observer.observe(header)
    window.addEventListener('resize', syncHeight)
    return () => {
      observer.disconnect()
      window.removeEventListener('resize', syncHeight)
    }
  }, [])

  useEffect(() => {
    const desktop = window.matchMedia('(min-width: 1024px)')

    function onChange() {
      if (desktop.matches) setMenuOpen(false)
    }

    desktop.addEventListener('change', onChange)
    return () => desktop.removeEventListener('change', onChange)
  }, [])

  useEffect(() => {
    if (!menuOpen) return

    const previousOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'

    function onKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') setMenuOpen(false)
    }

    window.addEventListener('keydown', onKeyDown)
    return () => {
      document.body.style.overflow = previousOverflow
      window.removeEventListener('keydown', onKeyDown)
    }
  }, [menuOpen])

  function closeMenu() {
    setMenuOpen(false)
  }

  return (
    <header
      ref={headerRef}
      className="sticky top-0 z-50 border-b border-border bg-background/90 pt-[env(safe-area-inset-top)] backdrop-blur-md"
    >
      <div className="mx-auto hidden max-w-6xl items-center gap-6 px-6 py-4 lg:flex">
        <a href="/" className="flex shrink-0 items-center gap-2">
          <span aria-hidden="true" className="text-3xl leading-none">
            🍩
          </span>
          <span className="text-xl font-extrabold tracking-tight text-foreground">{SITE_NAME}</span>
        </a>

        <nav className="flex flex-1 items-center justify-center gap-6" aria-label="Основная навигация">
          {NAV_LINKS.map((link) => (
            <a
              key={link.href}
              href={link.href}
              className="text-sm font-semibold text-muted-foreground transition-colors hover:text-primary"
            >
              {link.label}
            </a>
          ))}
        </nav>

        <a
          href={SITE_PHONE_HREF}
          className="shrink-0 text-sm font-bold tabular-nums tracking-tight text-foreground transition-colors hover:text-primary"
        >
          {SITE_PHONE_LABEL}
        </a>

        <CartButton cartCount={cartCount} cartBumpKey={cartBumpKey} onOpenCart={onOpenCart} />
      </div>

      <div className="mx-auto grid max-w-6xl grid-cols-[1fr_auto_1fr] items-center gap-2 px-4 py-2.5 lg:hidden">
        <a href="/" className="flex min-w-0 items-center gap-2 justify-self-start">
          <span aria-hidden="true" className="text-3xl leading-none">
            🍩
          </span>
          <span className="truncate text-lg font-extrabold tracking-tight text-foreground">
            {SITE_NAME}
          </span>
        </a>

        <a
          href={SITE_PHONE_HREF}
          className="justify-self-center text-center text-sm font-bold tabular-nums tracking-tight text-foreground hover:text-primary"
        >
          {SITE_PHONE_LABEL}
        </a>

        <button
          type="button"
          className="flex size-11 items-center justify-center justify-self-end rounded-full text-foreground hover:bg-secondary"
          onClick={() => setMenuOpen((open) => !open)}
          aria-expanded={menuOpen}
          aria-label={menuOpen ? 'Закрыть меню' : 'Открыть меню'}
        >
          {menuOpen ? (
            <X className="size-5" aria-hidden="true" />
          ) : (
            <Menu className="size-5" aria-hidden="true" />
          )}
        </button>
      </div>

      {menuOpen ? (
        <div
          className="fixed inset-x-0 bottom-0 z-40 lg:hidden"
          style={{ top: 'var(--site-header-height, 4rem)' }}
        >
          <button
            type="button"
            className="absolute inset-0 bg-foreground/40"
            aria-label="Закрыть меню"
            onClick={closeMenu}
          />
          <nav
            className="relative flex flex-col gap-1 border-b border-border bg-background px-4 py-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] shadow-lg"
            aria-label="Мобильная навигация"
          >
            {NAV_LINKS.map((link) => (
              <a
                key={link.href}
                href={link.href}
                onClick={closeMenu}
                className="flex min-h-12 items-center rounded-xl px-3 text-base font-semibold text-foreground hover:bg-secondary"
              >
                {link.label}
              </a>
            ))}
            <button
              type="button"
              onClick={() => {
                closeMenu()
                onOpenCart()
              }}
              className="flex min-h-12 items-center gap-2 rounded-xl px-3 text-left text-base font-semibold text-foreground hover:bg-secondary"
            >
              <ShoppingBag className="size-4" aria-hidden="true" />
              Корзина
              {cartCount > 0 ? (
                <span
                  key={cartBumpKey}
                  className={cn(
                    'ml-auto flex size-5 items-center justify-center rounded-full bg-primary text-[11px] font-bold text-primary-foreground',
                    cartBumpKey > 0 && 'animate-cart-badge-pop',
                  )}
                >
                  {cartCount}
                </span>
              ) : null}
            </button>
          </nav>
        </div>
      ) : null}
    </header>
  )
}

function CartButton({
  cartCount,
  cartBumpKey,
  onOpenCart,
}: {
  cartCount: number
  cartBumpKey: number
  onOpenCart: () => void
}) {
  return (
    <button
      type="button"
      onClick={onOpenCart}
      aria-haspopup="dialog"
      className="relative flex items-center gap-2 rounded-full bg-primary px-4 py-2.5 text-sm font-bold text-primary-foreground shadow-sm transition-shadow hover:shadow-md"
    >
      <ShoppingBag className="size-4" aria-hidden="true" />
      Корзина
      {cartCount > 0 && (
        <span
          key={cartBumpKey}
          className={cn(
            'absolute -right-1.5 -top-1.5 flex size-5 items-center justify-center rounded-full bg-accent text-[11px] font-bold text-accent-foreground',
            cartBumpKey > 0 && 'animate-cart-badge-pop',
          )}
          aria-label={`Товаров в корзине: ${cartCount}`}
        >
          {cartCount}
        </span>
      )}
    </button>
  )
}
