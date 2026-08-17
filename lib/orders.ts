import type { CartItem } from '@/lib/cart'
import {
  CHECKOUT_LIMITS,
  normalizePhone,
  sanitizeCheckoutFields,
  sanitizePlainText,
  validateCheckoutFields,
} from '@/lib/checkout-validation'
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
  const fields = sanitizeCheckoutFields({
    name: input.customerName,
    phone: input.phone,
    comment: input.comment,
    address: input.address,
    apartment: input.apartment,
    entrance: input.entrance,
    intercom: input.intercom,
  })
  const phone = normalizePhone(fields.phone)
  const fieldErrors = validateCheckoutFields(fields, input.fulfillment)
  if (!phone || Object.keys(fieldErrors).length > 0) {
    throw new Error(Object.values(fieldErrors)[0] ?? 'Проверьте телефон, адрес и комментарий')
  }

  const items = cartItemsToOrderItems(input.items).slice(0, CHECKOUT_LIMITS.items)
  if (items.length === 0) throw new Error('Корзина пуста')

  return {
    status: DEFAULT_ORDER_STATUS,
    customer_name: fields.name,
    phone,
    comment: fields.comment || null,
    fulfillment: input.fulfillment,
    address: isDelivery ? fields.address : null,
    apartment: isDelivery ? fields.apartment : null,
    entrance: isDelivery ? fields.entrance : null,
    intercom: isDelivery ? fields.intercom : null,
    lat: isDelivery ? (input.coords?.lat ?? null) : null,
    lng: isDelivery ? (input.coords?.lng ?? null) : null,
    time_mode: input.timeMode,
    time_label: sanitizePlainText(input.timeLabel, CHECKOUT_LIMITS.timeLabel) || null,
    items,
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

function isMissingRpc(error: { code?: string; message?: string } | null) {
  if (!error) return false
  return (
    error.code === 'PGRST202' ||
    error.code === '42883' ||
    /could not find the function/i.test(error.message ?? '') ||
    /does not exist/i.test(error.message ?? '')
  )
}

export async function createOrder(input: CreateOrderInput): Promise<{ orderNumber: string }> {
  const supabase = getSupabase()
  if (!supabase) throw new Error(SUPABASE_MISSING)

  const payload = toInsertRow(input)

  const rpc = await supabase.rpc('place_storefront_order', {
    p_customer_name: payload.customer_name,
    p_phone: payload.phone,
    p_comment: payload.comment,
    p_fulfillment: payload.fulfillment,
    p_address: payload.address,
    p_apartment: payload.apartment,
    p_entrance: payload.entrance,
    p_intercom: payload.intercom,
    p_lat: payload.lat,
    p_lng: payload.lng,
    p_time_mode: payload.time_mode,
    p_time_label: payload.time_label,
    p_items: payload.items,
    p_subtotal: payload.subtotal,
    p_delivery_fee: payload.delivery_fee,
    p_total: payload.total,
  })

  if (!rpc.error && rpc.data) {
    return { orderNumber: String(rpc.data) }
  }

  if (rpc.error && !isMissingRpc(rpc.error)) {
    throw new Error(rpc.error.message)
  }

  let orderNumber = generateOrderNumber()
  let { error } = await supabase.from('orders').insert({ ...payload, order_number: orderNumber })

  if (error?.code === '23505') {
    orderNumber = generateOrderNumber()
    const retry = await supabase.from('orders').insert({ ...payload, order_number: orderNumber })
    error = retry.error
  }

  if (error) {
    throw new Error(error.message)
  }

  return { orderNumber }
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
    .channel(`admin-orders-${crypto.randomUUID()}`)
    .on('postgres_changes', { event: '*', schema: 'public', table: 'orders' }, onChange)
    .subscribe()

  return () => {
    void supabase.removeChannel(channel)
  }
}
