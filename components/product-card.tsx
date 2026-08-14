'use client'

import Image from 'next/image'
import { Plus } from 'lucide-react'
import { useActiveProduct } from '@/components/active-product-context'
import { BADGE_META, type Product } from '@/lib/products'
import { cn } from '@/lib/utils'

interface ProductCardProps {
  product: Product
  onAddToCart: (product: Product) => void
}

export function ProductCard({ product, onAddToCart }: ProductCardProps) {
  const { activeProduct, previewProduct, clearPreview, pinProduct } = useActiveProduct()
  const isActive = activeProduct?.id === product.id

  return (
    <article
      tabIndex={0}
      onMouseEnter={() => previewProduct(product)}
      onMouseLeave={() => clearPreview(product.id)}
      onFocus={() => previewProduct(product)}
      onBlur={(event) => {
        if (event.currentTarget.contains(event.relatedTarget as Node | null)) return
        clearPreview(product.id)
      }}
      onClick={() => pinProduct(product)}
      aria-current={isActive ? 'true' : undefined}
      onKeyDown={(event) => {
        if (event.key === 'Enter' || event.key === ' ') {
          event.preventDefault()
          pinProduct(product)
        }
      }}
      className={cn(
        'group flex cursor-pointer flex-col overflow-hidden rounded-3xl bg-card shadow-sm outline-none transition-shadow hover:shadow-md focus-visible:ring-2 focus-visible:ring-ring',
        isActive && 'ring-2 ring-primary shadow-md',
      )}
    >
      <div className="relative aspect-square w-full overflow-hidden">
        <Image
          src={product.image}
          alt={product.name}
          fill
          className="object-cover transition-transform duration-300 group-hover:scale-105"
          sizes="(min-width: 1024px) 280px, (min-width: 640px) 45vw, 90vw"
        />

        {product.badges.length > 0 && (
          <ul className="absolute left-3 top-3 z-10 flex max-w-[calc(100%-1.5rem)] flex-wrap gap-1.5">
            {product.badges.map((badge) => {
              const meta = BADGE_META[badge]
              return (
                <li
                  key={badge}
                  className={cn(
                    'rounded-full px-2.5 py-0.5 text-[11px] font-bold leading-5 shadow-sm',
                    meta.className,
                  )}
                >
                  <span aria-hidden="true">{meta.emoji} </span>
                  {meta.label}
                </li>
              )
            })}
          </ul>
        )}
      </div>

      <div className="flex flex-1 flex-col gap-1.5 p-4">
        <h3 className="text-base font-bold text-card-foreground">{product.name}</h3>
        <p className="line-clamp-2 flex-1 text-sm leading-relaxed text-muted-foreground">
          {product.description}
        </p>
        <div className="mt-3 flex items-center justify-between">
          <span className="text-lg font-extrabold text-foreground">{product.price} ₽</span>
          <button
            type="button"
            onClick={(event) => {
              event.stopPropagation()
              onAddToCart(product)
            }}
            aria-label={`Добавить «${product.name}» в корзину`}
            className="flex size-10 items-center justify-center rounded-full bg-accent text-accent-foreground shadow-sm transition-shadow hover:shadow-md"
          >
            <Plus className="size-5" aria-hidden="true" />
          </button>
        </div>
      </div>
    </article>
  )
}
