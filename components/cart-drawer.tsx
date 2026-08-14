'use client'

import Image from 'next/image'
import dynamic from 'next/dynamic'
import { useState } from 'react'
import { CheckCircle2, Loader2, Minus, Plus, ShoppingBag, Trash2, X } from 'lucide-react'
import { AddressAutocomplete } from '@/components/address-autocomplete'
import { reverseGeocodePoint, type AddressSuggestion } from '@/lib/geocoding'
import { isAddressInZone } from '@/lib/deliveryZone'
import type { LatLng } from '@/lib/geo'

const DeliveryZoneMap = dynamic(
  () => import('@/components/delivery-zone-map').then((mod) => mod.DeliveryZoneMap),
  {
    ssr: false,
    loading: () => <div className="h-44 animate-pulse rounded-2xl bg-secondary" aria-hidden="true" />,
  },
)

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

type Fulfillment = 'pickup' | 'delivery'
type ZoneStatus = 'idle' | 'checking' | 'inside' | 'outside' | 'incomplete'

interface CheckoutForm {
  name: string
  phone: string
  comment: string
  address: string
  apartment: string
  entrance: string
  intercom: string
}

const EMPTY_FORM: CheckoutForm = {
  name: '',
  phone: '',
  comment: '',
  address: '',
  apartment: '',
  entrance: '',
  intercom: '',
}

export function CartDrawer({
  open,
  onClose,
  items,
  onIncrement,
  onDecrement,
  onRemove,
}: CartDrawerProps) {
  const [form, setForm] = useState<CheckoutForm>(EMPTY_FORM)
  const [fulfillment, setFulfillment] = useState<Fulfillment>('pickup')
  const [zoneStatus, setZoneStatus] = useState<ZoneStatus>('idle')
  const [coords, setCoords] = useState<LatLng | null>(null)
  const [searchingAddress, setSearchingAddress] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [success, setSuccess] = useState(false)

  const total = items.reduce((sum, item) => sum + item.price * item.quantity, 0)
  const checking = searchingAddress || zoneStatus === 'checking'
  const deliveryAllowed = fulfillment === 'pickup' || zoneStatus === 'inside'
  const deliveryDetailsFilled =
    form.apartment.trim().length > 0 &&
    form.entrance.trim().length > 0 &&
    form.intercom.trim().length > 0
  const isFormValid =
    form.name.trim().length > 0 &&
    form.phone.trim().length > 0 &&
    deliveryAllowed &&
    (fulfillment === 'pickup' || (form.address.trim().length > 0 && deliveryDetailsFilled))

  function resetCheckout() {
    setForm(EMPTY_FORM)
    setFulfillment('pickup')
    setZoneStatus('idle')
    setCoords(null)
    setSearchingAddress(false)
  }

  function handleFulfillmentChange(next: Fulfillment) {
    setFulfillment(next)
    if (next === 'pickup') {
      setZoneStatus('idle')
    } else if (coords) {
      setZoneStatus(isAddressInZone(coords.lat, coords.lng) ? 'inside' : 'outside')
    } else if (form.address.trim()) {
      setZoneStatus('idle')
    }
  }

  function handleAddressChange(value: string) {
    setForm((prev) => ({ ...prev, address: value }))
    setCoords(null)
    setZoneStatus('idle')
  }

  function handleAddressSelect(suggestion: AddressSuggestion) {
    setZoneStatus('checking')

    window.setTimeout(() => {
      if (suggestion.lat == null || suggestion.lng == null) {
        setCoords(null)
        setZoneStatus('incomplete')
        return
      }

      const point = { lat: suggestion.lat, lng: suggestion.lng }
      setCoords(point)
      setZoneStatus(isAddressInZone(point.lat, point.lng) ? 'inside' : 'outside')
    }, 220)
  }

  async function handleMapPick(point: LatLng) {
    setCoords(point)
    setZoneStatus('checking')
    setSearchingAddress(true)

    try {
      const suggestion = await reverseGeocodePoint(point.lat, point.lng)
      setForm((prev) => ({ ...prev, address: suggestion.value }))
      const lat = suggestion.lat ?? point.lat
      const lng = suggestion.lng ?? point.lng
      setCoords({ lat, lng })
      setZoneStatus(isAddressInZone(lat, lng) ? 'inside' : 'outside')
    } catch {
      setForm((prev) => ({
        ...prev,
        address: `${point.lat.toFixed(6)}, ${point.lng.toFixed(6)}`,
      }))
      setZoneStatus(isAddressInZone(point.lat, point.lng) ? 'inside' : 'outside')
    } finally {
      setSearchingAddress(false)
    }
  }

  async function submitOrder() {
    if (!isFormValid || items.length === 0) return
    setSubmitting(true)

    // -----------------------------------------------------------------
    // Точка интеграции с Supabase: сюда войдёт реальный insert в `orders`.
    // Передайте fulfillment, address, apartment, entrance, intercom и coords.
    // -----------------------------------------------------------------
    await new Promise((resolve) => setTimeout(resolve, 600))

    setSubmitting(false)
    setSuccess(true)
  }

  function handleClose() {
    onClose()
    setTimeout(() => {
      setSuccess(false)
      resetCheckout()
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

        {success ? (
          <div className="flex flex-1 flex-col items-center justify-center gap-4 px-8 text-center">
            <div className="flex size-16 items-center justify-center rounded-full bg-accent/15 text-accent">
              <ShoppingBag className="size-8" aria-hidden="true" />
            </div>
            <h3 className="text-2xl font-extrabold tracking-tight text-card-foreground">
              Спасибо! Заказ принят
            </h3>
            <p className="text-pretty leading-relaxed text-muted-foreground">
              Ждём вас! Мы свяжемся с вами по указанному номеру, чтобы уточнить время готовности
              заказа.
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

            <div className="flex max-h-[58%] flex-col gap-4 overflow-y-auto border-t border-border px-6 py-5">
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
                <div className="grid grid-cols-2 gap-2" role="group" aria-label="Способ получения">
                  <button
                    type="button"
                    onClick={() => handleFulfillmentChange('pickup')}
                    aria-pressed={fulfillment === 'pickup'}
                    className={`rounded-2xl px-3 py-2.5 text-sm font-bold transition-colors ${
                      fulfillment === 'pickup'
                        ? 'bg-primary text-primary-foreground shadow-sm'
                        : 'bg-secondary text-secondary-foreground hover:bg-secondary/70'
                    }`}
                  >
                    Самовывоз
                  </button>
                  <button
                    type="button"
                    onClick={() => handleFulfillmentChange('delivery')}
                    aria-pressed={fulfillment === 'delivery'}
                    className={`rounded-2xl px-3 py-2.5 text-sm font-bold transition-colors ${
                      fulfillment === 'delivery'
                        ? 'bg-primary text-primary-foreground shadow-sm'
                        : 'bg-secondary text-secondary-foreground hover:bg-secondary/70'
                    }`}
                  >
                    Доставка
                  </button>
                </div>

                {fulfillment === 'delivery' && (
                  <div className="flex flex-col gap-1.5">
                    <label htmlFor="cart-address" className="text-sm font-semibold text-card-foreground">
                      Адрес доставки
                    </label>
                    <AddressAutocomplete
                      id="cart-address"
                      value={form.address}
                      onChange={handleAddressChange}
                      onSelect={handleAddressSelect}
                      onSearchingChange={setSearchingAddress}
                    />
                    <ZoneFeedback checking={checking} status={zoneStatus} />
                    <DeliveryZoneMap
                      customer={coords}
                      status={zoneStatus}
                      visible={open}
                      onPick={handleMapPick}
                    />
                    {zoneStatus === 'inside' && (
                      <div className="grid grid-cols-3 gap-2">
                        <div className="flex flex-col gap-1.5">
                          <label htmlFor="cart-apartment" className="text-xs font-semibold text-card-foreground">
                            Квартира
                          </label>
                          <input
                            id="cart-apartment"
                            type="text"
                            required
                            inputMode="numeric"
                            value={form.apartment}
                            onChange={(event) =>
                              setForm((prev) => ({ ...prev, apartment: event.target.value }))
                            }
                            placeholder="12"
                            className="rounded-2xl border border-input bg-background px-3 py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                          />
                        </div>
                        <div className="flex flex-col gap-1.5">
                          <label htmlFor="cart-entrance" className="text-xs font-semibold text-card-foreground">
                            Подъезд
                          </label>
                          <input
                            id="cart-entrance"
                            type="text"
                            required
                            inputMode="numeric"
                            value={form.entrance}
                            onChange={(event) =>
                              setForm((prev) => ({ ...prev, entrance: event.target.value }))
                            }
                            placeholder="2"
                            className="rounded-2xl border border-input bg-background px-3 py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                          />
                        </div>
                        <div className="flex flex-col gap-1.5">
                          <label htmlFor="cart-intercom" className="text-xs font-semibold text-card-foreground">
                            Домофон
                          </label>
                          <input
                            id="cart-intercom"
                            type="text"
                            required
                            value={form.intercom}
                            onChange={(event) =>
                              setForm((prev) => ({ ...prev, intercom: event.target.value }))
                            }
                            placeholder="12K34"
                            className="rounded-2xl border border-input bg-background px-3 py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                          />
                        </div>
                      </div>
                    )}
                  </div>
                )}

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
                    Комментарий
                  </label>
                  <textarea
                    id="cart-comment"
                    rows={2}
                    value={form.comment}
                    onChange={(event) =>
                      setForm((prev) => ({ ...prev, comment: event.target.value }))
                    }
                    placeholder={
                      fulfillment === 'pickup'
                        ? 'Например: заберу в 18:30'
                        : 'Этаж, комментарий курьеру'
                    }
                    className="resize-none rounded-2xl border border-input bg-background px-4 py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                  />
                </div>

                <button
                  type="submit"
                  disabled={!isFormValid || submitting || checking}
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

function ZoneFeedback({ checking, status }: { checking: boolean; status: ZoneStatus }) {
  if (checking) {
    return (
      <p className="flex items-center gap-1.5 text-xs font-semibold text-muted-foreground">
        <Loader2 className="size-3.5 animate-spin" aria-hidden="true" />
        Проверяем адрес…
      </p>
    )
  }

  if (status === 'inside') {
    return (
      <p className="flex items-center gap-1.5 text-xs font-semibold text-emerald-600">
        <CheckCircle2 className="size-3.5" aria-hidden="true" />
        Отличный адрес, доставим быстро!
      </p>
    )
  }

  if (status === 'outside') {
    return (
      <p className="text-xs font-semibold leading-relaxed text-red-600" role="alert">
        К сожалению, этот адрес находится вне зоны нашей доставки. Выберите самовывоз
      </p>
    )
  }

  if (status === 'incomplete') {
    return (
      <p className="text-xs font-semibold text-muted-foreground">
        Уточните адрес до номера дома — без него нельзя проверить зону.
      </p>
    )
  }

  return (
    <p className="text-xs text-muted-foreground">Выберите адрес из списка подсказок</p>
  )
}
