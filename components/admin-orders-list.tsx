'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import { AlarmClock, Loader2, MapPin, RefreshCw, Store, Truck } from 'lucide-react'
import { BADGE_META } from '@/lib/products'
import { isSupabaseConfigured } from '@/lib/supabase'
import {
  kitchenBadges,
  badgeLabel,
  fetchOrders,
  formatDeliveryAddress,
  formatOrderCreatedShort,
  isHandedPendingArchive,
  isOrderArchived,
  orderAsapDeadlines,
  orderDueLabel,
  ORDER_STATUS_STYLES,
  sortActiveOrders,
  sortArchivedOrders,
  statusesForFulfillment,
  subscribeOrders,
  updateOrderStatus,
  type Order,
  type OrderItem,
  type OrderStatus,
} from '@/lib/orders'
import { cn } from '@/lib/utils'

type OrdersTab = 'all' | 'kitchen' | 'logistics'

const KITCHEN_STATUSES: readonly OrderStatus[] = ['Не подтвержден', 'Подтвержден', 'Готовится']
const LOGISTICS_STATUSES: readonly OrderStatus[] = ['В доставке', 'Готов/Выдан']

const TABS: { id: OrdersTab; label: string }[] = [
  { id: 'all', label: 'Все заказы' },
  { id: 'kitchen', label: '🔪 Кухня' },
  { id: 'logistics', label: '🚗 Логистика' },
]

function useOrderColumnCount() {
  const [count, setCount] = useState(1)

  useEffect(() => {
    const sm = window.matchMedia('(min-width: 640px)')
    const xl = window.matchMedia('(min-width: 1280px)')

    function update() {
      setCount(xl.matches ? 3 : sm.matches ? 2 : 1)
    }

    update()
    sm.addEventListener('change', update)
    xl.addEventListener('change', update)
    return () => {
      sm.removeEventListener('change', update)
      xl.removeEventListener('change', update)
    }
  }, [])

  return count
}

function splitIntoColumns<T>(items: T[], columnCount: number) {
  const columns = Array.from({ length: columnCount }, () => [] as T[])
  items.forEach((item, index) => {
    columns[index % columnCount].push(item)
  })
  return columns
}

export function AdminOrdersList({ mode = 'active' }: { mode?: 'active' | 'archive' }) {
  const [orders, setOrders] = useState<Order[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [updatingId, setUpdatingId] = useState<string | null>(null)
  const [activeTab, setActiveTab] = useState<OrdersTab>('kitchen')
  // 0 on SSR + first client paint so archive split does not hydrate-mismatch.
  const [now, setNow] = useState(0)
  const columnCount = useOrderColumnCount()

  useEffect(() => {
    const tick = () => setNow(Date.now())
    tick()
    const timerId = window.setInterval(tick, 1000)
    return () => window.clearInterval(timerId)
  }, [])

  const loadOrders = useCallback(async () => {
    setError('')
    try {
      const next = await fetchOrders()
      setOrders(next)
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : 'Не удалось загрузить заказы')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    if (!isSupabaseConfigured()) {
      setLoading(false)
      return
    }

    void loadOrders()

    let refreshTimer: number | undefined
    const unsubscribe = subscribeOrders(() => {
      window.clearTimeout(refreshTimer)
      refreshTimer = window.setTimeout(() => {
        void loadOrders()
      }, 250)
    })

    return () => {
      window.clearTimeout(refreshTimer)
      unsubscribe()
    }
  }, [loadOrders])

  async function handleStatusChange(order: Order, status: OrderStatus) {
    if (status === order.status) return

    const previous = { status: order.status, updated_at: order.updated_at }
    const nextUpdatedAt = new Date().toISOString()
    setUpdatingId(order.id)
    setOrders((current) =>
      current.map((item) =>
        item.id === order.id ? { ...item, status, updated_at: nextUpdatedAt } : item,
      ),
    )

    try {
      await updateOrderStatus(order.id, status)
    } catch (updateError) {
      setOrders((current) =>
        current.map((item) =>
          item.id === order.id
            ? { ...item, status: previous.status, updated_at: previous.updated_at }
            : item,
        ),
      )
      setError(updateError instanceof Error ? updateError.message : 'Не удалось обновить статус')
    } finally {
      setUpdatingId(null)
    }
  }

  const filteredOrders = useMemo(() => {
    const archived = orders.filter((order) => isOrderArchived(order, now))
    const active = orders.filter((order) => !isOrderArchived(order, now))

    if (mode === 'archive') return sortArchivedOrders(archived)
    if (activeTab === 'kitchen') {
      return sortActiveOrders(
        active.filter((order) => KITCHEN_STATUSES.includes(order.status)),
        now,
      )
    }
    if (activeTab === 'logistics') {
      return sortActiveOrders(
        active.filter((order) => LOGISTICS_STATUSES.includes(order.status)),
        now,
      )
    }
    return sortActiveOrders(active, now)
  }, [activeTab, mode, now, orders])

  if (!isSupabaseConfigured()) {
    return (
      <div className="rounded-2xl border border-amber-200 bg-amber-50 px-6 py-10">
        <h1 className="text-2xl font-bold tracking-tight text-gray-900">Актуальные заказы</h1>
        <p className="mt-3 max-w-xl text-sm leading-relaxed text-amber-900">
          Чтобы видеть заявки, добавьте <code className="font-semibold">NEXT_PUBLIC_SUPABASE_URL</code> и{' '}
          <code className="font-semibold">NEXT_PUBLIC_SUPABASE_ANON_KEY</code> в{' '}
          <code className="font-semibold">.env.local</code> и выполните SQL из{' '}
          <code className="font-semibold">supabase/migrations/20260817_orders_number_and_status.sql</code>.
        </p>
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center justify-between gap-3">
        <h1 className="text-xl font-bold tracking-tight text-gray-900 sm:text-2xl">
          {mode === 'archive' ? 'Архив заказов' : 'Актуальные заказы'}
        </h1>
        <button
          type="button"
          onClick={() => {
            setLoading(true)
            void loadOrders()
          }}
          className="inline-flex items-center gap-2 rounded-xl border border-gray-200 bg-white px-3 py-2 text-sm font-semibold text-gray-600 hover:bg-gray-50"
        >
          <RefreshCw className={cn('size-4', loading && 'animate-spin')} aria-hidden="true" />
          <span className="hidden sm:inline">Обновить</span>
        </button>
      </div>

      {mode === 'active' ? (
      <div
        role="tablist"
        aria-label="Фильтр заказов"
        className="grid grid-cols-3 gap-1 rounded-xl border border-gray-200 bg-white p-1"
      >
        {TABS.map((tab) => {
          const isActive = activeTab === tab.id
          return (
            <button
              key={tab.id}
              type="button"
              role="tab"
              aria-selected={isActive}
              onClick={() => setActiveTab(tab.id)}
              className={cn(
                'rounded-lg px-1.5 py-2 text-center text-xs font-bold transition-colors sm:px-3 sm:text-sm',
                isActive
                  ? 'bg-orange-500 text-white shadow-sm'
                  : 'text-gray-500 hover:bg-gray-50 hover:text-gray-900',
              )}
            >
              {tab.label}
            </button>
          )
        })}
      </div>
      ) : null}

      {error && (
        <p className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-semibold text-red-700" role="alert">
          {error}
        </p>
      )}

      {loading && orders.length === 0 ? (
        <div className="flex items-center justify-center gap-2 rounded-2xl border border-gray-100 bg-white py-16 text-sm text-gray-500">
          <Loader2 className="size-4 animate-spin" aria-hidden="true" />
          Загружаем заказы…
        </div>
      ) : orders.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-gray-200 bg-white px-6 py-16 text-center">
          <p className="text-base font-bold text-gray-900">
            {mode === 'archive' ? 'Архив пуст' : 'Пока нет заказов'}
          </p>
          <p className="mt-1 text-sm text-gray-500">
            {mode === 'archive'
              ? 'Сюда попадут выданные заказы через минуту и отказы через 30 секунд.'
              : 'Новые заявки с витрины появятся здесь.'}
          </p>
        </div>
      ) : filteredOrders.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-gray-200 bg-white px-6 py-16 text-center">
          <p className="text-base font-bold text-gray-900">
            {mode === 'archive'
              ? 'Архив пуст'
              : activeTab === 'kitchen'
                ? 'На кухне пока пусто'
                : activeTab === 'logistics'
                  ? 'Нет заказов в логистике'
                  : 'Нет актуальных заказов'}
          </p>
          <p className="mt-1 text-sm text-gray-500">
            {mode === 'archive'
              ? 'Сюда попадут выданные заказы через минуту и отказы через 30 секунд.'
              : 'Переключите вкладку, чтобы увидеть остальные заявки.'}
          </p>
        </div>
      ) : (
        <div className="flex items-start gap-3">
          {splitIntoColumns(filteredOrders, columnCount).map((column, columnIndex) => (
            <div key={columnIndex} className="flex min-w-0 flex-1 flex-col gap-3">
              {column.map((order) => (
                <OrderCard
                  key={order.id}
                  order={order}
                  updating={updatingId === order.id}
                  muted={mode === 'archive' || isHandedPendingArchive(order, now)}
                  onStatusChange={handleStatusChange}
                />
              ))}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

function OrderCard({
  order,
  updating,
  muted = false,
  onStatusChange,
}: {
  order: Order
  updating: boolean
  muted?: boolean
  onStatusChange: (order: Order, status: OrderStatus) => void
}) {
  const statusOptions = statusesForFulfillment(order.fulfillment)
  const selectOptions = statusOptions.includes(order.status)
    ? statusOptions
    : [order.status, ...statusOptions]
  const deliveryAddress = formatDeliveryAddress(order)
  const isDelivery = order.fulfillment === 'delivery'
  const comment = order.comment?.trim() ?? ''
  const dueLabel = orderDueLabel(order)
  const asapDeadlines = orderAsapDeadlines(order)

  return (
    <article
      className={cn(
        'flex h-fit min-w-0 flex-col overflow-hidden rounded-2xl border bg-white shadow-sm',
        muted ? 'border-gray-200 opacity-70' : 'border-gray-200',
      )}
    >
      <header className="flex items-start justify-between gap-2 px-3 pt-3">
        <p className="min-w-0 truncate text-xl font-extrabold tracking-tight text-gray-900">{order.order_number}</p>
        <div className="flex shrink-0 items-center gap-1.5">
          <select
            value={order.status}
            disabled={updating}
            onChange={(event) => onStatusChange(order, event.target.value as OrderStatus)}
            className={cn(
              'max-w-[11.5rem] min-h-11 rounded-lg border px-2 py-2 text-sm font-semibold outline-none focus:border-orange-400 focus:ring-2 focus:ring-orange-100 disabled:cursor-wait disabled:opacity-60',
              ORDER_STATUS_STYLES[order.status],
            )}
          >
            {selectOptions.map((status) => (
              <option key={status} value={status}>
                {status}
              </option>
            ))}
          </select>
          {updating && <Loader2 className="size-4 shrink-0 animate-spin text-orange-500" aria-label="Сохраняем статус" />}
        </div>
      </header>

      <div className="mx-3 mt-2 rounded-xl border border-orange-200 bg-orange-50 px-3 py-2">
        <div className="flex items-start gap-2">
          <AlarmClock className="mt-0.5 size-5 shrink-0 text-orange-600" aria-hidden="true" />
          <div className="min-w-0">
            {asapDeadlines ? (
              <>
                <p className="text-[10px] font-bold uppercase tracking-wide text-orange-600">Побыстрее</p>
                <p className="text-base font-extrabold leading-tight text-orange-800 sm:text-lg">
                  Повару до {asapDeadlines.cookUntil}
                </p>
                {asapDeadlines.courierUntil ? (
                  <p className="text-sm font-bold leading-tight text-orange-700">
                    Курьеру до {asapDeadlines.courierUntil}
                  </p>
                ) : null}
              </>
            ) : (
              <>
                <p className="text-[10px] font-bold uppercase tracking-wide text-orange-600">Отдать к</p>
                <p className="text-base font-extrabold leading-tight text-orange-800 sm:text-lg">{dueLabel}</p>
              </>
            )}
          </div>
        </div>
        <p className="mt-1.5 text-xs font-medium text-orange-900/70">Создан {formatOrderCreatedShort(order.created_at)}</p>
      </div>

      <div className="bg-white px-3 py-3">
        <ul className="flex flex-col gap-1">
          {order.items.length === 0 ? (
            <li className="text-sm text-gray-400">Состав заказа не указан</li>
          ) : (
            order.items.map((item, index) => (
              <li key={`${item.id}-${index}`} className="text-base font-semibold leading-snug text-gray-900">
                {item.quantity}× {item.name}
                <ItemBadgeMarks item={item} />
              </li>
            ))
          )}
        </ul>
        {!isDelivery && comment ? (
          <p className="mt-2 text-xs leading-relaxed text-gray-500">Комментарий: {comment}</p>
        ) : null}
      </div>

      <div className="border-t border-dashed border-gray-300 bg-gray-50 px-3 py-3">
        <p className="truncate text-sm font-semibold text-gray-800">
          {order.customer_name}
          <span className="text-gray-300"> • </span>
          <a href={`tel:${order.phone}`} className="font-medium text-gray-600 hover:text-orange-600">
            {order.phone}
          </a>
        </p>

        <div className="mt-1.5 flex items-start gap-1.5 text-sm text-gray-700">
          {isDelivery ? (
            <Truck className="mt-0.5 size-4 shrink-0 text-gray-500" aria-hidden="true" />
          ) : (
            <Store className="mt-0.5 size-4 shrink-0 text-gray-500" aria-hidden="true" />
          )}
          <div className="min-w-0">
            <p className="font-semibold">{isDelivery ? 'Доставка' : 'Самовывоз'}</p>
            {isDelivery && deliveryAddress ? (
              <p className="mt-0.5 flex items-start gap-1 text-xs leading-relaxed text-gray-600">
                <MapPin className="mt-0.5 size-3 shrink-0" aria-hidden="true" />
                {deliveryAddress}
              </p>
            ) : null}
            {isDelivery && comment ? (
              <p className="mt-1 text-xs leading-relaxed text-gray-500">Комментарий: {comment}</p>
            ) : null}
          </div>
        </div>

        <div className="mt-2 flex items-end justify-between gap-2">
          {isDelivery && order.delivery_fee > 0 ? (
            <span className="text-[11px] text-gray-400">Доставка {order.delivery_fee} ₽</span>
          ) : (
            <span />
          )}
          <p className="text-xl font-extrabold tracking-tight text-gray-900">{order.total} ₽</p>
        </div>
      </div>
    </article>
  )
}

function ItemBadgeMarks({ item }: { item: OrderItem }) {
  const badges = kitchenBadges(item.badges)
  if (badges.length === 0) return null

  return (
    <span className="ml-1.5 inline-flex items-baseline gap-1 align-baseline">
      {badges.map((badge) => {
        const meta = BADGE_META[badge]
        if (meta?.emoji) {
          return (
            <span key={badge} title={badgeLabel(badge)} aria-label={badgeLabel(badge)}>
              {meta.emoji}
            </span>
          )
        }
        return (
          <span key={badge} className="text-xs font-normal text-gray-400">
            ({badgeLabel(badge)})
          </span>
        )
      })}
    </span>
  )
}
