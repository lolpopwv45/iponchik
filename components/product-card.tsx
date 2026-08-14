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
            onClick={handleAddToCart}
            aria-label={
              justAdded
                ? `«${product.name}» добавлен в корзину`
                : `Добавить «${product.name}» в корзину`
            }
            className={cn(
              'flex size-10 items-center justify-center rounded-full shadow-sm transition-[background-color,box-shadow] hover:shadow-md',
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
