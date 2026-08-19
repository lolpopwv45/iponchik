import { getSupabaseUrl } from '@/lib/supabase/env'
import type { Product } from '@/lib/products'

const PRODUCT_IMAGES_PREFIX = '/storage/v1/object/public/product-images/'

export function isAllowedStorageUrl(url: string) {
  const origin = getSupabaseUrl()
  if (!origin) return false
  try {
    const parsed = new URL(url)
    const allowed = new URL(origin)
    return (
      !parsed.username &&
      !parsed.password &&
      parsed.origin === allowed.origin &&
      (parsed.protocol === 'https:' || parsed.protocol === 'http:') &&
      parsed.pathname.startsWith(PRODUCT_IMAGES_PREFIX)
    )
  } catch {
    return false
  }
}

export function toProxiedImageUrl(url: string) {
  if (!url || url.startsWith('/') || !isAllowedStorageUrl(url)) return url
  return `/api/media?u=${encodeURIComponent(url)}`
}

export function withProxiedProductImages(products: Product[]) {
  return products.map((product) => ({
    ...product,
    image: toProxiedImageUrl(product.image),
  }))
}
