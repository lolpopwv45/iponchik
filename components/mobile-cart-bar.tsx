'use client'

import { ShoppingBag } from 'lucide-react'
import { cn } from '@/lib/utils'

export function MobileCartBar({
  count,
  total,
  visible,
  onOpen,
}: {
  count: number
  total: number
  visible: boolean
  onOpen: () => void
}) {
  if (count === 0) return null

  const itemLabel =
    count % 10 === 1 && count % 100 !== 11
      ? 'товар'
      : count % 10 >= 2 && count % 10 <= 4 && (count % 100 < 12 || count % 100 > 14)
        ? 'товара'
        : 'товаров'

  return (
    <div
      className={cn(
        'fixed inset-x-0 bottom-0 z-40 px-4 pt-2 sm:hidden',
        'pb-[max(1rem,env(safe-area-inset-bottom))]',
        !visible && 'pointer-events-none',
      )}
    >
      <button
        type="button"
        onClick={onOpen}
        className={cn(
          'flex w-full items-center justify-between rounded-2xl bg-primary px-5 py-3.5 text-primary-foreground shadow-lg transition-transform duration-300',
          visible ? 'translate-y-0' : 'translate-y-[calc(100%+2rem)]',
        )}
      >
        <span className="flex min-w-0 items-center gap-3">
          <span className="flex size-8 items-center justify-center rounded-full bg-primary-foreground/15">
            <ShoppingBag className="size-4" aria-hidden="true" />
          </span>
          <span className="text-left">
            <span className="block text-sm font-bold leading-tight">Корзина</span>
            <span className="block text-xs font-semibold text-primary-foreground/80">
              {count} {itemLabel}
            </span>
          </span>
        </span>
        <span className="text-base font-extrabold tabular-nums">{total} ₽</span>
      </button>
    </div>
  )
}
