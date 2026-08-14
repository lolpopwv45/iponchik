export const KITCHEN_HOUR_START = 8
export const KITCHEN_HOUR_END = 22
export const ORDER_HOUR_START = 10
export const ORDER_HOUR_END = 21
export const DELIVERY_ASAP_HOURS = 1
export const SLOT_LOCK_HOURS = 2
export const PICKUP_SLOT_LOCK_MINUTES = 30

export interface TimeSlot {
  from: number
  minutes: number
  to: number
  label: string
}

export type TimeMode = 'asap' | 'slot'

function pad2(value: number) {
  return String(value).padStart(2, '0')
}

export const TIME_SLOTS: TimeSlot[] = Array.from(
  { length: KITCHEN_HOUR_END - ORDER_HOUR_START },
  (_, index) => {
    const from = ORDER_HOUR_START + index
    const to = from + 1
    return { from, minutes: 0, to, label: `${pad2(from)}:00–${pad2(to)}:00` }
  },
)

export function makePickupSlot(hours: number, minutes: number): TimeSlot {
  return {
    from: hours,
    minutes,
    to: hours,
    label: `${pad2(hours)}:${pad2(minutes)}`,
  }
}

export const PICKUP_HOUR_START = KITCHEN_HOUR_START
export const PICKUP_LAST_HOUR = 21
export const PICKUP_LAST_MINUTE = 30
const PICKUP_MIN_MINUTES = PICKUP_HOUR_START * 60
const PICKUP_MAX_MINUTES = PICKUP_LAST_HOUR * 60 + PICKUP_LAST_MINUTE

function isValidClockPrefix(digits: string) {
  if (digits.length === 0) return true

  const hourTens = Number(digits[0])
  if (digits.length === 1) return hourTens <= 2

  const hours = Number(digits.slice(0, 2))
  if (hours > 23) return false
  if (digits.length === 2) return true

  const minuteTens = Number(digits[2])
  if (minuteTens > 5) return false
  if (digits.length === 3) return true

  const minutes = Number(digits.slice(2, 4))
  return minutes <= 59
}

/** Существующие часы 00:00–23:59. 25:70 набрать нельзя. */
export function constrainPickupDraft(raw: string) {
  let source = raw.replace(/\D/g, '')
  if (/^[3-9]/.test(source)) source = `0${source}`
  source = source.slice(0, 4)

  let digits = ''
  for (const char of source) {
    if (isValidClockPrefix(digits + char)) digits += char
  }

  if (digits.length <= 2) return digits
  return `${digits.slice(0, 2)}:${digits.slice(2)}`
}

export function parsePickupTime(value: string): TimeSlot | null {
  const match = value.trim().match(/^(\d{1,2}):(\d{2})$/)
  if (!match) return null
  const hours = Number(match[1])
  const minutes = Number(match[2])
  if (hours < 0 || hours > 23 || minutes < 0 || minutes > 59) return null
  return makePickupSlot(hours, minutes)
}

export function pickupTimeError(slot: TimeSlot, now = new Date()) {
  const totalMinutes = slot.from * 60 + slot.minutes
  if (totalMinutes < PICKUP_MIN_MINUTES) return 'Мы ещё не работаем'
  if (totalMinutes > PICKUP_MAX_MINUTES) return 'Мы уже не работаем'

  const start = new Date(now)
  start.setHours(slot.from, slot.minutes, 0, 0)
  if (start.getTime() <= now.getTime()) return 'Это время уже прошло'
  if (start.getTime() - now.getTime() < PICKUP_SLOT_LOCK_MINUTES * 60 * 1000) {
    return 'Не раньше чем через 30 минут — это время на готовку'
  }
  return null
}

export function isPickupSlotOpen(slot: TimeSlot, now = new Date()) {
  return pickupTimeError(slot, now) == null
}

export function formatAsapDuration() {
  return '60 минут'
}

/** Заказы до 21:00 включительно, кухня до 22:00. */
export function isOrderingOpen(now = new Date()) {
  return now.getHours() <= ORDER_HOUR_END
}

/** Слот открыт, если до него ещё не меньше 2 часов. Пересчёт только в :00. */
export function isSlotOpen(slot: TimeSlot, now = new Date()) {
  return slot.from >= now.getHours() + SLOT_LOCK_HOURS
}

export function slotsForDate(date: Date, now = new Date()) {
  const isToday =
    date.getFullYear() === now.getFullYear() &&
    date.getMonth() === now.getMonth() &&
    date.getDate() === now.getDate()

  if (!isToday) return TIME_SLOTS
  return TIME_SLOTS.filter((slot) => isSlotOpen(slot, now))
}

export function formatOrderTime(mode: TimeMode, slot: TimeSlot | null, fulfillment: 'pickup' | 'delivery') {
  if (mode === 'asap') {
    return fulfillment === 'delivery'
      ? `Как можно скорее (~${formatAsapDuration()})`
      : 'Как можно скорее — готовим с пылу жару'
  }
  return slot ? slot.label : ''
}
