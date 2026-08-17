'use client'

import dynamic from 'next/dynamic'
import { type ReactNode, useId, useState } from 'react'
import { Check, CheckCircle2, Loader2, ShoppingBag } from 'lucide-react'
import { AddressAutocomplete } from '@/components/address-autocomplete'
import { OrderTimePicker } from '@/components/order-time-picker'
import type { CartItem } from '@/lib/cart'
import { reverseGeocodePoint, type AddressSuggestion } from '@/lib/geocoding'
import { calcCityDeliveryPricing, isAddressInZone } from '@/lib/deliveryZone'
import {
  formatDeliveryAsapWindow,
  formatOrderTime,
  isOrderingOpen,
  isPickupSlotOpen,
  slotsForDate,
  type TimeMode,
  type TimeSlot,
} from '@/lib/order-time'
import { createOrder, type Fulfillment } from '@/lib/orders'
import type { LatLng } from '@/lib/geo'
import { cn } from '@/lib/utils'

const DeliveryZoneMap = dynamic(
  () => import('@/components/delivery-zone-map').then((mod) => mod.DeliveryZoneMap),
  {
    ssr: false,
    loading: () => <div className="h-44 animate-pulse rounded-2xl bg-secondary" aria-hidden="true" />,
  },
)

interface CheckoutFields {
  name: string
  phone: string
  comment: string
  address: string
  apartment: string
  entrance: string
  intercom: string
}

const EMPTY_FORM: CheckoutFields = {
  name: '',
  phone: '',
  comment: '',
  address: '',
  apartment: '',
  entrance: '',
  intercom: '',
}

type ZoneStatus = 'idle' | 'checking' | 'inside' | 'outside' | 'incomplete'

export interface CheckoutFormProps {
  items: CartItem[]
  drawerOpen: boolean
  onPlaced: (result: { orderNumber: string; hint: string }) => void
  children?: ReactNode
}

export function CheckoutForm({ items, drawerOpen, onPlaced, children }: CheckoutFormProps) {
  const [form, setForm] = useState<CheckoutFields>(EMPTY_FORM)
  const [fulfillment, setFulfillment] = useState<Fulfillment>('pickup')
  const [zoneStatus, setZoneStatus] = useState<ZoneStatus>('idle')
  const [coords, setCoords] = useState<LatLng | null>(null)
  const [searchingAddress, setSearchingAddress] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [submitError, setSubmitError] = useState('')
  const [timeMode, setTimeMode] = useState<TimeMode>('asap')
  const [timeSlot, setTimeSlot] = useState<TimeSlot | null>(null)
  const [pdnConsent, setPdnConsent] = useState(false)
  const formId = useId()

  const subtotal = items.reduce((sum, item) => sum + item.price * item.quantity, 0)
  const isDelivery = fulfillment === 'delivery'
  const pricing = calcCityDeliveryPricing(subtotal, isDelivery)
  const checking = searchingAddress || zoneStatus === 'checking'
  const deliveryAllowed = !isDelivery || zoneStatus === 'inside'
  const deliveryDetailsFilled =
    form.apartment.trim().length > 0 &&
    form.entrance.trim().length > 0 &&
    form.intercom.trim().length > 0
  const isFormValid =
    form.name.trim().length > 0 &&
    form.phone.trim().length > 0 &&
    deliveryAllowed &&
    pricing.meetsMinimum &&
    (!isDelivery || (form.address.trim().length > 0 && deliveryDetailsFilled)) &&
    (timeMode === 'asap' ||
      (timeSlot != null &&
        (isDelivery
          ? slotsForDate(new Date()).some((item) => item.from === timeSlot.from)
          : isPickupSlotOpen(timeSlot)))) &&
    pdnConsent &&
    isOrderingOpen()

  function handleFulfillmentChange(next: Fulfillment) {
    setFulfillment(next)
    setTimeMode('asap')
    setTimeSlot(null)
    setSubmitError('')
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
      setForm((prev) => ({ ...prev, address: '' }))
      setZoneStatus('incomplete')
    } finally {
      setSearchingAddress(false)
    }
  }

  async function submitOrder() {
    if (!isFormValid || items.length === 0) return
    setSubmitting(true)
    setSubmitError('')

    const hint = isDelivery
      ? timeMode === 'asap'
        ? `Привезём${formatDeliveryAsapWindow()}.`
        : `Привезём ${timeSlot?.label ?? 'в выбранный слот'}.`
      : timeMode === 'asap'
        ? 'Готовим примерно в течение часа. Заберите на Руставели, 24.'
        : `Будет готов к ${timeSlot?.label ?? ''}. Заберите на ул. Руставели, 24.`

    try {
      const { orderNumber } = await createOrder({
        customerName: form.name,
        phone: form.phone,
        comment: form.comment,
        fulfillment,
        address: form.address,
        apartment: form.apartment,
        entrance: form.entrance,
        intercom: form.intercom,
        coords,
        timeMode,
        timeLabel: formatOrderTime(timeMode, timeSlot, fulfillment),
        items,
        subtotal,
        deliveryFee: pricing.fee,
        total: pricing.payable,
      })
      onPlaced({ orderNumber, hint })
    } catch (error) {
      setSubmitError(error instanceof Error ? error.message : 'Не удалось оформить заказ. Попробуйте ещё раз.')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-4 py-4 sm:px-6">
      {children}
      {isDelivery ? (
        <div className="mb-4 flex flex-col gap-2">
          <div className="flex items-center justify-between text-sm">
            <span className="font-semibold text-muted-foreground">Товары</span>
            <span className="font-bold text-card-foreground">{subtotal} ₽</span>
          </div>
          <div className="flex items-center justify-between text-sm">
            <span className="font-semibold text-muted-foreground">Доставка по городу</span>
            <span className="font-bold text-card-foreground">{pricing.fee} ₽</span>
          </div>
          <div className="flex items-center justify-between border-t border-border pt-2">
            <span className="text-base font-semibold text-muted-foreground">Итого</span>
            <span className="text-2xl font-extrabold tracking-tight text-card-foreground">
              {pricing.payable} ₽
            </span>
          </div>
          {!pricing.meetsMinimum && (
            <p className="text-xs font-semibold leading-relaxed text-red-600" role="status">
              Минимальный заказ на доставку {pricing.minOrder} ₽. Добавьте ещё {pricing.remaining} ₽.
            </p>
          )}
        </div>
      ) : (
        <div className="mb-4 flex items-center justify-between">
          <span className="text-base font-semibold text-muted-foreground">Итого</span>
          <span className="text-2xl font-extrabold tracking-tight text-card-foreground">
            {pricing.payable} ₽
          </span>
        </div>
      )}

      <form
        id={formId}
        onSubmit={(event) => {
          event.preventDefault()
          void submitOrder()
        }}
        className="flex flex-col gap-3"
      >
        <div className="grid grid-cols-2 gap-2" role="group" aria-label="Способ получения">
          <button
            type="button"
            onClick={() => handleFulfillmentChange('pickup')}
            aria-pressed={fulfillment === 'pickup'}
            className={`min-h-12 rounded-2xl px-3 text-sm font-bold transition-colors ${
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
            className={`min-h-12 rounded-2xl px-3 text-sm font-bold transition-colors ${
              fulfillment === 'delivery'
                ? 'bg-primary text-primary-foreground shadow-sm'
                : 'bg-secondary text-secondary-foreground hover:bg-secondary/70'
            }`}
          >
            Доставка
          </button>
        </div>
        {isDelivery && (
          <p className="text-xs leading-relaxed text-muted-foreground">
            По городу: минимальный заказ {pricing.minOrder} ₽, доставка {pricing.fee} ₽.
          </p>
        )}

        <OrderTimePicker
          fulfillment={fulfillment}
          mode={timeMode}
          slot={timeSlot}
          onModeChange={setTimeMode}
          onSlotChange={setTimeSlot}
        />

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
              visible={drawerOpen}
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
                    autoComplete="address-line2"
                    className="field-input px-3"
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
                    className="field-input px-3"
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
                    className="field-input px-3"
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
            autoComplete="name"
            autoCapitalize="words"
            value={form.name}
            onChange={(event) => setForm((prev) => ({ ...prev, name: event.target.value }))}
            placeholder="Как вас зовут?"
            className="field-input"
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
            inputMode="tel"
            autoComplete="tel"
            value={form.phone}
            onChange={(event) => setForm((prev) => ({ ...prev, phone: event.target.value }))}
            placeholder="+7 (___) ___-__-__"
            className="field-input"
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
            onChange={(event) => setForm((prev) => ({ ...prev, comment: event.target.value }))}
            placeholder={
              fulfillment === 'pickup' ? 'Например: заберу в 18:30' : 'Этаж, комментарий курьеру'
            }
            className="field-input min-h-[4.5rem] resize-none"
          />
        </div>

        <label htmlFor="cart-pdn-consent" className="flex cursor-pointer items-start gap-3 py-1">
          <input
            id="cart-pdn-consent"
            type="checkbox"
            required
            checked={pdnConsent}
            onChange={(event) => setPdnConsent(event.target.checked)}
            className="peer sr-only"
          />
          <span
            aria-hidden="true"
            className={cn(
              'mt-0.5 flex size-6 shrink-0 items-center justify-center rounded-md border transition-colors peer-focus-visible:ring-2 peer-focus-visible:ring-ring',
              pdnConsent
                ? 'border-primary bg-primary text-primary-foreground'
                : 'border-input bg-background',
            )}
          >
            {pdnConsent && <Check className="size-3.5" strokeWidth={2.5} />}
          </span>
          <span className="text-xs leading-relaxed text-foreground">
            Я даю <span className="font-bold">согласие</span> на обработку моих персональных данных, в
            соответствии с Федеральным законом от 27.07.2006 г. №152-ФЗ «О персональных данных», на
            условиях, определенных{' '}
            <a
              href="/privacy"
              target="_blank"
              rel="noopener noreferrer"
              className="font-bold underline-offset-2 hover:text-primary hover:underline"
              onClick={(event) => event.stopPropagation()}
            >
              политикой
            </a>{' '}
            в области обработки и обеспечения безопасности персональных данных
          </span>
        </label>

        {submitError && (
          <p className="text-xs font-semibold leading-relaxed text-red-600" role="alert">
            {submitError}
          </p>
        )}
      </form>
      </div>

      <div className="shrink-0 border-t border-border bg-card px-4 pt-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] sm:px-6">
        <button
          type="submit"
          form={formId}
          disabled={!isFormValid || submitting || checking}
          className="flex min-h-12 w-full items-center justify-center gap-2 rounded-full bg-primary px-6 text-sm font-bold text-primary-foreground shadow-sm transition-shadow hover:shadow-md disabled:cursor-not-allowed disabled:opacity-50"
        >
          {submitting && <Loader2 className="size-4 animate-spin" aria-hidden="true" />}
          {submitting
            ? 'Оформляем заказ…'
            : !isDelivery
              ? `Оформить заказ на ${pricing.payable} ₽`
              : !pricing.meetsMinimum
                ? `Ещё ${pricing.remaining} ₽ до минимума`
                : `Оформить заказ на ${pricing.payable} ₽`}
        </button>
        <p className="mt-2 text-center text-xs leading-relaxed text-muted-foreground">
          Оплата при получении заказа
        </p>
      </div>
    </div>
  )
}

export function OrderSuccessScreen({
  orderNumber,
  hint,
  onClose,
}: {
  orderNumber: string
  hint: string
  onClose: () => void
}) {
  return (
    <div className="flex flex-1 flex-col items-center justify-center gap-4 px-6 pb-[max(1.5rem,env(safe-area-inset-bottom))] text-center sm:px-8">
      <div className="flex size-16 items-center justify-center rounded-full bg-accent/15 text-accent">
        <ShoppingBag className="size-8" aria-hidden="true" />
      </div>
      <p className="text-4xl font-extrabold tracking-tight text-primary">{orderNumber}</p>
      <h3 className="text-pretty text-2xl font-extrabold leading-snug tracking-tight text-card-foreground">
        Спасибо! Ваш заказ {orderNumber} успешно оформлен. Наш оператор скоро свяжется с вами для
        подтверждения.
      </h3>
      {hint ? <p className="text-pretty leading-relaxed text-muted-foreground">{hint}</p> : null}
      <button
        type="button"
        onClick={onClose}
        className="mt-2 flex min-h-12 items-center justify-center rounded-full bg-primary px-8 text-sm font-bold text-primary-foreground shadow-sm transition-shadow hover:shadow-md"
      >
        Вернуться в меню
      </button>
    </div>
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
        К сожалению, этот адрес находится вне зоны нашей доставки. Выберите самовывоз. Для такого
        заказа необходимо позвонить оператору:{' '}
        <a href="tel:+79084945053" className="underline underline-offset-2">
          +7 (908) 494-50-53
        </a>
      </p>
    )
  }

  if (status === 'incomplete') {
    return (
      <p className="text-xs font-semibold text-muted-foreground">
        Не удалось прочитать улицу. Нажмите ближе к дому или выберите адрес из подсказок.
      </p>
    )
  }

  return <p className="text-xs text-muted-foreground">Выберите адрес из списка подсказок</p>
}
