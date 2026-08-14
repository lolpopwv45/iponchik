'use client'

import { useEffect, useState } from 'react'
import {
  TIME_SLOTS,
  constrainPickupDraft,
  isOrderingOpen,
  isSlotOpen,
  parsePickupTime,
  pickupTimeError,
  type TimeMode,
  type TimeSlot,
} from '@/lib/order-time'
import { cn } from '@/lib/utils'

interface OrderTimePickerProps {
  fulfillment: 'pickup' | 'delivery'
  mode: TimeMode
  slot: TimeSlot | null
  onModeChange: (mode: TimeMode) => void
  onSlotChange: (slot: TimeSlot) => void
}

const slotButtonClass = (active: boolean, enabled: boolean) =>
  cn(
    'rounded-xl px-2 py-2 text-xs font-bold transition-colors disabled:cursor-not-allowed disabled:opacity-35',
    active && enabled
      ? 'bg-primary text-primary-foreground'
      : 'bg-secondary text-secondary-foreground hover:bg-secondary/70 disabled:hover:bg-secondary',
  )

export function OrderTimePicker({
  fulfillment,
  mode,
  slot,
  onModeChange,
  onSlotChange,
}: OrderTimePickerProps) {
  const isDelivery = fulfillment === 'delivery'
  const [now, setNow] = useState(() => new Date())
  const [pickupInput, setPickupInput] = useState(slot?.label ?? '')
  const orderingOpen = isOrderingOpen(now)
  const parsedPickup = parsePickupTime(pickupInput)
  const pickupError = parsedPickup ? pickupTimeError(parsedPickup, now) : null

  useEffect(() => {
    const intervalId = window.setInterval(() => setNow(new Date()), 15000)
    return () => window.clearInterval(intervalId)
  }, [])

  useEffect(() => {
    if (mode === 'asap') setPickupInput('')
  }, [mode])

  function handlePickupInput(value: string) {
    setPickupInput(value)
    if (!value) {
      onModeChange('asap')
      return
    }
    const parsed = parsePickupTime(value)
    if (!parsed) return
    onModeChange('slot')
    onSlotChange(parsed)
  }

  return (
    <fieldset className="flex flex-col gap-3 p-0">
      <legend className="float-none w-full p-0 text-sm font-semibold text-card-foreground">
        {isDelivery ? 'Когда привезти' : 'Когда забрать'}
      </legend>

      {!orderingOpen ? (
        <p className="text-xs font-semibold leading-relaxed text-red-600">
          Сегодня заказы уже не принимаем — оформление до 21:00. Кухня работает до 22:00.
        </p>
      ) : isDelivery ? (
        <div className="grid grid-cols-3 gap-1.5">
          <button
            type="button"
            aria-pressed={mode === 'asap'}
            onClick={() => onModeChange('asap')}
            className={cn(slotButtonClass(mode === 'asap', true), 'col-span-3')}
          >
            Как можно скорее
          </button>

          {TIME_SLOTS.map((item) => {
            const enabled = isSlotOpen(item, now)
            const selected = mode === 'slot' && slot?.from === item.from
            return (
              <button
                key={item.from}
                type="button"
                disabled={!enabled}
                aria-pressed={selected}
                onClick={() => {
                  onModeChange('slot')
                  onSlotChange(item)
                }}
                className={slotButtonClass(selected, enabled)}
              >
                {item.label}
              </button>
            )
          })}
        </div>
      ) : (
        <div className="flex flex-col gap-2">
          <div className="flex items-center gap-2">
            <button
              type="button"
              aria-pressed={mode === 'asap'}
              onClick={() => onModeChange('asap')}
              className={cn(slotButtonClass(mode === 'asap', true), 'min-w-0 flex-1 rounded-2xl py-2.5 text-sm')}
            >
              Как можно скорее
            </button>
            <label htmlFor="pickup-time" className="sr-only">
              Время самовывоза, 24 часа
            </label>
            <input
              id="pickup-time"
              type="text"
              inputMode="numeric"
              autoComplete="off"
              placeholder="14:30"
              maxLength={5}
              value={pickupInput}
              onChange={(event) => handlePickupInput(constrainPickupDraft(event.target.value))}
              className={cn(
                'h-[42px] w-[6.5rem] shrink-0 rounded-2xl border border-input bg-background px-3 text-center text-sm tabular-nums text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring',
                mode === 'slot' && pickupInput && !pickupError && 'border-primary',
              )}
            />
          </div>
          {pickupError ? (
            <p className="text-xs font-semibold leading-relaxed text-red-600">{pickupError}</p>
          ) : (
            <p className="text-[11px] text-muted-foreground">Мы работаем для вас с 8:00 до 21:30</p>
          )}
        </div>
      )}

      {isDelivery ? (
        <p className="text-[11px] text-muted-foreground">
          Доставка от 60 минут, точное время у оператора
        </p>
      ) : null}
    </fieldset>
  )
}
