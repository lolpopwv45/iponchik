// Каталог витрины. Поле `badges` позже мапится на колонку `badges text[]` в Supabase.

export type Category = 'Все' | 'Пиццы' | 'Пирожки' | 'Десерты'

export type ProductBadge = 'spicy' | 'meatless' | 'new' | 'frozen'

export interface ProductNutrition {
  proteins: number
  fats: number
  carbs: number
  calories: number
}

export interface Product {
  id: number
  name: string
  description: string
  price: number
  weight: string
  category: Exclude<Category, 'Все'>
  image: string
  badges: ProductBadge[]
  nutrition: ProductNutrition
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
  frozen: {
    label: 'Заморозка',
    emoji: '❄️',
    className: 'bg-sky-400 text-white',
  },
}

export const PRODUCTS: Product[] = [
  {
    id: 1,
    name: 'Пицца Маргарита',
    description: 'Томатный соус, моцарелла, свежий базилик',
    price: 420,
    weight: '450 г.',
    category: 'Пиццы',
    image: '/images/product-pizza.png',
    badges: ['meatless'],
    nutrition: { proteins: 11.50, fats: 9.80, carbs: 28.40, calories: 248.00 },
  },
  {
    id: 2,
    name: 'Пицца Пепперони',
    description: 'Острая пепперони и плавленый сыр',
    price: 460,
    weight: '480 г.',
    category: 'Пиццы',
    image: '/images/product-pizza-pepperoni.png',
    badges: ['spicy'],
    nutrition: { proteins: 13.20, fats: 14.50, carbs: 26.10, calories: 288.40 },
  },
  {
    id: 3,
    name: 'Пончик классический',
    description: 'Нежное тесто с розовой глазурью и посыпкой',
    price: 89,
    weight: '70 г.',
    category: 'Десерты',
    image: '/images/product-donut-classic.png',
    badges: ['meatless'],
    nutrition: { proteins: 5.40, fats: 18.20, carbs: 48.50, calories: 377.00 },
  },
  {
    id: 4,
    name: 'Пончик шоколадный',
    description: 'Шоколадная глазурь и шоколадная крошка',
    price: 95,
    weight: '75 г.',
    category: 'Десерты',
    image: '/images/product-donut-chocolate.png',
    badges: ['meatless', 'new'],
    nutrition: { proteins: 5.80, fats: 19.40, carbs: 49.20, calories: 392.60 },
  },
  {
    id: 5,
    name: 'Пирожок с мясом',
    description: 'Сочная мясная начинка в золотистом тесте',
    price: 110,
    weight: '90 г.',
    category: 'Пирожки',
    image: '/images/product-pirozhok.png',
    badges: [],
    nutrition: { proteins: 10.10, fats: 12.30, carbs: 32.80, calories: 281.00 },
  },
  {
    id: 6,
    name: 'Синнабон с корицей',
    description: 'Булочка с корицей и кремовой глазурью',
    price: 150,
    weight: '140 г.',
    category: 'Десерты',
    image: '/images/product-cinnamon-roll.png',
    badges: ['meatless', 'new'],
    nutrition: { proteins: 6.20, fats: 16.80, carbs: 52.40, calories: 384.00 },
  },
]
