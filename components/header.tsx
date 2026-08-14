'use client'

import { Menu, ShoppingBag, Sparkles, X } from 'lucide-react'
import { useState } from 'react'
import { useActiveProduct } from '@/components/active-product-context'
import type { Product } from '@/lib/products'

interface HeaderProps {
  cartCount: number
  onOpenCart: () => void
  onAddToCart: (product: Product) => void
}

const NAV_LINKS = [
  { href: '#menu', label: 'Меню' },
  { href: '#delivery', label: 'Доставка' },
  { href: '#about', label: 'О нас' },
  { href: '#contacts', label: 'Контакты' },
] as const

export function Header({ cartCount, onOpenCart, onAddToCart }: HeaderProps) {
  const { activeProduct, clearActiveProduct } = useActiveProduct()
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

  return (
    <header className="sticky top-0 z-50 border-b border-border bg-background/90 backdrop-blur-md">
      <TopBar
        activeProduct={activeProduct}
        onClear={clearActiveProduct}
        onAddToCart={onAddToCart}
      />

      <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-4 py-4 sm:px-6">
        <a href="#top" className="flex items-center gap-2">
          <span aria-hidden="true" className="text-3xl leading-none">
            🍩
          </span>
          <span className="text-xl font-extrabold tracking-tight text-foreground">Я-пончик</span>
        </a>

        <nav className="hidden items-center gap-8 md:flex" aria-label="Основная навигация">
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

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={onOpenCart}
            aria-haspopup="dialog"
            className="relative flex items-center gap-2 rounded-full bg-primary px-4 py-2.5 text-sm font-bold text-primary-foreground shadow-sm transition-shadow hover:shadow-md"
          >
            <ShoppingBag className="size-4" aria-hidden="true" />
            <span className="hidden sm:inline">Корзина</span>
            {cartCount > 0 && (
              <span
                className="absolute -right-1.5 -top-1.5 flex size-5 items-center justify-center rounded-full bg-accent text-[11px] font-bold text-accent-foreground"
                aria-label={`Товаров в корзине: ${cartCount}`}
              >
                {cartCount}
              </span>
            )}
          </button>

          <button
            type="button"
            className="flex size-10 items-center justify-center rounded-full text-foreground md:hidden"
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
          className="flex flex-col gap-1 border-t border-border px-4 py-3 md:hidden"
          aria-label="Мобильная навигация"
        >
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

function TopBar({
  activeProduct,
  onClear,
  onAddToCart,
}: {
  activeProduct: Product | null
  onClear: () => void
  onAddToCart: (product: Product) => void
}) {
  if (activeProduct) {
    return (
      <div
        className="bg-primary text-primary-foreground"
        role="status"
        aria-live="polite"
        aria-label={`Вы смотрите: ${activeProduct.name}`}
      >
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-3 px-4 py-2 sm:px-6">
          <p className="flex min-w-0 items-center gap-2 text-xs font-semibold sm:text-sm">
            <Sparkles className="size-3.5 shrink-0" aria-hidden="true" />
            <span className="truncate">
              <span className="hidden sm:inline">Сейчас смотрите: </span>
              <span className="font-extrabold">{activeProduct.name}</span>
              <span className="opacity-90"> · {activeProduct.price} ₽</span>
            </span>
          </p>

          <div className="flex shrink-0 items-center gap-1.5">
            <button
              type="button"
              onClick={() => onAddToCart(activeProduct)}
              className="rounded-full bg-primary-foreground px-3 py-1 text-xs font-bold text-primary shadow-sm transition-opacity hover:opacity-90 sm:px-4"
            >
              В корзину
            </button>
            <button
              type="button"
              onClick={onClear}
              aria-label="Сбросить выбранный товар"
              className="flex size-7 items-center justify-center rounded-full text-primary-foreground/80 transition-colors hover:bg-primary-foreground/15 hover:text-primary-foreground"
            >
              <X className="size-3.5" aria-hidden="true" />
            </button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="bg-secondary text-secondary-foreground">
      <div className="mx-auto flex max-w-6xl items-center justify-between gap-3 px-4 py-2 text-xs font-semibold sm:px-6 sm:text-sm">
        <p className="truncate">
          Открыты каждый день с 8:00 до 22:00
          <span className="hidden sm:inline"> · Самовывоз и доставка по Челябинску</span>
        </p>
        <a href="#delivery" className="shrink-0 font-bold text-primary hover:underline">
          Условия доставки
        </a>
      </div>
    </div>
  )
}
