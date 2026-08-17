'use client'

import Image from 'next/image'
import { Check, Plus } from 'lucide-react'
import { useEffect, useRef, useState } from 'react'
import { useActiveProduct } from '@/components/active-product-context'
import { BADGE_META, type Product } from '@/lib/products'
import { cn } from '@/lib/utils'

interface ProductCardProps {
  product: Product
  onAddToCart: (product: Product) => void
}

export function ProductCard({ product, onAddToCart }: ProductCardProps) {
  const { activeProduct, pinProduct } = useActiveProduct()
  const isActive = activeProduct?.id === product.id
  const [justAdded, setJustAdded] = useState(false)
  const [addPopKey, setAddPopKey] = useState(0)
  const addedTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => {
    return () => {
      if (addedTimeoutRef.current) clearTimeout(addedTimeoutRef.current)
    }
  }, [])

  function handleAddToCart(event: React.MouseEvent<HTMLButtonElement>) {
    event.stopPropagation()
    onAddToCart(product)
    setJustAdded(true)
    setAddPopKey((key) => key + 1)
    if (addedTimeoutRef.current) clearTimeout(addedTimeoutRef.current)
    addedTimeoutRef.current = setTimeout(() => setJustAdded(false), 700)
  }

  return (
    <article
      tabIndex={0}
      onClick={() => pinProduct(product)}
      aria-current={isActive ? 'true' : undefined}
      onKeyDown={(event) => {
        if (event.key === 'Enter' || event.key === ' ') {
          event.preventDefault()
          pinProduct(product)
        }
      }}
      className={cn(
        'group flex cursor-pointer flex-col overflow-hidden rounded-2xl bg-card shadow-sm outline-none transition-shadow hover:shadow-md focus-visible:ring-2 focus-visible:ring-ring sm:rounded-3xl',
        isActive && 'ring-2 ring-primary shadow-md',
      )}
    >
      <div className="relative aspect-square w-full overflow-hidden">
        <Image
          src={product.image}
          alt={product.name}
          fill
          className="object-cover transition-transform duration-300 group-hover:scale-105"
          sizes="(min-width: 1024px) 280px, (min-width: 640px) 45vw, 46vw"
        />

        {product.badges.length > 0 && (
          <ul className="absolute left-2 top-2 z-10 flex max-w-[calc(100%-1rem)] flex-wrap gap-1 sm:left-3 sm:top-3 sm:gap-1.5">
            {product.badges.map((badge) => {
              const meta = BADGE_META[badge]
              return (
                <li
                  key={badge}
                  className={cn(
                    'rounded-full px-1.5 py-0.5 text-[10px] font-bold leading-4 shadow-sm sm:px-2.5 sm:text-[11px] sm:leading-5',
                    meta.className,
                  )}
                >
                  <span aria-hidden="true">{meta.emoji}</span>
                  <span className="hidden sm:inline"> {meta.label}</span>
                  <span className="sr-only sm:hidden"> {meta.label}</span>
                </li>
              )
            })}
          </ul>
        )}
      </div>

      <div className="flex flex-1 flex-col gap-1 p-2.5 sm:gap-1.5 sm:p-4">
        <h3 className="line-clamp-2 text-sm font-bold leading-snug text-card-foreground sm:text-base">
          {product.name}
        </h3>
        <p className="hidden line-clamp-2 flex-1 text-sm leading-relaxed text-muted-foreground sm:block">
          {product.description}
        </p>
        <div className="mt-auto flex items-center justify-between gap-1.5 pt-2">
          <span className="text-base font-extrabold tabular-nums text-foreground sm:text-lg">
            {product.price} ₽
          </span>
          <button
            type="button"
            onClick={handleAddToCart}
            aria-label={
              justAdded
                ? `«${product.name}» добавлен в корзину`
                : `Добавить «${product.name}» в корзину`
            }
            className={cn(
              'flex size-11 shrink-0 items-center justify-center rounded-full shadow-sm transition-[background-color,box-shadow] hover:shadow-md sm:size-10',
              justAdded
                ? 'bg-primary text-primary-foreground'
                : 'bg-accent text-accent-foreground',
            )}
          >
            <span key={addPopKey} className={cn('flex', addPopKey > 0 && 'animate-add-pop')}>
              {justAdded ? (
                <Check className="size-5" aria-hidden="true" />
              ) : (
                <Plus className="size-5" aria-hidden="true" />
              )}
            </span>
          </button>
        </div>
      </div>
    </article>
  )
}
