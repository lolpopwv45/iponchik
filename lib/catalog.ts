import {
  FALLBACK_CATEGORIES,
  PRODUCTS,
  formatWeight,
  isProductBadge,
  type MenuCategory,
  type Product,
  type ProductBadge,
  type ProductNutrition,
} from '@/lib/products'
import { getSupabase } from '@/lib/supabase'

export const PRODUCT_IMAGES_BUCKET = 'product-images'
export const MAX_PRODUCT_IMAGE_BYTES = 5 * 1024 * 1024
export const PRODUCT_IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'] as const

const SUPABASE_MISSING = 'Не заданы NEXT_PUBLIC_SUPABASE_URL и NEXT_PUBLIC_SUPABASE_ANON_KEY'

export interface Catalog {
  categories: MenuCategory[]
  products: Product[]
}

export interface ProductInput {
  name: string
  description: string
  categoryId: number
  price: number
  inStock: boolean
  imageUrl: string
  weightGrams: number
  nutrition: ProductNutrition
  badges: ProductBadge[]
  sortOrder?: number
}

export interface CategoryInput {
  name: string
  sortOrder?: number
}

function requireSupabase() {
  const supabase = getSupabase()
  if (!supabase) throw new Error(SUPABASE_MISSING)
  return supabase
}

function asNumber(value: unknown, fallback = 0) {
  const parsed = Number(value)
  return Number.isFinite(parsed) ? parsed : fallback
}

function asId(value: unknown) {
  const parsed = asNumber(value, Number.NaN)
  if (!Number.isFinite(parsed)) throw new Error('Некорректный идентификатор')
  return parsed
}

function parseBadges(value: unknown): ProductBadge[] {
  if (!Array.isArray(value)) return []
  return value.filter(isProductBadge)
}

function mapCategory(row: Record<string, unknown>): MenuCategory {
  return {
    id: asId(row.id),
    name: String(row.name ?? '').trim(),
    sortOrder: asNumber(row.sort_order),
  }
}

function joinedCategoryName(value: unknown) {
  if (Array.isArray(value) && value[0] && typeof value[0] === 'object' && 'name' in value[0]) {
    return String((value[0] as { name?: unknown }).name ?? '')
  }
  if (value && typeof value === 'object' && 'name' in value) {
    return String((value as { name?: unknown }).name ?? '')
  }
  return ''
}

function mapProduct(row: Record<string, unknown>): Product {
  const categoryName = joinedCategoryName(row.category) || String(row.category_name ?? '')
  const weightGrams = Math.max(1, Math.round(asNumber(row.weight_grams, 1)))

  return {
    id: asId(row.id),
    name: String(row.name ?? '').trim(),
    description: String(row.description ?? ''),
    price: Math.max(0, Math.round(asNumber(row.price))),
    weightGrams,
    weight: formatWeight(weightGrams),
    categoryId: asId(row.category_id),
    category: categoryName.trim() || 'Без категории',
    image: String(row.image_url ?? '') || '/placeholder.svg',
    badges: parseBadges(row.badges),
    nutrition: {
      proteins: asNumber(row.proteins),
      fats: asNumber(row.fats),
      carbs: asNumber(row.carbs),
      calories: asNumber(row.calories),
    },
    inStock: row.in_stock !== false,
    sortOrder: asNumber(row.sort_order),
  }
}

function catalogError(error: { message: string; code?: string }) {
  if (error.code === '23505') return 'Категория с таким названием уже есть'
  if (error.code === '23503') return 'Нельзя удалить категорию, пока в ней есть товары'
  if (error.code === '23514') return 'Проверьте цену, вес и пищевую ценность — значения должны быть неотрицательными'
  return error.message
}

function nextSortOrder(items: { sortOrder: number }[]) {
  return items.reduce((max, item) => Math.max(max, item.sortOrder), 0) + 10
}

export function fallbackCatalog(): Catalog {
  return {
    categories: FALLBACK_CATEGORIES,
    products: PRODUCTS,
  }
}

export function sortCatalog(catalog: Catalog): Catalog {
  const categories = [...catalog.categories].sort(
    (left, right) => left.sortOrder - right.sortOrder || left.name.localeCompare(right.name, 'ru'),
  )
  const categoryRank = new Map(categories.map((category, index) => [category.id, index]))
  const products = [...catalog.products].sort((left, right) => {
    const byCategory =
      (categoryRank.get(left.categoryId) ?? 999) - (categoryRank.get(right.categoryId) ?? 999)
    if (byCategory !== 0) return byCategory
    return left.sortOrder - right.sortOrder || left.name.localeCompare(right.name, 'ru')
  })
  return { categories, products }
}

export async function fetchCatalog(): Promise<Catalog> {
  const supabase = requireSupabase()

  const [categoriesResult, productsResult] = await Promise.all([
    supabase.from('categories').select('id, name, sort_order').order('sort_order').order('name'),
    supabase
      .from('products')
      .select(
        'id, name, description, category_id, price, in_stock, image_url, weight_grams, proteins, fats, carbs, calories, badges, sort_order, category:categories(name)',
      )
      .order('sort_order')
      .order('name'),
  ])

  if (categoriesResult.error) throw new Error(catalogError(categoriesResult.error))
  if (productsResult.error) throw new Error(catalogError(productsResult.error))

  return sortCatalog({
    categories: (categoriesResult.data ?? []).map((row) => mapCategory(row as Record<string, unknown>)),
    products: (productsResult.data ?? []).map((row) => mapProduct(row as Record<string, unknown>)),
  })
}

export function subscribeCatalog(onChange: () => void) {
  const supabase = getSupabase()
  if (!supabase) return () => {}

  const channel = supabase
    .channel(`catalog-${crypto.randomUUID()}`)
    .on('postgres_changes', { event: '*', schema: 'public', table: 'categories' }, onChange)
    .on('postgres_changes', { event: '*', schema: 'public', table: 'products' }, onChange)
    .subscribe()

  return () => {
    void supabase.removeChannel(channel)
  }
}

export function normalizeCategoryName(name: string) {
  return name.trim().replace(/\s+/g, ' ')
}

export function validateCategoryName(name: string) {
  const normalized = normalizeCategoryName(name)
  if (normalized.length < 2) throw new Error('Название категории слишком короткое')
  if (normalized.length > 40) throw new Error('Название категории не длиннее 40 символов')
  if (normalized.toLocaleLowerCase('ru-RU') === 'все') {
    throw new Error('Название «Все» зарезервировано для фильтра на витрине')
  }
  return normalized
}

export async function createCategory(input: CategoryInput, existing: MenuCategory[] = []) {
  const supabase = requireSupabase()
  const name = validateCategoryName(input.name)
  const sortOrder = input.sortOrder ?? nextSortOrder(existing)

  const { data, error } = await supabase
    .from('categories')
    .insert({ name, sort_order: sortOrder })
    .select('id, name, sort_order')
    .single()

  if (error || !data) throw new Error(error ? catalogError(error) : 'Не удалось создать категорию')
  return mapCategory(data as Record<string, unknown>)
}

export async function updateCategory(id: number, input: CategoryInput) {
  const supabase = requireSupabase()
  const patch: Record<string, unknown> = {}
  if (input.name !== undefined) patch.name = validateCategoryName(input.name)
  if (input.sortOrder !== undefined) patch.sort_order = input.sortOrder

  const { data, error } = await supabase
    .from('categories')
    .update(patch)
    .eq('id', id)
    .select('id, name, sort_order')
    .single()

  if (error || !data) throw new Error(error ? catalogError(error) : 'Не удалось сохранить категорию')
  return mapCategory(data as Record<string, unknown>)
}

export async function deleteCategory(id: number) {
  const supabase = requireSupabase()
  const { error } = await supabase.from('categories').delete().eq('id', id)
  if (error) throw new Error(catalogError(error))
}

function toProductRow(input: ProductInput, sortOrder: number) {
  return {
    name: input.name.trim(),
    description: input.description.trim(),
    category_id: input.categoryId,
    price: Math.round(input.price),
    in_stock: input.inStock,
    image_url: input.imageUrl.trim(),
    weight_grams: Math.round(input.weightGrams),
    proteins: input.nutrition.proteins,
    fats: input.nutrition.fats,
    carbs: input.nutrition.carbs,
    calories: input.nutrition.calories,
    badges: input.badges,
    sort_order: sortOrder,
  }
}

export function validateProductInput(input: ProductInput) {
  if (!input.name.trim()) throw new Error('Укажите название товара')
  if (!input.description.trim()) throw new Error('Добавьте описание — его увидят гости в карточке')
  if (!input.categoryId) throw new Error('Выберите категорию')
  if (!Number.isFinite(input.price) || input.price < 0) throw new Error('Цена не может быть отрицательной')
  if (!Number.isFinite(input.weightGrams) || input.weightGrams < 1) {
    throw new Error('Укажите вес в граммах')
  }
  if (!input.imageUrl.trim()) throw new Error('Добавьте фото товара')
  const nutrition = input.nutrition
  if ([nutrition.proteins, nutrition.fats, nutrition.carbs, nutrition.calories].some((value) => value < 0)) {
    throw new Error('Пищевая ценность не может быть отрицательной')
  }
}

export async function createProduct(input: ProductInput, existing: Product[] = []) {
  validateProductInput(input)
  const supabase = requireSupabase()
  const sortOrder = input.sortOrder ?? nextSortOrder(existing)

  const { data, error } = await supabase
    .from('products')
    .insert(toProductRow(input, sortOrder))
    .select(
      'id, name, description, category_id, price, in_stock, image_url, weight_grams, proteins, fats, carbs, calories, badges, sort_order, category:categories(name)',
    )
    .single()

  if (error || !data) throw new Error(error ? catalogError(error) : 'Не удалось создать товар')
  return mapProduct(data as Record<string, unknown>)
}

export async function updateProduct(id: number, input: ProductInput) {
  validateProductInput(input)
  const supabase = requireSupabase()
  const sortOrder = input.sortOrder ?? 0

  const { data, error } = await supabase
    .from('products')
    .update(toProductRow(input, sortOrder))
    .eq('id', id)
    .select(
      'id, name, description, category_id, price, in_stock, image_url, weight_grams, proteins, fats, carbs, calories, badges, sort_order, category:categories(name)',
    )
    .single()

  if (error || !data) throw new Error(error ? catalogError(error) : 'Не удалось сохранить товар')
  return mapProduct(data as Record<string, unknown>)
}

export async function updateProductStock(id: number, inStock: boolean) {
  const supabase = requireSupabase()
  const { error } = await supabase.from('products').update({ in_stock: inStock }).eq('id', id)
  if (error) throw new Error(catalogError(error))
}

export async function deleteProduct(id: number) {
  const supabase = requireSupabase()
  const { error } = await supabase.from('products').delete().eq('id', id)
  if (error) throw new Error(catalogError(error))
}

export function isStoredProductImage(url: string) {
  return url.includes(`/storage/v1/object/public/${PRODUCT_IMAGES_BUCKET}/`)
}

export async function deleteStoredProductImage(url: string) {
  if (!isStoredProductImage(url)) return
  const marker = `/storage/v1/object/public/${PRODUCT_IMAGES_BUCKET}/`
  const path = decodeURIComponent(url.split(marker)[1] ?? '')
  if (!path) return

  const supabase = getSupabase()
  if (!supabase) return
  await supabase.storage.from(PRODUCT_IMAGES_BUCKET).remove([path])
}

function extensionFor(file: File) {
  const fromName = file.name.split('.').pop()?.toLowerCase()
  if (fromName === 'jpg' || fromName === 'jpeg') return 'jpg'
  if (fromName === 'png' || fromName === 'webp' || fromName === 'gif') return fromName
  if (file.type === 'image/png') return 'png'
  if (file.type === 'image/webp') return 'webp'
  if (file.type === 'image/gif') return 'gif'
  return 'jpg'
}

export function validateProductImage(file: File) {
  if (!PRODUCT_IMAGE_TYPES.includes(file.type as (typeof PRODUCT_IMAGE_TYPES)[number]) && !file.type.startsWith('image/')) {
    throw new Error('Можно загрузить только изображение (JPG, PNG, WEBP или GIF)')
  }
  if (file.size > MAX_PRODUCT_IMAGE_BYTES) {
    throw new Error('Фото не должно быть больше 5 МБ')
  }
}

export async function uploadProductImage(file: File) {
  validateProductImage(file)
  const supabase = requireSupabase()
  const path = `products/${crypto.randomUUID()}.${extensionFor(file)}`
  const { error } = await supabase.storage.from(PRODUCT_IMAGES_BUCKET).upload(path, file, {
    cacheControl: '3600',
    upsert: false,
    contentType: file.type || 'image/jpeg',
  })
  if (error) throw new Error(error.message || 'Не удалось загрузить фото')

  const { data } = supabase.storage.from(PRODUCT_IMAGES_BUCKET).getPublicUrl(path)
  return data.publicUrl
}
