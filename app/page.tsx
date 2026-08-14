'use client'

import Image from 'next/image'
import { useMemo, useState } from 'react'
import { MapPin, Menu, Phone, Plus, ShoppingBag, X } from 'lucide-react'
import { CartDrawer, type CartItem } from '@/components/cart-drawer'

// ---------------------------------------------------------------------------
// Моковые данные каталога.
// В будущем этот массив будет заменён запросом к таблице `products` в Supabase,
// например: const { data } = await supabase.from('products').select('*')
// ---------------------------------------------------------------------------

type Category = 'Все' | 'Пиццы' | 'Пирожки' | 'Десерты'

interface Product {
  id: number
  name: string
  description: string
  price: number
  category: Category
  image: string
}

const CATEGORIES: Category[] = ['Все', 'Пиццы', 'Пирожки', 'Десерты']

const PRODUCTS: Product[] = [
  {
    id: 1,
    name: 'Пицца Маргарита',
    description: 'Томатный соус, моцарелла, свежий базилик',
    price: 420,
    category: 'Пиццы',
    image: '/images/product-pizza.png',
  },
  {
    id: 2,
    name: 'Пицца Пепперони',
    description: 'Острая пепперони и плавленый сыр',
    price: 460,
    category: 'Пиццы',
    image: '/images/product-pizza-pepperoni.png',
  },
  {
    id: 3,
    name: 'Пончик классический',
    description: 'Нежное тесто с розовой глазурью и посыпкой',
    price: 89,
    category: 'Десерты',
    image: '/images/product-donut-classic.png',
  },
  {
    id: 4,
    name: 'Пончик шоколадный',
    description: 'Шоколадная глазурь и шоколадная крошка',
    price: 95,
    category: 'Десерты',
    image: '/images/product-donut-chocolate.png',
  },
  {
    id: 5,
    name: 'Пирожок с мясом',
    description: 'Сочная мясная начинка в золотистом тесте',
    price: 110,
    category: 'Пирожки',
    image: '/images/product-pirozhok.png',
  },
  {
    id: 6,
    name: 'Синнабон с корицей',
    description: 'Булочка с корицей и кремовой глазурью',
    price: 150,
    category: 'Десерты',
    image: '/images/product-cinnamon-roll.png',
  },
]

// Пара товаров, уже «лежащих» в корзине для демонстрации интерфейса.
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
  // Товары в корзине (пока хранится только на клиенте)
  const [cartItems, setCartItems] = useState<CartItem[]>(INITIAL_CART)
  const [cartOpen, setCartOpen] = useState(false)
  const [activeCategory, setActiveCategory] = useState<Category>('Все')
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

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
      {/* ------------------------------------------------------------- */}
      {/* Header */}
      {/* ------------------------------------------------------------- */}
      <header className="sticky top-0 z-50 border-b border-border bg-background/90 backdrop-blur-md">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-4 py-4 sm:px-6">
          <a href="#top" className="flex items-center gap-2">
            <span aria-hidden="true" className="text-3xl leading-none">
              🍩
            </span>
            <span className="text-xl font-extrabold tracking-tight text-foreground">
              Я-пончик
            </span>
          </a>

          <nav className="hidden items-center gap-8 md:flex" aria-label="Основная навигация">
            <a
              href="#menu"
              className="text-sm font-semibold text-muted-foreground transition-colors hover:text-primary"
            >
              Меню
            </a>
            <a
              href="#about"
              className="text-sm font-semibold text-muted-foreground transition-colors hover:text-primary"
            >
              О нас
            </a>
            <a
              href="#contacts"
              className="text-sm font-semibold text-muted-foreground transition-colors hover:text-primary"
            >
              Контакты
            </a>
          </nav>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setCartOpen(true)}
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
            <a
              href="#menu"
              onClick={() => setMobileMenuOpen(false)}
              className="rounded-xl px-3 py-2.5 text-sm font-semibold text-foreground hover:bg-secondary"
            >
              Меню
            </a>
            <a
              href="#about"
              onClick={() => setMobileMenuOpen(false)}
              className="rounded-xl px-3 py-2.5 text-sm font-semibold text-foreground hover:bg-secondary"
            >
              О нас
            </a>
            <a
              href="#contacts"
              onClick={() => setMobileMenuOpen(false)}
              className="rounded-xl px-3 py-2.5 text-sm font-semibold text-foreground hover:bg-secondary"
            >
              Контакты
            </a>
          </nav>
        )}
      </header>

      {/* ------------------------------------------------------------- */}
      {/* Hero Section */}
      {/* ------------------------------------------------------------- */}
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
              Закажите онлайн и заберите готовый заказ без очереди — печём и жарим
              каждую партию свежей, к вашему приходу.
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

      {/* ------------------------------------------------------------- */}
      {/* Menu / Catalog Section */}
      {/* ------------------------------------------------------------- */}
      <section id="menu" className="mx-auto max-w-6xl px-4 py-12 sm:px-6 sm:py-16">
        <div className="mb-8 flex flex-col gap-2">
          <h2 className="text-3xl font-extrabold tracking-tight text-foreground sm:text-4xl">
            Наше меню
          </h2>
          <p className="text-muted-foreground">Выбирайте категорию и собирайте заказ</p>
        </div>

        {/* Category filters */}
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

        {/* Product grid */}
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {filteredProducts.map((product) => (
            <article
              key={product.id}
              className="group flex flex-col overflow-hidden rounded-3xl bg-card shadow-sm transition-shadow hover:shadow-md"
            >
              <div className="relative aspect-square w-full overflow-hidden">
                <Image
                  src={product.image}
                  alt={product.name}
                  fill
                  className="object-cover transition-transform duration-300 group-hover:scale-105"
                  sizes="(min-width: 1024px) 280px, (min-width: 640px) 45vw, 90vw"
                />
              </div>
              <div className="flex flex-1 flex-col gap-1.5 p-4">
                <h3 className="text-base font-bold text-card-foreground">{product.name}</h3>
                <p className="line-clamp-2 flex-1 text-sm leading-relaxed text-muted-foreground">
                  {product.description}
                </p>
                <div className="mt-3 flex items-center justify-between">
                  <span className="text-lg font-extrabold text-foreground">
                    {product.price} ₽
                  </span>
                  <button
                    type="button"
                    onClick={() => handleAddToCart(product)}
                    aria-label={`Добавить «${product.name}» в корзину`}
                    className="flex size-10 items-center justify-center rounded-full bg-accent text-accent-foreground shadow-sm transition-shadow hover:shadow-md"
                  >
                    <Plus className="size-5" aria-hidden="true" />
                  </button>
                </div>
              </div>
            </article>
          ))}
        </div>
      </section>

      {/* ------------------------------------------------------------- */}
      {/* About Section */}
      {/* ------------------------------------------------------------- */}
      <section id="about" className="mx-auto max-w-6xl px-4 py-12 sm:px-6 sm:py-16">
        <div className="rounded-3xl bg-secondary px-6 py-10 sm:px-12 sm:py-14">
          <h2 className="mb-3 text-3xl font-extrabold tracking-tight text-secondary-foreground sm:text-4xl">
            О нас
          </h2>
          <p className="max-w-2xl text-pretty text-base leading-relaxed text-secondary-foreground/80 sm:text-lg">
            «Я-пончик» — небольшая пекарня и кулинария, где каждый пончик, пирожок и кусочек
            пиццы готовится вручную из простых и честных ингредиентов. Мы работаем каждый день,
            чтобы вы могли забрать горячий заказ без ожидания. Сделайте заказ и получите его по
            готовности на кассе.
          </p>
        </div>
      </section>

      {/* ------------------------------------------------------------- */}
      {/* Footer */}
      {/* ------------------------------------------------------------- */}
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
              ул. Дзержинского, 130, Челябинск
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
