// Каталог витрины. Поле `badges` позже мапится на колонку `badges text[]` в Supabase.

export type Category = 'Все' | 'Пиццы' | 'Пирожки' | 'Десерты'

export type ProductBadge = 'spicy' | 'meatless' | 'new'

export interface Product {
  id: number
  name: string
  description: string
  price: number
  category: Exclude<Category, 'Все'>
  image: string
  badges: ProductBadge[]
}

export const CATEGORIES: Category[] = ['Все', 'Пиццы', 'Пирожки', 'Десерты']

export const BADGE_META: Record<
  ProductBadge,
  { label: string; className: string; emoji: string }
> = {
  spicy: {
    label: 'Острое',
    emoji: '🌶️',
    className: 'bg-red-500 text-white',
  },
  meatless: {
    label: 'Без мяса',
    emoji: '🌿',
    className: 'bg-emerald-500 text-white',
  },
  new: {
    label: 'Новинка',
    emoji: '✨',
    className: 'bg-accent text-accent-foreground',
  },
}

export const PRODUCTS: Product[] = [
  {
    id: 1,
    name: 'Пицца Маргарита',
    description: 'Томатный соус, моцарелла, свежий базилик',
    price: 420,
    category: 'Пиццы',
    image: '/images/product-pizza.png',
    badges: ['meatless'],
  },
  {
    id: 2,
    name: 'Пицца Пепперони',
    description: 'Острая пепперони и плавленый сыр',
    price: 460,
    category: 'Пиццы',
    image: '/images/product-pizza-pepperoni.png',
    badges: ['spicy'],
  },
  {
    id: 3,
    name: 'Пончик классический',
    description: 'Нежное тесто с розовой глазурью и посыпкой',
    price: 89,
    category: 'Десерты',
    image: '/images/product-donut-classic.png',
    badges: ['meatless'],
  },
  {
    id: 4,
    name: 'Пончик шоколадный',
    description: 'Шоколадная глазурь и шоколадная крошка',
    price: 95,
    category: 'Десерты',
    image: '/images/product-donut-chocolate.png',
    badges: ['meatless', 'new'],
  },
  {
    id: 5,
    name: 'Пирожок с мясом',
    description: 'Сочная мясная начинка в золотистом тесте',
    price: 110,
    category: 'Пирожки',
    image: '/images/product-pirozhok.png',
    badges: [],
  },
  {
    id: 6,
    name: 'Синнабон с корицей',
    description: 'Булочка с корицей и кремовой глазурью',
    price: 150,
    category: 'Десерты',
    image: '/images/product-cinnamon-roll.png',
    badges: ['meatless', 'new'],
  },
]
