'use client'

import Image from 'next/image'
import { Info, Minus, Plus, Snowflake, X } from 'lucide-react'
import { useEffect, useId, useRef, useState, type Dispatch, type SetStateAction } from 'react'
import type { Product, ProductBadge, ProductNutrition } from '@/lib/products'
import { cn } from '@/lib/utils'

export type { ProductNutrition }
export type ProductDetailBadge = ProductBadge

export interface ProductDetail {
  title: string
  price: number
  weight: string
  description: string
  badges: ProductDetailBadge[]
  imageUrl: string
  nutrition: ProductNutrition
}

export interface ProductDetailModalProps {
  product: ProductDetail | null
  open: boolean
  onClose: () => void
  onAddToCart?: (product: ProductDetail, quantity: number) => void
}

const NUTRITION_ITEMS: {
  key: keyof ProductNutrition
  label: string
  unit: string
}[] = [
  { key: 'proteins', label: 'Белки', unit: ' г' },
  { key: 'fats', label: 'Жиры', unit: ' г' },
  { key: 'carbs', label: 'Углеводы', unit: ' г' },
  { key: 'calories', label: 'Ккал', unit: '' },
]

function formatNutrient(value: number) {
  return value.toFixed(2)
}

export function toProductDetail(product: Product): ProductDetail {
  return {
    title: product.name,
    price: product.price,
    weight: product.weight,
    description: product.description,
    badges: product.badges,
    imageUrl: product.image,
    nutrition: product.nutrition,
  }
}

export function ProductDetailModal({
  product,
  open,
  onClose,
  onAddToCart,
}: ProductDetailModalProps) {
  const titleId = useId()
  const [quantity, setQuantity] = useState(1)
  const showNew = product?.badges.includes('new') ?? false
  const showFrozen = product?.badges.includes('frozen') ?? false

  useEffect(() => {
    if (open) setQuantity(1)
  }, [open, product?.title])

  useEffect(() => {
    if (!open) return

    const previousOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'

    function onKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') onClose()
    }

    window.addEventListener('keydown', onKeyDown)
    return () => {
      document.body.style.overflow = previousOverflow
      window.removeEventListener('keydown', onKeyDown)
    }
  }, [open, onClose])

  if (!product) return null

  const detail = product

  function handleAddToCart() {
    onAddToCart?.(detail, quantity)
    onClose()
  }

  return (
    <div
      className={cn(
        'fixed inset-0 z-[70] flex items-end justify-center sm:items-center sm:p-10',
        open ? 'visible' : 'invisible pointer-events-none',
      )}
      aria-hidden={!open}
    >
      <div
        onClick={onClose}
        aria-hidden="true"
        className={cn(
          'absolute inset-0 bg-foreground/40 transition-opacity duration-300',
          open ? 'opacity-100' : 'opacity-0',
        )}
      />

      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        className={cn(
          'relative z-10 flex max-h-[92dvh] w-full max-w-[920px] flex-col transition-all duration-300',
          open
            ? 'translate-y-0 scale-100 opacity-100'
            : 'translate-y-8 scale-100 opacity-0 sm:translate-y-2 sm:scale-[0.98]',
        )}
      >
        <div className="flex max-h-[92dvh] flex-col overflow-hidden rounded-t-3xl bg-card text-card-foreground shadow-xl sm:rounded-3xl">
          <div className="mx-auto mt-2 hidden h-1.5 w-12 shrink-0 rounded-full bg-border max-sm:block" />

          <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain">
            <div className="grid grid-cols-1 md:grid-cols-2 md:items-stretch">
              <div className="relative isolate aspect-[16/10] overflow-hidden bg-muted sm:aspect-[4/3] md:aspect-auto md:h-full md:min-h-[28rem]">
                <Image
                  src={product.imageUrl || '/placeholder.svg'}
                  alt={product.title}
                  fill
                  className="object-cover object-center"
                  sizes="(min-width: 768px) 460px, 100vw"
                />

                <button
                  type="button"
                  onClick={onClose}
                  aria-label="Закрыть"
                  className="absolute right-3 top-3 z-20 flex size-11 items-center justify-center rounded-full bg-card/95 text-muted-foreground shadow-md transition-colors hover:bg-secondary hover:text-foreground sm:hidden"
                >
                  <X className="size-5" strokeWidth={1.75} aria-hidden="true" />
                </button>

                {(showNew || showFrozen) && (
                  <div className="absolute left-4 top-4 z-10 flex flex-col items-start gap-2">
                    {showNew && (
                      <span className="relative inline-flex items-center rounded-[8px] bg-[#4CAF50] px-2 py-1 text-[11px] font-extrabold uppercase leading-none tracking-wide text-white shadow-sm">
                        Новинка!
                        <span
                          aria-hidden="true"
                          className="absolute left-2 top-full h-0 w-0 border-x-[5px] border-t-[6px] border-x-transparent border-t-[#4CAF50]"
                        />
                      </span>
                    )}
                    {showFrozen && (
                      <span className="flex size-8 items-center justify-center rounded-full bg-[#03A9F4] text-white shadow-sm">
                        <Snowflake className="size-4" strokeWidth={2.25} aria-hidden="true" />
                        <span className="sr-only">Замороженный продукт</span>
                      </span>
                    )}
                  </div>
                )}
              </div>

              <div className="flex flex-col px-5 pb-5 pt-4 sm:px-8 sm:py-8 md:min-h-[28rem]">
                <div className="flex items-start gap-2">
                  <h2
                    id={titleId}
                    className="text-xl font-extrabold leading-tight tracking-tight text-card-foreground sm:text-3xl"
                  >
                    {product.title}
                  </h2>
                  <NutritionTooltip nutrition={product.nutrition} />
                </div>

                <p className="mt-1 text-sm font-semibold text-muted-foreground">{product.weight}</p>

                <p className="mt-4 flex-1 text-pretty text-[15px] leading-relaxed text-muted-foreground">
                  {product.description}
                </p>

                <div className="mt-6 hidden items-center gap-3 sm:flex sm:gap-4">
                  <span className="shrink-0 text-2xl font-extrabold tabular-nums tracking-tight text-foreground">
                    {product.price} ₽
                  </span>

                  <QuantityStepper quantity={quantity} onChange={setQuantity} />

                  <button
                    type="button"
                    onClick={handleAddToCart}
                    className="h-11 min-w-0 flex-1 rounded-full bg-primary px-5 text-sm font-bold text-primary-foreground shadow-sm transition-shadow hover:shadow-md"
                  >
                    В корзину
                  </button>
                </div>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-3 border-t border-border bg-card px-4 py-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] sm:hidden">
            <div className="min-w-0">
              <p className="text-lg font-extrabold tabular-nums leading-none text-foreground">
                {product.price * quantity} ₽
              </p>
              {quantity > 1 ? (
                <p className="mt-0.5 text-[11px] font-semibold text-muted-foreground">
                  {product.price} ₽ × {quantity}
                </p>
              ) : null}
            </div>
            <QuantityStepper quantity={quantity} onChange={setQuantity} />
            <button
              type="button"
              onClick={handleAddToCart}
              className="h-12 min-w-0 flex-1 rounded-full bg-primary px-4 text-sm font-bold text-primary-foreground shadow-sm"
            >
              В корзину
            </button>
          </div>
        </div>

        <button
          type="button"
          onClick={onClose}
          aria-label="Закрыть"
          className="absolute -right-3 -top-3 z-20 hidden size-10 items-center justify-center rounded-full bg-card text-muted-foreground shadow-md transition-colors hover:bg-secondary hover:text-foreground sm:flex"
        >
          <X className="size-5" strokeWidth={1.75} aria-hidden="true" />
        </button>
      </div>
    </div>
  )
}

function QuantityStepper({
  quantity,
  onChange,
}: {
  quantity: number
  onChange: Dispatch<SetStateAction<number>>
}) {
  return (
    <div className="flex shrink-0 items-center gap-1 rounded-full bg-secondary p-1">
      <button
        type="button"
        onClick={() => onChange((value) => Math.max(1, value - 1))}
        disabled={quantity <= 1}
        aria-label="Уменьшить количество"
        className="flex size-10 items-center justify-center rounded-full text-secondary-foreground transition-colors hover:bg-card disabled:cursor-not-allowed disabled:opacity-40 sm:size-8"
      >
        <Minus className="size-4 sm:size-3.5" aria-hidden="true" />
      </button>
      <span className="w-6 text-center text-sm font-bold tabular-nums text-secondary-foreground">
        {quantity}
      </span>
      <button
        type="button"
        onClick={() => onChange((value) => value + 1)}
        aria-label="Увеличить количество"
        className="flex size-10 items-center justify-center rounded-full text-secondary-foreground transition-colors hover:bg-card sm:size-8"
      >
        <Plus className="size-4 sm:size-3.5" aria-hidden="true" />
      </button>
    </div>
  )
}

function NutritionTooltip({ nutrition }: { nutrition: ProductNutrition }) {
  const rootRef = useRef<HTMLDivElement>(null)
  const [open, setOpen] = useState(false)

  useEffect(() => {
    if (!open) return

    function handlePointerDown(event: PointerEvent) {
      if (!rootRef.current?.contains(event.target as Node)) {
        setOpen(false)
      }
    }

    document.addEventListener('pointerdown', handlePointerDown)
    return () => document.removeEventListener('pointerdown', handlePointerDown)
  }, [open])

  return (
    <div ref={rootRef} className="group/tooltip relative mt-1.5 shrink-0">
      <button
        type="button"
        aria-label="Пищевая ценность"
        aria-expanded={open}
        onClick={() => setOpen((value) => !value)}
        className="flex size-8 items-center justify-center rounded-full border border-border text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring sm:size-6"
      >
        <Info className="size-3.5" strokeWidth={2} aria-hidden="true" />
      </button>

      <div
        role="tooltip"
        className={cn(
          'absolute right-0 top-full z-30 mt-2 w-[min(calc(100vw-2.5rem),340px)] origin-top-right rounded-2xl bg-popover p-3.5 text-popover-foreground shadow-lg ring-1 ring-border transition-all duration-200',
          open
            ? 'visible scale-100 opacity-100'
            : 'invisible scale-95 opacity-0 group-hover/tooltip:visible group-hover/tooltip:scale-100 group-hover/tooltip:opacity-100 group-focus-within/tooltip:visible group-focus-within/tooltip:scale-100 group-focus-within/tooltip:opacity-100',
        )}
      >
        <p className="mb-3 text-[13px] font-medium text-muted-foreground">Пищевая ценность на 100 г.</p>
        <div className="grid grid-cols-4 gap-3">
          {NUTRITION_ITEMS.map((item) => (
            <div key={item.key} className="flex min-w-0 flex-col gap-1">
              <span className="text-[11px] font-medium text-muted-foreground">{item.label}</span>
              <span className="text-[13px] font-bold leading-tight text-popover-foreground">
                {formatNutrient(nutrition[item.key])}
                {item.unit}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
