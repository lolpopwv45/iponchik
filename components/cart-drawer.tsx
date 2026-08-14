'use client'

import Image from 'next/image'
import { useState } from 'react'
import { Minus, Plus, ShoppingBag, Trash2, X } from 'lucide-react'

// ---------------------------------------------------------------------------
// Корзина и оформление заказа для кулинарии «Я-пончик».
//
// Компонент полностью самодостаточен: количество товаров и данные формы
// хранятся в локальном состоянии (useState). Родитель управляет только
// списком товаров (items) и колбэками изменения количества/удаления —
// это удобно для последующей интеграции с реальной корзиной.
//
// Готово к подключению Supabase: функция `submitOrder` ниже — единственное
// место, которое нужно заменить на реальный insert в таблицу `orders`,
// например:
//
//   const { error } = await supabase.from('orders').insert({
//     customer_name: form.name,
//     customer_phone: form.phone,
//     comment: form.comment,
//     items: items.map(({ id, quantity, price }) => ({ id, quantity, price })),
//     total,
//   })
// ---------------------------------------------------------------------------

export interface CartItem {
  id: number
  name: string
  price: number
  image: string
  quantity: number
}

interface CartDrawerProps {
  open: boolean
  onClose: () => void
  items: CartItem[]
  onIncrement: (id: number) => void
  onDecrement: (id: number) => void
  onRemove: (id: number) => void
}

interface CheckoutForm {
  name: string
  phone: string
  comment: string
}

export function CartDrawer({
  open,
  onClose,
  items,
  onIncrement,
  onDecrement,
  onRemove,
}: CartDrawerProps) {
  const [form, setForm] = useState<CheckoutForm>({ name: '', phone: '', comment: '' })
  const [submitting, setSubmitting] = useState(false)
  const [success, setSuccess] = useState(false)

  const total = items.reduce((sum, item) => sum + item.price * item.quantity, 0)
  const isFormValid = form.name.trim().length > 0 && form.phone.trim().length > 0

  async function submitOrder() {
    if (!isFormValid || items.length === 0) return
    setSubmitting(true)

    // -----------------------------------------------------------------
    // Точка интеграции с Supabase: сюда войдёт реальный insert в `orders`.
    // Сейчас — заглушка, имитирующая сетевой запрос.
    // -----------------------------------------------------------------
    await new Promise((resolve) => setTimeout(resolve, 600))

    setSubmitting(false)
    setSuccess(true)
  }

  function handleClose() {
    onClose()
    // Сбрасываем экран успеха после закрытия, чтобы при следующем открытии
    // корзина снова показывала список товаров.
    setTimeout(() => {
      setSuccess(false)
      setForm({ name: '', phone: '', comment: '' })
    }, 300)
  }

  return (
    <>
      {/* Backdrop */}
      <div
        onClick={handleClose}
        aria-hidden="true"
        className={`fixed inset-0 z-50 bg-foreground/40 transition-opacity duration-300 ${
          open ? 'opacity-100' : 'pointer-events-none opacity-0'
        }`}
      />

      {/* Panel */}
      <aside
        role="dialog"
        aria-modal="true"
        aria-label="Корзина"
        className={`fixed inset-y-0 right-0 z-50 flex h-full w-full max-w-md flex-col bg-card shadow-xl transition-transform duration-300 ${
          open ? 'translate-x-0' : 'translate-x-full'
        }`}
      >
        {/* Header */}
        <div className="flex items-center justify-between gap-4 border-b border-border px-6 py-5">
          <h2 className="text-xl font-extrabold tracking-tight text-card-foreground">
            Ваш заказ
          </h2>
          <button
            type="button"
            onClick={handleClose}
            aria-label="Закрыть корзину"
            className="flex size-10 shrink-0 items-center justify-center rounded-full text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground"
          >
            <X className="size-5" aria-hidden="true" />
          </button>
        </div>

        {success ? (
          // -------------------------------------------------------------
          // Success state
          // -------------------------------------------------------------
          <div className="flex flex-1 flex-col items-center justify-center gap-4 px-8 text-center">
            <div className="flex size-16 items-center justify-center rounded-full bg-accent/15 text-accent">
              <ShoppingBag className="size-8" aria-hidden="true" />
            </div>
            <h3 className="text-2xl font-extrabold tracking-tight text-card-foreground">
              Спасибо! Заказ принят
            </h3>
            <p className="text-pretty leading-relaxed text-muted-foreground">
              Ждём вас! Мы свяжемся с вами по указанному номеру, чтобы уточнить время
              готовности заказа.
            </p>
            <button
              type="button"
              onClick={handleClose}
              className="mt-2 rounded-full bg-primary px-8 py-3 text-sm font-bold text-primary-foreground shadow-sm transition-shadow hover:shadow-md"
            >
              Вернуться в меню
            </button>
          </div>
        ) : items.length === 0 ? (
          // -------------------------------------------------------------
          // Empty state
          // -------------------------------------------------------------
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
            {/* Item list */}
            <div className="flex-1 overflow-y-auto px-6 py-5">
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

            {/* Total + Checkout form */}
            <div className="flex flex-col gap-5 border-t border-border px-6 py-5">
              <div className="flex items-center justify-between">
                <span className="text-base font-semibold text-muted-foreground">Итого</span>
                <span className="text-2xl font-extrabold tracking-tight text-card-foreground">
                  {total} ₽
                </span>
              </div>

              <form
                onSubmit={(event) => {
                  event.preventDefault()
                  submitOrder()
                }}
                className="flex flex-col gap-3"
              >
                <div className="flex flex-col gap-1.5">
                  <label htmlFor="cart-name" className="text-sm font-semibold text-card-foreground">
                    Имя
                  </label>
                  <input
                    id="cart-name"
                    type="text"
                    required
                    value={form.name}
                    onChange={(event) => setForm((prev) => ({ ...prev, name: event.target.value }))}
                    placeholder="Как вас зовут?"
                    className="rounded-2xl border border-input bg-background px-4 py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                  />
                </div>

                <div className="flex flex-col gap-1.5">
                  <label htmlFor="cart-phone" className="text-sm font-semibold text-card-foreground">
                    Телефон
                  </label>
                  <input
                    id="cart-phone"
                    type="tel"
                    required
                    value={form.phone}
                    onChange={(event) => setForm((prev) => ({ ...prev, phone: event.target.value }))}
                    placeholder="+7 (___) ___-__-__"
                    className="rounded-2xl border border-input bg-background px-4 py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                  />
                </div>

                <div className="flex flex-col gap-1.5">
                  <label htmlFor="cart-comment" className="text-sm font-semibold text-card-foreground">
                    Комментарий или время самовывоза
                  </label>
                  <textarea
                    id="cart-comment"
                    rows={2}
                    value={form.comment}
                    onChange={(event) =>
                      setForm((prev) => ({ ...prev, comment: event.target.value }))
                    }
                    placeholder="Например: заберу в 18:30"
                    className="resize-none rounded-2xl border border-input bg-background px-4 py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                  />
                </div>

                <button
                  type="submit"
                  disabled={!isFormValid || submitting}
                  className="mt-1 flex items-center justify-center rounded-full bg-primary px-6 py-3.5 text-sm font-bold text-primary-foreground shadow-sm transition-shadow hover:shadow-md disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {submitting ? 'Оформляем заказ…' : `Оформить заказ на ${total} ₽`}
                </button>

                <p className="text-center text-xs leading-relaxed text-muted-foreground">
                  Оплата при получении заказа
                </p>
              </form>
            </div>
          </>
        )}
      </aside>
    </>
  )
}
