import type { CartItem } from '@/lib/cart'
import type { ProductBadge } from '@/lib/products'
import { BADGE_META } from '@/lib/products'
import { getSupabase } from '@/lib/supabase'
import {
  COOK_ASAP_HOURS,
  DELIVERY_ASAP_HOURS,
  DISPLAY_TIME_ZONE,
  addHoursToIso,
  formatClock,
  type TimeMode,
} from '@/lib/order-time'
import type { LatLng } from '@/lib/geo'

export const ORDER_STATUSES = [
  'Не подтвержден',
  'Отказ',
  'Подтвержден',
  'Готовится',
  'В доставке',
  'Готов/Выдан',
] as const

export type OrderStatus = (typeof ORDER_STATUSES)[number]

export const DEFAULT_ORDER_STATUS: OrderStatus = 'Не подтвержден'

export type Fulfillment = 'pickup' | 'delivery'

export interface OrderItem {
  id: number
  name: string
  price: number
  quantity: number
  image?: string
  badges?: ProductBadge[]
}

export interface Order {
  id: string
  order_number: string
  status: OrderStatus
  customer_name: string
  phone: string
  comment: string | null
  fulfillment: Fulfillment
  address: string | null
  apartment: string | null
  entrance: string | null
  intercom: string | null
  lat: number | null
  lng: number | null
  time_mode: TimeMode
  time_label: string | null
  items: OrderItem[]
  subtotal: number
  delivery_fee: number
  total: number
  created_at: string
  updated_at: string
}

export const ORDER_STATUS_STYLES: Record<OrderStatus, string> = {
  'Не подтвержден': 'bg-gray-100 text-red-700 border border-gray-200',
  Отказ: 'bg-stone-100 text-stone-600 border border-stone-300',
  Подтвержден: 'bg-blue-100 text-blue-700 border border-blue-200',
  Готовится: 'bg-amber-100 text-amber-800 border border-amber-200',
  'В доставке': 'bg-violet-100 text-violet-700 border border-violet-200',
  'Готов/Выдан': 'bg-green-100 text-green-700 border border-green-200',
}

const ORDER_NUMBER_ALPHABET = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'

export function isOrderStatus(value: unknown): value is OrderStatus {
  return typeof value === 'string' && (ORDER_STATUSES as readonly string[]).includes(value)
}

export function generateOrderNumber() {
  const bytes = new Uint8Array(5)
  crypto.getRandomValues(bytes)
  let code = ''
  for (const byte of bytes) {
    code += ORDER_NUMBER_ALPHABET[byte % ORDER_NUMBER_ALPHABET.length]
  }
  return `№ ${code}`
}

export function statusesForFulfillment(fulfillment: Fulfillment): OrderStatus[] {
  const workflow: OrderStatus[] = ['Не подтвержден', 'Отказ', 'Готовится', 'В доставке', 'Готов/Выдан']
  if (fulfillment === 'delivery') return workflow
  return workflow.filter((status) => status !== 'В доставке')
}

export const ARCHIVE_AFTER_MS = {
  Отказ: 30_000,
  'Готов/Выдан': 60_000,
} as const

export function isArchiveCandidate(status: OrderStatus): status is keyof typeof ARCHIVE_AFTER_MS {
  return status === 'Отказ' || status === 'Готов/Выдан'
}

export function isOrderArchived(order: Pick<Order, 'status' | 'updated_at'>, now = Date.now()) {
  if (!isArchiveCandidate(order.status)) return false
  const changedAt = new Date(order.updated_at).getTime()
  if (Number.isNaN(changedAt)) return false
  return now - changedAt >= ARCHIVE_AFTER_MS[order.status]
}

export function isHandedPendingArchive(order: Pick<Order, 'status' | 'updated_at'>, now = Date.now()) {
  return order.status === 'Готов/Выдан' && !isOrderArchived(order, now)
}

export function sortActiveOrders(orders: Order[], now = Date.now()) {
  return [...orders].sort((left, right) => {
    const leftDown = isHandedPendingArchive(left, now)
    const rightDown = isHandedPendingArchive(right, now)
    if (leftDown !== rightDown) return leftDown ? 1 : -1
    return new Date(right.created_at).getTime() - new Date(left.created_at).getTime()
  })
}

export function sortArchivedOrders(orders: Order[]) {
  return [...orders].sort(
    (left, right) => new Date(right.updated_at).getTime() - new Date(left.updated_at).getTime(),
  )
}

export function cartItemsToOrderItems(items: CartItem[]): OrderItem[] {
  return items.map((item) => ({
    id: item.id,
    name: item.name,
    price: item.price,
    quantity: item.quantity,
    image: item.image,
    badges: item.badges ?? [],
  }))
}

export function formatOrderCreatedAt(iso: string) {
  return new Date(iso).toLocaleString('ru-RU', {
    timeZone: DISPLAY_TIME_ZONE,
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

export function formatOrderCreatedShort(iso: string) {
  const date = new Date(iso)
  const day = date.toLocaleDateString('ru-RU', {
    timeZone: DISPLAY_TIME_ZONE,
    day: '2-digit',
    month: '2-digit',
  })
  const time = date.toLocaleTimeString('ru-RU', {
    timeZone: DISPLAY_TIME_ZONE,
    hour: '2-digit',
    minute: '2-digit',
  })
  return `${day} в ${time}`
}

export function orderDueLabel(order: Pick<Order, 'time_label' | 'time_mode'>) {
  const label = order.time_label?.trim()
  if (label) return label
  return order.time_mode === 'asap' ? 'Побыстрее' : 'Время не указано'
}

export function orderAsapDeadlines(order: Pick<Order, 'created_at' | 'fulfillment' | 'time_mode'>) {
  if (order.time_mode !== 'asap') return null

  return {
    cookUntil: formatClock(addHoursToIso(order.created_at, COOK_ASAP_HOURS)),
    courierUntil:
      order.fulfillment === 'delivery'
        ? formatClock(addHoursToIso(order.created_at, DELIVERY_ASAP_HOURS))
        : null,
  }
}

export function formatDeliveryAddress(order: Order) {
  if (order.fulfillment !== 'delivery') return null

  const details = [
    order.address,
    order.apartment ? `кв. ${order.apartment}` : null,
    order.entrance ? `подъезд ${order.entrance}` : null,
    order.intercom ? `домофон ${order.intercom}` : null,
  ].filter(Boolean)

  return details.join(', ')
}

export function itemLineTotal(item: OrderItem) {
  return item.price * item.quantity
}

export function badgeLabel(badge: ProductBadge) {
  return BADGE_META[badge]?.label ?? badge
}

export function kitchenBadges(badges: ProductBadge[] | undefined) {
  return (badges ?? []).filter(
    (badge) => badge === 'spicy' || badge === 'meatless' || badge === 'frozen',
  )
}

export interface CreateOrderInput {
  customerName: string
  phone: string
  comment: string
  fulfillment: Fulfillment
  address: string
  apartment: string
  entrance: string
  intercom: string
  coords: LatLng | null
  timeMode: TimeMode
  timeLabel: string
  items: CartItem[]
  subtotal: number
  deliveryFee: number
  total: number
}

interface OrderInsertRow {
  status: OrderStatus
  customer_name: string
  phone: string
  comment: string | null
  fulfillment: Fulfillment
  address: string | null
  apartment: string | null
  entrance: string | null
  intercom: string | null
  lat: number | null
  lng: number | null
  time_mode: TimeMode
  time_label: string | null
  items: OrderItem[]
  subtotal: number
  delivery_fee: number
  total: number
  order_number?: string
}

function toInsertRow(input: CreateOrderInput): OrderInsertRow {
  const isDelivery = input.fulfillment === 'delivery'
  return {
    status: DEFAULT_ORDER_STATUS,
    customer_name: input.customerName.trim(),
    phone: input.phone.trim(),
    comment: input.comment.trim() || null,
    fulfillment: input.fulfillment,
    address: isDelivery ? input.address.trim() : null,
    apartment: isDelivery ? input.apartment.trim() : null,
    entrance: isDelivery ? input.entrance.trim() : null,
    intercom: isDelivery ? input.intercom.trim() : null,
    lat: isDelivery ? (input.coords?.lat ?? null) : null,
    lng: isDelivery ? (input.coords?.lng ?? null) : null,
    time_mode: input.timeMode,
    time_label: input.timeLabel || null,
    items: cartItemsToOrderItems(input.items),
    subtotal: input.subtotal,
    delivery_fee: input.deliveryFee,
    total: input.total,
  }
}

function parseItems(value: unknown): OrderItem[] {
  if (!Array.isArray(value)) return []

  return value.flatMap((item) => {
    if (!item || typeof item !== 'object') return []
    const row = item as Record<string, unknown>
    if (typeof row.name !== 'string' || typeof row.price !== 'number' || typeof row.quantity !== 'number') {
      return []
    }
    return [
      {
        id: typeof row.id === 'number' ? row.id : 0,
        name: row.name,
        price: row.price,
        quantity: row.quantity,
        image: typeof row.image === 'string' ? row.image : undefined,
        badges: Array.isArray(row.badges) ? (row.badges as ProductBadge[]) : [],
      },
    ]
  })
}

export function mapOrderRow(row: Record<string, unknown>): Order {
  const fulfillment: Fulfillment = row.fulfillment === 'delivery' ? 'delivery' : 'pickup'
  const timeMode: TimeMode = row.time_mode === 'slot' ? 'slot' : 'asap'

  return {
    id: String(row.id ?? ''),
    order_number: String(row.order_number ?? ''),
    status: isOrderStatus(row.status) ? row.status : DEFAULT_ORDER_STATUS,
    customer_name: String(row.customer_name ?? ''),
    phone: String(row.phone ?? ''),
    comment: typeof row.comment === 'string' ? row.comment : null,
    fulfillment,
    address: typeof row.address === 'string' ? row.address : null,
    apartment: typeof row.apartment === 'string' ? row.apartment : null,
    entrance: typeof row.entrance === 'string' ? row.entrance : null,
    intercom: typeof row.intercom === 'string' ? row.intercom : null,
    lat: typeof row.lat === 'number' ? row.lat : null,
    lng: typeof row.lng === 'number' ? row.lng : null,
    time_mode: timeMode,
    time_label: typeof row.time_label === 'string' ? row.time_label : null,
    items: parseItems(row.items),
    subtotal: Number(row.subtotal ?? 0),
    delivery_fee: Number(row.delivery_fee ?? 0),
    total: Number(row.total ?? 0),
    created_at: String(row.created_at ?? ''),
    updated_at: String(row.updated_at ?? ''),
  }
}

const SUPABASE_MISSING = 'Не заданы NEXT_PUBLIC_SUPABASE_URL и NEXT_PUBLIC_SUPABASE_ANON_KEY'

export async function createOrder(input: CreateOrderInput): Promise<{ orderNumber: string }> {
  const supabase = getSupabase()
  if (!supabase) throw new Error(SUPABASE_MISSING)

  const payload = toInsertRow(input)

  const insert = (row: OrderInsertRow) =>
    supabase.from('orders').insert(row).select('order_number').single()

  let { data, error } = await insert(payload)

  const needsGeneratedNumber =
    Boolean(error) &&
    (error?.code === '23502' ||
      error?.code === '23514' ||
      /order_number/i.test(error?.message ?? '') ||
      /null value/i.test(error?.message ?? ''))

  if (needsGeneratedNumber || error?.code === '23505') {
    const retry = await insert({ ...payload, order_number: generateOrderNumber() })
    data = retry.data
    error = retry.error
  }

  if (error?.code === '23505') {
    const retry = await insert({ ...payload, order_number: generateOrderNumber() })
    data = retry.data
    error = retry.error
  }

  if (error || !data?.order_number) {
    throw new Error(error?.message ?? 'Не удалось оформить заказ')
  }

  return { orderNumber: String(data.order_number) }
}

export async function fetchOrders(): Promise<Order[]> {
  const supabase = getSupabase()
  if (!supabase) throw new Error(SUPABASE_MISSING)

  const { data, error } = await supabase
    .from('orders')
    .select('*')
    .order('created_at', { ascending: false })

  if (error) throw new Error(error.message)
  return (data ?? []).map((row) => mapOrderRow(row as Record<string, unknown>))
}

export async function updateOrderStatus(id: string, status: OrderStatus) {
  const supabase = getSupabase()
  if (!supabase) throw new Error(SUPABASE_MISSING)

  const { error } = await supabase.from('orders').update({ status }).eq('id', id)
  if (error) throw new Error(error.message)
}

export function subscribeOrders(onChange: () => void) {
  const supabase = getSupabase()
  if (!supabase) return () => {}

  const channel = supabase
    .channel('admin-orders')
    .on('postgres_changes', { event: '*', schema: 'public', table: 'orders' }, onChange)
    .subscribe()

  return () => {
    void supabase.removeChannel(channel)
  }
}
