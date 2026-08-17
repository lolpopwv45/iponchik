// Каталог витрины. Поле `badges` мапится на колонку `badges text[]` в Supabase.

export const ALL_CATEGORY = 'Все'

export type ProductBadge = 'spicy' | 'meatless' | 'new' | 'frozen'

export interface ProductNutrition {
  proteins: number
  fats: number
  carbs: number
  calories: number
}

export interface MenuCategory {
  id: number
  name: string
  sortOrder: number
}

export interface Product {
  id: number
  name: string
  description: string
  price: number
  weightGrams: number
  weight: string
  categoryId: number
  category: string
  image: string
  badges: ProductBadge[]
  nutrition: ProductNutrition
  inStock: boolean
  sortOrder: number
}

export const FALLBACK_CATEGORIES: MenuCategory[] = [
  { id: 1, name: 'Пиццы', sortOrder: 10 },
  { id: 2, name: 'Пирожки', sortOrder: 20 },
  { id: 3, name: 'Десерты', sortOrder: 30 },
]

export const CATEGORIES = [ALL_CATEGORY, ...FALLBACK_CATEGORIES.map((category) => category.name)]

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

export const PRODUCT_BADGES = Object.keys(BADGE_META) as ProductBadge[]

export function formatWeight(grams: number) {
  return `${grams} г.`
}

export function isProductBadge(value: unknown): value is ProductBadge {
  return typeof value === 'string' && value in BADGE_META
}

function product(input: Omit<Product, 'weight'>): Product {
  return { ...input, weight: formatWeight(input.weightGrams) }
}

export const PRODUCTS: Product[] = [
  product({
    id: 1,
    name: 'Пицца Маргарита',
    description: 'Томатный соус, моцарелла, свежий базилик',
    price: 420,
    weightGrams: 450,
    categoryId: 1,
    category: 'Пиццы',
    image: '/images/product-pizza.png',
    badges: ['meatless'],
    nutrition: { proteins: 11.5, fats: 9.8, carbs: 28.4, calories: 248 },
    inStock: true,
    sortOrder: 10,
  }),
  product({
    id: 2,
    name: 'Пицца Пепперони',
    description: 'Острая пепперони и плавленый сыр',
    price: 460,
    weightGrams: 480,
    categoryId: 1,
    category: 'Пиццы',
    image: '/images/product-pizza-pepperoni.png',
    badges: ['spicy'],
    nutrition: { proteins: 13.2, fats: 14.5, carbs: 26.1, calories: 288.4 },
    inStock: true,
    sortOrder: 20,
  }),
  product({
    id: 3,
    name: 'Пирожок с мясом',
    description: 'Сочная мясная начинка в золотистом тесте',
    price: 110,
    weightGrams: 90,
    categoryId: 2,
    category: 'Пирожки',
    image: '/images/product-pirozhok.png',
    badges: [],
    nutrition: { proteins: 10.1, fats: 12.3, carbs: 32.8, calories: 281 },
    inStock: true,
    sortOrder: 10,
  }),
  product({
    id: 4,
    name: 'Пончик классический',
    description: 'Нежное тесто с розовой глазурью и посыпкой',
    price: 89,
    weightGrams: 70,
    categoryId: 3,
    category: 'Десерты',
    image: '/images/product-donut-classic.png',
    badges: ['meatless'],
    nutrition: { proteins: 5.4, fats: 18.2, carbs: 48.5, calories: 377 },
    inStock: true,
    sortOrder: 10,
  }),
  product({
    id: 5,
    name: 'Пончик шоколадный',
    description: 'Шоколадная глазурь и шоколадная крошка',
    price: 95,
    weightGrams: 75,
    categoryId: 3,
    category: 'Десерты',
    image: '/images/product-donut-chocolate.png',
    badges: ['meatless', 'new'],
    nutrition: { proteins: 5.8, fats: 19.4, carbs: 49.2, calories: 392.6 },
    inStock: true,
    sortOrder: 20,
  }),
  product({
    id: 6,
    name: 'Синнабон с корицей',
    description: 'Булочка с корицей и кремовой глазурью',
    price: 150,
    weightGrams: 140,
    categoryId: 3,
    category: 'Десерты',
    image: '/images/product-cinnamon-roll.png',
    badges: ['meatless', 'new'],
    nutrition: { proteins: 6.2, fats: 16.8, carbs: 52.4, calories: 384 },
    inStock: true,
    sortOrder: 30,
  }),
]
