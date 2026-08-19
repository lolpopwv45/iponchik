'use client'

import Image from 'next/image'
import Link from 'next/link'
import { useEffect, useMemo, useState } from 'react'
import { MapPin, Phone } from 'lucide-react'
import { ActiveProductProvider, useActiveProduct } from '@/components/active-product-context'
import { CartDrawer, MobileCartBar } from '@/components/cart-drawer'
import type { CartItem } from '@/lib/cart'
import { DeliveryInfo } from '@/components/DeliveryInfo'
import { Header } from '@/components/header'
import { ProductCard } from '@/components/product-card'
import { ProductDetailModal, toProductDetail } from '@/components/product-detail-modal'
import { useCatalog } from '@/components/use-catalog'
import type { Catalog } from '@/lib/catalog'
import { ALL_CATEGORY, type Product } from '@/lib/products'
import {
  SITE_ADDRESS_LINE,
  SITE_FAQS,
  SITE_HOURS,
  SITE_NAME,
  SITE_PHONE_HREF,
  SITE_PHONE_LABEL,
  YANDEX_MAPS_URL,
} from '@/lib/site'

export function Storefront({ initialCatalog }: { initialCatalog: Catalog }) {
  return (
    <ActiveProductProvider>
      <StorefrontView initialCatalog={initialCatalog} />
    </ActiveProductProvider>
  )
}

function StorefrontView({ initialCatalog }: { initialCatalog: Catalog }) {
  const { activeProduct, isPinned, clearActiveProduct } = useActiveProduct()
  const { categories, products, loading, error } = useCatalog(initialCatalog)
  const [cartItems, setCartItems] = useState<CartItem[]>([])
  const [cartOpen, setCartOpen] = useState(false)
  const [activeCategoryId, setActiveCategoryId] = useState<number | 'all'>('all')

  const cartCount = cartItems.reduce((sum, item) => sum + item.quantity, 0)
  const cartTotal = cartItems.reduce((sum, item) => sum + item.price * item.quantity, 0)

  const visibleCategories = useMemo(
    () => categories.filter((category) => products.some((product) => product.categoryId === category.id)),
    [categories, products],
  )

  const filteredProducts = useMemo(() => {
    if (activeCategoryId === 'all') return products
    return products.filter((product) => product.categoryId === activeCategoryId)
  }, [activeCategoryId, products])

  useEffect(() => {
    if (activeCategoryId !== 'all' && !visibleCategories.some((category) => category.id === activeCategoryId)) {
      setActiveCategoryId('all')
    }
  }, [activeCategoryId, visibleCategories])

  function handleAddToCart(product: Product, quantity = 1) {
    if (!product.inStock) return
    setCartItems((items) => {
      const existing = items.find((item) => item.id === product.id)
      if (existing) {
        return items.map((item) =>
          item.id === product.id ? { ...item, quantity: item.quantity + quantity } : item,
        )
      }
      return [
        ...items,
        {
          id: product.id,
          name: product.name,
          price: product.price,
          image: product.image,
          quantity,
          badges: product.badges,
        },
      ]
    })
  }

  function handleIncrement(id: number) {
    setCartItems((items) =>
      items.map((item) => (item.id === id ? { ...item, quantity: item.quantity + 1 } : item)),
    )
  }

  function handleDecrement(id: number) {
    setCartItems((items) =>
      items
        .map((item) => (item.id === id ? { ...item, quantity: item.quantity - 1 } : item))
        .filter((item) => item.quantity > 0),
    )
  }

  function handleRemove(id: number) {
    setCartItems((items) => items.filter((item) => item.id !== id))
  }

  return (
    <main
      className={`min-h-screen bg-background text-foreground ${
        cartCount > 0 ? 'max-sm:pb-[calc(5.75rem+env(safe-area-inset-bottom))]' : ''
      }`}
    >
      <Header cartCount={cartCount} onOpenCart={() => setCartOpen(true)} />

      <section id="top" className="mx-auto max-w-6xl px-4 pb-8 pt-6 sm:px-6 sm:pb-12 sm:pt-16 lg:pt-20">
        <div className="grid items-center gap-6 lg:grid-cols-2 lg:gap-16 sm:gap-10">
          <div className="flex flex-col items-start gap-4 sm:gap-6">
            <span className="rounded-full bg-secondary px-4 py-1.5 text-sm font-bold text-secondary-foreground">
              Открыты каждый день с 8:00 до 22:00
            </span>
            <h1 className="text-balance text-[1.75rem] font-extrabold leading-[1.15] tracking-tight text-foreground sm:text-5xl lg:text-6xl">
              Свежие пончики и горячая пицца в Челябинске
            </h1>
            <p className="max-w-md text-pretty text-base leading-relaxed text-muted-foreground sm:text-lg">
              Пекарня «Я-пончик» на ул. Руставели, 24. Закажите онлайн — пончики, пиццу и пирожки
              приготовим к вашему приходу, без очереди.
            </p>
            <a
              href="#menu"
              className="inline-flex min-h-12 w-full items-center justify-center rounded-full bg-primary px-8 text-base font-bold text-primary-foreground shadow-sm transition-shadow hover:shadow-md sm:w-auto sm:py-3.5"
            >
              Смотреть меню
            </a>
          </div>

          <div className="relative aspect-[16/10] w-full overflow-hidden rounded-2xl shadow-md sm:aspect-[4/3] sm:rounded-3xl">
            <Image
              src="/images/hero-donuts.png"
              alt="Свежие глазированные пончики и горячая пицца на деревянном столе в пекарне Я-пончик, Челябинск"
              fill
              priority
              className="object-cover"
              sizes="(min-width: 1024px) 560px, 100vw"
            />
          </div>
        </div>
      </section>

      <section id="menu" className="mx-auto max-w-6xl px-4 py-8 sm:px-6 sm:py-16">
        <div className="mb-5 flex flex-col gap-2 sm:mb-8">
          <h2 className="text-2xl font-extrabold tracking-tight text-foreground sm:text-4xl">
            Меню пекарни «Я-пончик»
          </h2>
          <p className="text-sm text-muted-foreground sm:text-base">
            Пончики, пицца и пирожки в Челябинске — выбирайте категорию и собирайте заказ
          </p>
        </div>

        <div
          className="sticky z-30 -mx-4 mb-5 border-b border-border bg-background/95 px-4 py-3 backdrop-blur-md sm:static sm:mx-0 sm:mb-8 sm:border-0 sm:bg-transparent sm:px-0 sm:py-0 sm:backdrop-blur-none"
          style={{ top: 'var(--site-header-height, 4rem)' }}
        >
          <div
            className="scrollbar-none flex gap-2 overflow-x-auto pb-0.5 sm:flex-wrap sm:overflow-visible"
            role="group"
            aria-label="Фильтр по категориям"
          >
            <button
              type="button"
              onClick={() => setActiveCategoryId('all')}
              aria-pressed={activeCategoryId === 'all'}
              className={`min-h-11 shrink-0 rounded-full px-4 text-sm font-bold transition-colors sm:px-5 ${
                activeCategoryId === 'all'
                  ? 'bg-primary text-primary-foreground shadow-sm'
                  : 'bg-secondary text-secondary-foreground hover:bg-secondary/70'
              }`}
            >
              {ALL_CATEGORY}
            </button>
            {visibleCategories.map((category) => {
              const isActive = category.id === activeCategoryId
              return (
                <button
                  key={category.id}
                  type="button"
                  onClick={() => setActiveCategoryId(category.id)}
                  aria-pressed={isActive}
                  className={`min-h-11 shrink-0 rounded-full px-4 text-sm font-bold transition-colors sm:px-5 ${
                    isActive
                      ? 'bg-primary text-primary-foreground shadow-sm'
                      : 'bg-secondary text-secondary-foreground hover:bg-secondary/70'
                  }`}
                >
                  {category.name}
                </button>
              )
            })}
          </div>
        </div>

        {error ? (
          <p className="mb-5 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-semibold text-red-700" role="alert">
            {error}
          </p>
        ) : null}

        {loading && products.length === 0 ? (
          <div className="grid grid-cols-2 gap-2.5 sm:gap-6 lg:grid-cols-4">
            {Array.from({ length: 8 }).map((_, index) => (
              <div key={index} className="overflow-hidden rounded-2xl bg-card shadow-sm sm:rounded-3xl">
                <div className="aspect-square animate-pulse bg-muted" />
                <div className="space-y-2 p-3">
                  <div className="h-4 w-3/4 animate-pulse rounded bg-muted" />
                  <div className="h-3 w-1/2 animate-pulse rounded bg-muted" />
                </div>
              </div>
            ))}
          </div>
        ) : filteredProducts.length === 0 ? (
          <div className="rounded-3xl bg-secondary px-5 py-12 text-center">
            <p className="text-lg font-extrabold text-secondary-foreground">В этой категории пока пусто</p>
            <p className="mt-1 text-sm text-secondary-foreground/70">Выберите другой раздел или загляните позже</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-2.5 sm:gap-6 lg:grid-cols-4">
            {filteredProducts.map((product) => (
              <ProductCard key={product.id} product={product} onAddToCart={handleAddToCart} />
            ))}
          </div>
        )}
      </section>

      <DeliveryInfo />

      <section id="about" className="mx-auto max-w-6xl px-4 py-8 sm:px-6 sm:py-16">
        <div className="rounded-3xl bg-secondary px-5 py-8 sm:px-12 sm:py-14">
          <h2 className="mb-3 text-2xl font-extrabold tracking-tight text-secondary-foreground sm:text-4xl">
            О пекарне в Челябинске
          </h2>
          <p className="max-w-2xl text-pretty text-base leading-relaxed text-secondary-foreground/80 sm:text-lg">
            «Я-пончик» — пекарня и кулинария на ул. Руставели, 24 в Челябинске. Каждый пончик, пирожок
            и кусочек пиццы готовится вручную из простых ингредиентов. Работаем {SITE_HOURS.label}:
            закажите онлайн и заберите горячий заказ на кассе без ожидания.
          </p>
        </div>
      </section>

      <section id="faq" className="mx-auto max-w-6xl px-4 py-8 sm:px-6 sm:py-16">
        <div className="mb-6 flex flex-col gap-2 sm:mb-8">
          <h2 className="text-2xl font-extrabold tracking-tight text-foreground sm:text-4xl">
            Частые вопросы
          </h2>
          <p className="text-sm text-muted-foreground sm:text-base">
            Адрес, доставка по Челябинску и заказ без очереди
          </p>
        </div>
        <div className="mx-auto flex max-w-2xl flex-col gap-3">
          {SITE_FAQS.map((item) => (
            <article key={item.question} className="rounded-3xl bg-card px-5 py-4 shadow-sm ring-1 ring-border/60 sm:px-6">
              <h3 className="text-base font-extrabold tracking-tight text-card-foreground">{item.question}</h3>
              <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{item.answer}</p>
            </article>
          ))}
        </div>
      </section>

      <footer id="contacts" className="border-t border-border bg-secondary/40">
        <div className="mx-auto flex max-w-6xl flex-col gap-5 px-4 py-8 sm:flex-row sm:items-center sm:justify-between sm:gap-6 sm:px-6 sm:py-10">
          <div className="flex items-center gap-2">
            <span aria-hidden="true" className="text-2xl leading-none">
              🍩
            </span>
            <div className="flex flex-col">
              <span className="text-lg font-extrabold text-foreground">{SITE_NAME}</span>
              <span className="text-xs text-muted-foreground">Пекарня и кулинария, Челябинск</span>
            </div>
          </div>

          <address className="flex flex-col gap-2 text-sm not-italic text-muted-foreground sm:flex-row sm:gap-6">
            <a
              href={YANDEX_MAPS_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 hover:text-primary"
            >
              <MapPin className="size-4 shrink-0" aria-hidden="true" />
              {SITE_ADDRESS_LINE}
            </a>
            <a href={SITE_PHONE_HREF} className="flex min-h-11 items-center gap-2 hover:text-primary">
              <Phone className="size-4 shrink-0" aria-hidden="true" />
              {SITE_PHONE_LABEL}
            </a>
          </address>

          <div className="flex flex-col gap-2 text-sm text-muted-foreground sm:items-end">
            <p>Открыты {SITE_HOURS.label}</p>
            <Link href="/privacy" className="hover:text-primary">
              Политика конфиденциальности
            </Link>
            <p>© {new Date().getFullYear()} {SITE_NAME}. Все права защищены.</p>
          </div>
        </div>
      </footer>

      <MobileCartBar
        count={cartCount}
        total={cartTotal}
        visible={!cartOpen && !(isPinned && activeProduct)}
        onOpen={() => setCartOpen(true)}
      />

      <CartDrawer
        open={cartOpen}
        onClose={() => setCartOpen(false)}
        items={cartItems}
        onIncrement={handleIncrement}
        onDecrement={handleDecrement}
        onRemove={handleRemove}
        onClear={() => setCartItems([])}
      />

      <ProductDetailModal
        product={isPinned && activeProduct ? toProductDetail(activeProduct) : null}
        open={Boolean(isPinned && activeProduct)}
        onClose={clearActiveProduct}
        onAddToCart={(_detail, quantity) => {
          if (!activeProduct) return
          handleAddToCart(activeProduct, quantity)
        }}
      />
    </main>
  )
}
