'use client'

import Image from 'next/image'
import { useState } from 'react'
import { Minus, Plus, ShoppingBag, Trash2, X } from 'lucide-react'
import { CheckoutForm, OrderSuccessScreen } from '@/components/checkout-form'
import type { CartItem } from '@/lib/cart'

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
        className={`fixed inset-0 z-50 bg-foreground/40 transition-opacity duration-300 ${
          open ? 'opacity-100' : 'pointer-events-none opacity-0'
        }`}
      />

      <aside
        role="dialog"
        aria-modal="true"
        aria-label="Корзина"
        className={`fixed inset-y-0 right-0 z-50 flex h-full w-full max-w-md flex-col bg-card shadow-xl transition-transform duration-300 ${
          open ? 'translate-x-0' : 'translate-x-full'
        }`}
      >
        <div className="flex items-center justify-between gap-4 border-b border-border px-6 py-5">
          <h2 className="text-xl font-extrabold tracking-tight text-card-foreground">Ваш заказ</h2>
          <button
            type="button"
            onClick={handleClose}
            aria-label="Закрыть корзину"
            className="flex size-10 shrink-0 items-center justify-center rounded-full text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground"
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
          <>
            <div className="max-h-[55%] shrink-0 overflow-y-auto px-6 py-5">
              <ul className="flex flex-col gap-4">
                {items.map((item) => (
                  <li key={item.id} className="flex items-center gap-4">
                    <div className="relative size-16 shrink-0 overflow-hidden rounded-2xl bg-secondary">
                      <Image
                        src={item.image || '/placeholder.svg'}
                        alt={item.name}
                        fill
                        className="object-cover"
                        sizes="64px"
                      />
                    </div>

                    <div className="flex flex-1 flex-col gap-1">
                      <span className="text-sm font-bold leading-snug text-card-foreground">
                        {item.name}
                      </span>
                      <span className="text-sm font-semibold text-muted-foreground">
                        {item.price} ₽
                      </span>
                    </div>

                    <div className="flex flex-col items-end gap-2">
                      <button
                        type="button"
                        onClick={() => onRemove(item.id)}
                        aria-label={`Удалить «${item.name}» из корзины`}
                        className="flex size-8 items-center justify-center rounded-full text-muted-foreground transition-colors hover:bg-secondary hover:text-destructive"
                      >
                        <Trash2 className="size-4" aria-hidden="true" />
                      </button>

                      <div className="flex items-center gap-1 rounded-full bg-secondary p-1">
                        <button
                          type="button"
                          onClick={() => onDecrement(item.id)}
                          aria-label={`Уменьшить количество «${item.name}»`}
                          className="flex size-7 items-center justify-center rounded-full text-secondary-foreground transition-colors hover:bg-card"
                        >
                          <Minus className="size-3.5" aria-hidden="true" />
                        </button>
                        <span className="w-5 text-center text-sm font-bold text-secondary-foreground">
                          {item.quantity}
                        </span>
                        <button
                          type="button"
                          onClick={() => onIncrement(item.id)}
                          aria-label={`Увеличить количество «${item.name}»`}
                          className="flex size-7 items-center justify-center rounded-full text-secondary-foreground transition-colors hover:bg-card"
                        >
                          <Plus className="size-3.5" aria-hidden="true" />
                        </button>
                      </div>
                    </div>
                  </li>
                ))}
              </ul>
            </div>

            <CheckoutForm
              items={items}
              drawerOpen={open}
              onPlaced={({ orderNumber, hint }) => {
                setPlacedOrderNumber(orderNumber)
                setSuccessHint(hint)
                onClear()
              }}
            />
          </>
        )}
      </aside>
    </>
  )
}
