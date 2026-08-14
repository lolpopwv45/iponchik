'use client'

import { Clock, Menu, Phone, ShoppingBag, X } from 'lucide-react'
import { useEffect, useRef, useState } from 'react'
import { cn } from '@/lib/utils'

interface HeaderProps {
  cartCount: number
  onOpenCart: () => void
}

const NAV_LINKS = [
  { href: '#menu', label: 'Меню' },
  { href: '#delivery', label: 'Доставка' },
  { href: '#about', label: 'О нас' },
  { href: '#contacts', label: 'Контакты' },
] as const

export function Header({ cartCount, onOpenCart }: HeaderProps) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [cartBumpKey, setCartBumpKey] = useState(0)
  const prevCartCount = useRef(cartCount)

  useEffect(() => {
    if (cartCount > prevCartCount.current) {
      setCartBumpKey((key) => key + 1)
    }
    prevCartCount.current = cartCount
  }, [cartCount])

  return (
    <header className="sticky top-0 z-50 border-b border-border bg-background/90 backdrop-blur-md">
      <div className="mx-auto flex max-w-6xl items-center gap-3 px-4 py-3 sm:gap-4 sm:px-6 sm:py-4">
        <a href="#top" className="flex min-w-0 shrink-0 items-center gap-2">
          <span aria-hidden="true" className="text-3xl leading-none">
            🍩
          </span>
          <span className="text-lg font-extrabold tracking-tight text-foreground sm:text-xl">
            Я-пончик
          </span>
        </a>

        <p className="hidden min-w-0 items-center gap-1.5 text-xs font-semibold text-muted-foreground lg:flex">
          <Clock className="size-3.5 shrink-0" aria-hidden="true" />
          <span className="truncate">Ежедневно с 8:00 до 22:00</span>
        </p>

        <nav className="hidden flex-1 items-center justify-center gap-6 xl:flex" aria-label="Основная навигация">
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

        <div className="ml-auto flex items-center gap-2 sm:gap-3">
          <p className="flex items-center gap-1 text-[11px] font-semibold text-muted-foreground sm:text-xs lg:hidden">
            <Clock className="size-3.5 shrink-0" aria-hidden="true" />
            <span>8:00–22:00</span>
          </p>
          <a
            href="tel:+79084945053"
            className="flex items-center gap-1.5 text-xs font-bold text-foreground transition-colors hover:text-primary sm:text-sm"
          >
            <Phone className="size-3.5 shrink-0" aria-hidden="true" />
            <span className="hidden md:inline">+7 (908) 494-50-53</span>
            <span className="sr-only md:hidden">Позвонить: +7 (908) 494-50-53</span>
          </a>

          <button
            type="button"
            onClick={onOpenCart}
            aria-haspopup="dialog"
            className="relative flex items-center gap-2 rounded-full bg-primary px-3 py-2 text-sm font-bold text-primary-foreground shadow-sm transition-shadow hover:shadow-md sm:px-4 sm:py-2.5"
          >
            <ShoppingBag className="size-4" aria-hidden="true" />
            <span className="hidden sm:inline">Корзина</span>
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

          <button
            type="button"
            className="flex size-10 items-center justify-center rounded-full text-foreground xl:hidden"
            onClick={() => setMobileMenuOpen((open) => !open)}
            aria-expanded={mobileMenuOpen}
            aria-label={mobileMenuOpen ? 'Закрыть меню' : 'Открыть меню'}
          >
            {mobileMenuOpen ? (
              <X className="size-5" aria-hidden="true" />
            ) : (
              <Menu className="size-5" aria-hidden="true" />
            )}
          </button>
        </div>
      </div>

      {mobileMenuOpen && (
        <nav
          className="flex flex-col gap-1 border-t border-border px-4 py-3 xl:hidden"
          aria-label="Мобильная навигация"
        >
          <p className="flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-muted-foreground lg:hidden">
            <Clock className="size-3.5 shrink-0" aria-hidden="true" />
            Ежедневно с 8:00 до 22:00
          </p>
          <a
            href="tel:+79084945053"
            className="flex items-center gap-1.5 rounded-xl px-3 py-2.5 text-sm font-semibold text-foreground hover:bg-secondary md:hidden"
          >
            <Phone className="size-4 shrink-0" aria-hidden="true" />
            +7 (908) 494-50-53
          </a>
          {NAV_LINKS.map((link) => (
            <a
              key={link.href}
              href={link.href}
              onClick={() => setMobileMenuOpen(false)}
              className="rounded-xl px-3 py-2.5 text-sm font-semibold text-foreground hover:bg-secondary"
            >
              {link.label}
            </a>
          ))}
        </nav>
      )}
    </header>
  )
}
