'use client'

import Image from 'next/image'
import { useEffect, useState } from 'react'
import { Minus, Plus, ShoppingBag, Trash2, X } from 'lucide-react'
import { CheckoutForm, OrderSuccessScreen } from '@/components/checkout-form'
import type { CartItem } from '@/lib/cart'
import { cn } from '@/lib/utils'

export type { CartItem }

interface CartDrawerProps {
  open: boolean
  onClose: () => void
  items: CartItem[]
  onIncrement: (id: number) => void
  onDecrement: (id: number) => void
  onRemove: (id: number) => void
  onClear: () => void
}

export function CartDrawer({
  open,
  onClose,
  items,
  onIncrement,
  onDecrement,
  onRemove,
  onClear,
}: CartDrawerProps) {
  const [placedOrderNumber, setPlacedOrderNumber] = useState<string | null>(null)
  const [successHint, setSuccessHint] = useState('')

  useEffect(() => {
    if (!open) return

    const previousOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'

    function onKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') handleClose()
    }

    window.addEventListener('keydown', onKeyDown)
    return () => {
      document.body.style.overflow = previousOverflow
      window.removeEventListener('keydown', onKeyDown)
    }
  }, [open])

  function handleClose() {
    onClose()
    setTimeout(() => {
      setPlacedOrderNumber(null)
      setSuccessHint('')
    }, 300)
  }

  return (
    <>
      <div
        onClick={handleClose}
        aria-hidden="true"
        className={`fixed inset-0 z-[60] bg-foreground/40 transition-opacity duration-300 ${
          open ? 'opacity-100' : 'pointer-events-none opacity-0'
        }`}
      />

      <aside
        role="dialog"
        aria-modal="true"
        aria-label="Корзина"
        aria-hidden={!open}
        inert={!open}
        className={cn(
          'fixed z-[60] flex flex-col bg-card shadow-xl transition-transform duration-300',
          'inset-x-0 bottom-0 top-3 rounded-t-3xl',
          'sm:inset-y-0 sm:right-0 sm:left-auto sm:top-0 sm:h-full sm:w-full sm:max-w-md sm:rounded-none',
          open
            ? 'translate-y-0 sm:translate-x-0'
            : 'pointer-events-none translate-y-full sm:translate-y-0 sm:translate-x-full',
        )}
      >
        <div className="mx-auto mt-2 hidden h-1.5 w-12 shrink-0 rounded-full bg-border max-sm:block" />

        <div className="flex items-center justify-between gap-4 border-b border-border px-4 py-3 sm:px-6 sm:py-5">
          <h2 className="text-xl font-extrabold tracking-tight text-card-foreground">Ваш заказ</h2>
          <button
            type="button"
            onClick={handleClose}
            aria-label="Закрыть корзину"
            className="flex size-11 shrink-0 items-center justify-center rounded-full text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground"
          >
            <X className="size-5" aria-hidden="true" />
          </button>
        </div>

        {placedOrderNumber ? (
          <OrderSuccessScreen
            orderNumber={placedOrderNumber}
            hint={successHint}
            onClose={handleClose}
          />
        ) : items.length === 0 ? (
          <div className="flex flex-1 flex-col items-center justify-center gap-3 px-8 text-center">
            <div className="flex size-16 items-center justify-center rounded-full bg-secondary text-muted-foreground">
              <ShoppingBag className="size-7" aria-hidden="true" />
            </div>
            <h3 className="text-lg font-bold text-card-foreground">Корзина пуста</h3>
            <p className="text-sm leading-relaxed text-muted-foreground">
              Добавьте что-нибудь вкусное из меню — и оно появится здесь.
            </p>
          </div>
        ) : (
          <CheckoutForm
            items={items}
            drawerOpen={open}
            onPlaced={({ orderNumber, hint }) => {
              setPlacedOrderNumber(orderNumber)
              setSuccessHint(hint)
              onClear()
            }}
          >
            <CartItems
              items={items}
              onIncrement={onIncrement}
              onDecrement={onDecrement}
              onRemove={onRemove}
            />
          </CheckoutForm>
        )}
      </aside>
    </>
  )
}

function CartItems({
  items,
  onIncrement,
  onDecrement,
  onRemove,
}: {
  items: CartItem[]
  onIncrement: (id: number) => void
  onDecrement: (id: number) => void
  onRemove: (id: number) => void
}) {
  return (
    <ul className="mb-5 flex flex-col gap-4">
      {items.map((item) => (
        <li key={item.id} className="flex items-center gap-3 sm:gap-4">
          <div className="relative size-16 shrink-0 overflow-hidden rounded-2xl bg-secondary">
            <Image
              src={item.image || '/placeholder.svg'}
              alt={item.name}
              fill
              className="object-cover"
              sizes="64px"
            />
          </div>

          <div className="flex min-w-0 flex-1 flex-col gap-1">
            <span className="text-sm font-bold leading-snug text-card-foreground">{item.name}</span>
            <span className="text-sm font-semibold text-muted-foreground">{item.price} ₽</span>
          </div>

          <div className="flex flex-col items-end gap-2">
            <button
              type="button"
              onClick={() => onRemove(item.id)}
              aria-label={`Удалить «${item.name}» из корзины`}
              className="flex size-10 items-center justify-center rounded-full text-muted-foreground transition-colors hover:bg-secondary hover:text-destructive sm:size-8"
            >
              <Trash2 className="size-4" aria-hidden="true" />
            </button>

            <div className="flex items-center gap-1 rounded-full bg-secondary p-1">
              <button
                type="button"
                onClick={() => onDecrement(item.id)}
                aria-label={`Уменьшить количество «${item.name}»`}
                className="flex size-10 items-center justify-center rounded-full text-secondary-foreground transition-colors hover:bg-card sm:size-7"
              >
                <Minus className="size-4 sm:size-3.5" aria-hidden="true" />
              </button>
              <span className="w-5 text-center text-sm font-bold text-secondary-foreground">
                {item.quantity}
              </span>
              <button
                type="button"
                onClick={() => onIncrement(item.id)}
                aria-label={`Увеличить количество «${item.name}»`}
                className="flex size-10 items-center justify-center rounded-full text-secondary-foreground transition-colors hover:bg-card sm:size-7"
              >
                <Plus className="size-4 sm:size-3.5" aria-hidden="true" />
              </button>
            </div>
          </div>
        </li>
      ))}
    </ul>
  )
}

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
