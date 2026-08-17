import type { ProductBadge } from '@/lib/products'

export interface CartItem {
  id: number
  name: string
  price: number
  image: string
  quantity: number
  badges: ProductBadge[]
}
