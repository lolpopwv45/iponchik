'use client'

import Image from 'next/image'
import { useMemo, useState } from 'react'
import { MapPin, Phone } from 'lucide-react'
import { ActiveProductProvider } from '@/components/active-product-context'
import { CartDrawer, type CartItem } from '@/components/cart-drawer'
import { DeliveryInfo } from '@/components/DeliveryInfo'
import { Header } from '@/components/header'
import { ProductCard } from '@/components/product-card'
import { CATEGORIES, PRODUCTS, type Category, type Product } from '@/lib/products'

const INITIAL_CART: CartItem[] = [
  {
    id: 3,
    name: 'Пончик классический',
    price: 89,
    image: '/images/product-donut-classic.png',
    quantity: 2,
  },
  {
    id: 6,
    name: 'Синнабон с корицей',
    price: 150,
    image: '/images/product-cinnamon-roll.png',
    quantity: 1,
  },
]

export default function Page() {
  return (
    <ActiveProductProvider>
      <Storefront />
    </ActiveProductProvider>
  )
}

function Storefront() {
  const [cartItems, setCartItems] = useState<CartItem[]>(INITIAL_CART)
  const [cartOpen, setCartOpen] = useState(false)
  const [activeCategory, setActiveCategory] = useState<Category>('Все')

  const cartCount = cartItems.reduce((sum, item) => sum + item.quantity, 0)

  const filteredProducts = useMemo(() => {
    if (activeCategory === 'Все') return PRODUCTS
    return PRODUCTS.filter((product) => product.category === activeCategory)
  }, [activeCategory])

  function handleAddToCart(product: Product) {
    setCartItems((items) => {
      const existing = items.find((item) => item.id === product.id)
      if (existing) {
        return items.map((item) =>
          item.id === product.id ? { ...item, quantity: item.quantity + 1 } : item,
        )
      }
      return [
        ...items,
        {
          id: product.id,
          name: product.name,
          price: product.price,
          image: product.image,
          quantity: 1,
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
    <main className="min-h-screen bg-background text-foreground">
      <Header
        cartCount={cartCount}
        onOpenCart={() => setCartOpen(true)}
        onAddToCart={handleAddToCart}
      />

      <section id="top" className="mx-auto max-w-6xl px-4 pb-12 pt-10 sm:px-6 sm:pt-16 lg:pt-20">
        <div className="grid items-center gap-10 lg:grid-cols-2 lg:gap-16">
          <div className="flex flex-col items-start gap-6">
            <span className="rounded-full bg-secondary px-4 py-1.5 text-sm font-bold text-secondary-foreground">
              Открыты каждый день с 8:00 до 22:00
            </span>
            <h1 className="text-balance text-4xl font-extrabold leading-[1.1] tracking-tight text-foreground sm:text-5xl lg:text-6xl">
              Свежие пончики и горячая пицца
            </h1>
            <p className="max-w-md text-pretty text-lg leading-relaxed text-muted-foreground">
              Закажите онлайн и заберите готовый заказ без очереди — печём и жарим каждую партию
              свежей, к вашему приходу.
            </p>
            <a
              href="#menu"
              className="rounded-full bg-primary px-8 py-3.5 text-base font-bold text-primary-foreground shadow-sm transition-shadow hover:shadow-md"
            >
              Смотреть меню
            </a>
          </div>

          <div className="relative aspect-[4/3] w-full overflow-hidden rounded-3xl shadow-md">
            <Image
              src="/images/hero-donuts.png"
              alt="Свежие глазированные пончики и горячая пицца на деревянном столе"
              fill
              priority
              className="object-cover"
              sizes="(min-width: 1024px) 560px, 100vw"
            />
          </div>
        </div>
      </section>

      <section id="menu" className="mx-auto max-w-6xl px-4 py-12 sm:px-6 sm:py-16">
        <div className="mb-8 flex flex-col gap-2">
          <h2 className="text-3xl font-extrabold tracking-tight text-foreground sm:text-4xl">
            Наше меню
          </h2>
          <p className="text-muted-foreground">Выбирайте категорию и собирайте заказ</p>
        </div>

        <div className="mb-8 flex flex-wrap gap-2" role="group" aria-label="Фильтр по категориям">
          {CATEGORIES.map((category) => {
            const isActive = category === activeCategory
            return (
              <button
                key={category}
                type="button"
                onClick={() => setActiveCategory(category)}
                aria-pressed={isActive}
                className={`rounded-full px-5 py-2.5 text-sm font-bold transition-colors ${
                  isActive
                    ? 'bg-primary text-primary-foreground shadow-sm'
                    : 'bg-secondary text-secondary-foreground hover:bg-secondary/70'
                }`}
              >
                {category}
              </button>
            )
          })}
        </div>

        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {filteredProducts.map((product) => (
            <ProductCard key={product.id} product={product} onAddToCart={handleAddToCart} />
          ))}
        </div>
      </section>

      <DeliveryInfo />

      <section id="about" className="mx-auto max-w-6xl px-4 py-12 sm:px-6 sm:py-16">
        <div className="rounded-3xl bg-secondary px-6 py-10 sm:px-12 sm:py-14">
          <h2 className="mb-3 text-3xl font-extrabold tracking-tight text-secondary-foreground sm:text-4xl">
            О нас
          </h2>
          <p className="max-w-2xl text-pretty text-base leading-relaxed text-secondary-foreground/80 sm:text-lg">
            «Я-пончик» — небольшая пекарня и кулинария, где каждый пончик, пирожок и кусочек пиццы
            готовится вручную из простых и честных ингредиентов. Мы работаем каждый день, чтобы вы
            могли забрать горячий заказ без ожидания. Сделайте заказ и получите его по готовности на
            кассе.
          </p>
        </div>
      </section>

      <footer id="contacts" className="border-t border-border bg-secondary/40">
        <div className="mx-auto flex max-w-6xl flex-col gap-6 px-4 py-10 sm:flex-row sm:items-center sm:justify-between sm:px-6">
          <div className="flex items-center gap-2">
            <span aria-hidden="true" className="text-2xl leading-none">
              🍩
            </span>
            <span className="text-lg font-extrabold text-foreground">Я-пончик</span>
          </div>

          <div className="flex flex-col gap-2 text-sm text-muted-foreground sm:flex-row sm:gap-6">
            <span className="flex items-center gap-2">
              <MapPin className="size-4 shrink-0" aria-hidden="true" />
              ул. Руставели, 24, Челябинск
            </span>
            <a href="tel:+79084945053" className="flex items-center gap-2 hover:text-primary">
              <Phone className="size-4 shrink-0" aria-hidden="true" />
              +7 (908) 494-50-53
            </a>
          </div>

          <p className="text-sm text-muted-foreground">
            © {new Date().getFullYear()} Я-пончик. Все права защищены.
          </p>
        </div>
      </footer>

      <CartDrawer
        open={cartOpen}
        onClose={() => setCartOpen(false)}
        items={cartItems}
        onIncrement={handleIncrement}
        onDecrement={handleDecrement}
        onRemove={handleRemove}
      />
    </main>
  )
}
