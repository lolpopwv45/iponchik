'use client'

import { useState } from 'react'
import Image from 'next/image'
import {
  Package,
  Croissant,
  Menu,
  X,
  Pencil,
  Trash2,
  Plus,
  Phone,
  Clock,
} from 'lucide-react'

// ---------------------------------------------------------------------------
// Типы
// ---------------------------------------------------------------------------

type OrderStatus = 'Новый' | 'Готовится' | 'Готов к выдаче'
type Fulfillment = 'pickup' | 'delivery'

interface Order {
  id: string
  customerName: string
  phone: string
  items: string
  total: number
  status: OrderStatus
  time: string
  fulfillment: Fulfillment
  scheduled: string
}

interface Product {
  id: number
  name: string
  image: string
  category: string
  price: number
  inStock: boolean
}

// ---------------------------------------------------------------------------
// Моковые данные
// TODO: заменить на выборку заказов из таблицы `orders` в Supabase
// TODO: заменить на выборку товаров из таблицы `products` в Supabase
// ---------------------------------------------------------------------------

const INITIAL_ORDERS: Order[] = [
  {
    id: '#1042',
    customerName: 'Анна Соколова',
    phone: '+7 999 123-45-67',
    items: '2× Пончик классический, 1× Синнабон',
    total: 328,
    status: 'Готовится',
    time: '14:12',
    fulfillment: 'pickup',
    scheduled: 'Как можно скорее',
  },
  {
    id: '#1041',
    customerName: 'Игорь Петров',
    phone: '+7 985 552-01-19',
    items: '1× Пицца пепперони, 2× Пирожок с картофелем',
    total: 640,
    status: 'Готовится',
    time: '14:05',
    fulfillment: 'delivery',
    scheduled: 'Как можно скорее (~2 ч)',
  },
  {
    id: '#1040',
    customerName: 'Мария Кузнецова',
    phone: '+7 916 340-77-02',
    items: '3× Пончик шоколадный',
    total: 267,
    status: 'Готов к выдаче',
    time: '13:58',
    fulfillment: 'pickup',
    scheduled: '16:00–17:00',
  },
  {
    id: '#1039',
    customerName: 'Дмитрий Волков',
    phone: '+7 903 214-98-45',
    items: '1× Пицца маргарита, 1× Пончик классический',
    total: 519,
    status: 'Новый',
    time: '13:47',
    fulfillment: 'delivery',
    scheduled: '18:00–19:00',
  },
]

const INITIAL_PRODUCTS: Product[] = [
  {
    id: 1,
    name: 'Пончик классический',
    image: '/images/product-donut-classic.png',
    category: 'Пончики',
    price: 89,
    inStock: true,
  },
  {
    id: 2,
    name: 'Пончик шоколадный',
    image: '/images/product-donut-chocolate.png',
    category: 'Пончики',
    price: 99,
    inStock: true,
  },
  {
    id: 3,
    name: 'Пицца пепперони',
    image: '/images/product-pizza-pepperoni.png',
    category: 'Пицца',
    price: 349,
    inStock: false,
  },
  {
    id: 4,
    name: 'Синнабон с корицей',
    image: '/images/product-cinnamon-roll.png',
    category: 'Десерты',
    price: 150,
    inStock: true,
  },
]

const STATUS_FLOW: OrderStatus[] = ['Новый', 'Готовится', 'Готов к выдаче']

const STATUS_STYLES: Record<OrderStatus, string> = {
  Новый: 'bg-orange-100 text-orange-700 border border-orange-200',
  Готовится: 'bg-yellow-100 text-yellow-700 border border-yellow-200',
  'Готов к выдаче': 'bg-green-100 text-green-700 border border-green-200',
}

type Tab = 'orders' | 'products'

export default function AdminDashboard() {
  const [activeTab, setActiveTab] = useState<Tab>('orders')
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [orders, setOrders] = useState<Order[]>(INITIAL_ORDERS)
  const [products, setProducts] = useState<Product[]>(INITIAL_PRODUCTS)

  // Обновление статуса заказа (локально, в UI)
  function handleStatusChange(orderId: string, newStatus: OrderStatus) {
    // TODO: UPDATE order status in Supabase (table `orders`, поле `status`)
    setOrders((prev) =>
      prev.map((order) => (order.id === orderId ? { ...order, status: newStatus } : order)),
    )
  }

  // Переключение наличия товара
  function handleToggleStock(productId: number) {
    // TODO: UPDATE product availability in Supabase (table `products`, поле `in_stock`)
    setProducts((prev) =>
      prev.map((product) =>
        product.id === productId ? { ...product, inStock: !product.inStock } : product,
      ),
    )
  }

  // Удаление товара
  function handleDeleteProduct(productId: number) {
    // TODO: DELETE product from Supabase (table `products`)
    setProducts((prev) => prev.filter((product) => product.id !== productId))
  }

  const navItems: { id: Tab; label: string; icon: typeof Package }[] = [
    { id: 'orders', label: 'Заказы', icon: Package },
    { id: 'products', label: 'Товары', icon: Croissant },
  ]

  return (
    <div className="flex min-h-screen bg-gray-50">
      {/* Мобильный оверлей при открытом сайдбаре */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/30 lg:hidden"
          onClick={() => setSidebarOpen(false)}
          aria-hidden="true"
        />
      )}

      {/* Sidebar */}
      <aside
        className={`fixed inset-y-0 left-0 z-50 flex w-64 flex-col border-r border-gray-100 bg-white transition-transform lg:static lg:translate-x-0 ${
          sidebarOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="flex items-center justify-between gap-2 border-b border-gray-100 px-6 py-5">
          <div className="flex items-center gap-2">
            <div className="flex size-9 items-center justify-center rounded-xl bg-orange-500 text-white">
              <Croissant className="size-5" aria-hidden="true" />
            </div>
            <span className="text-base font-bold text-gray-900">Я-пончик</span>
          </div>
          <button
            type="button"
            onClick={() => setSidebarOpen(false)}
            className="rounded-lg p-1.5 text-gray-400 hover:bg-gray-100 lg:hidden"
            aria-label="Закрыть меню"
          >
            <X className="size-5" aria-hidden="true" />
          </button>
        </div>

        <nav className="flex flex-1 flex-col gap-1 px-3 py-4">
          {navItems.map((item) => {
            const Icon = item.icon
            const isActive = activeTab === item.id
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => {
                  setActiveTab(item.id)
                  setSidebarOpen(false)
                }}
                className={`flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-semibold transition-colors ${
                  isActive
                    ? 'bg-orange-50 text-orange-600'
                    : 'text-gray-500 hover:bg-gray-50 hover:text-gray-900'
                }`}
              >
                <Icon className="size-4.5" aria-hidden="true" />
                {item.id === 'orders' ? '📦 Заказы' : '🍩 Товары'}
              </button>
            )
          })}
        </nav>

        <div className="border-t border-gray-100 px-6 py-4">
          <p className="text-xs text-gray-400">Панель сотрудника кулинарии</p>
        </div>
      </aside>

      {/* Основная область */}
      <div className="flex min-h-screen flex-1 flex-col">
        {/* Мобильный хедер с гамбургером */}
        <header className="flex items-center justify-between border-b border-gray-100 bg-white px-4 py-3 lg:hidden">
          <button
            type="button"
            onClick={() => setSidebarOpen(true)}
            className="rounded-lg p-2 text-gray-500 hover:bg-gray-100"
            aria-label="Открыть меню"
          >
            <Menu className="size-5" aria-hidden="true" />
          </button>
          <span className="text-sm font-bold text-gray-900">
            {activeTab === 'orders' ? '📦 Заказы' : '🍩 Товары'}
          </span>
          <div className="size-9" />
        </header>

        <main className="flex-1 px-4 py-6 sm:px-6 lg:px-8 lg:py-8">
          {activeTab === 'orders' ? (
            <OrdersTab orders={orders} onStatusChange={handleStatusChange} />
          ) : (
            <ProductsTab
              products={products}
              onToggleStock={handleToggleStock}
              onDelete={handleDeleteProduct}
            />
          )}
        </main>
      </div>
    </div>
  )
}

// ---------------------------------------------------------------------------
// Вкладка «Заказы»
// ---------------------------------------------------------------------------

function OrdersTab({
  orders,
  onStatusChange,
}: {
  orders: Order[]
  onStatusChange: (orderId: string, status: OrderStatus) => void
}) {
  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-gray-900">Актуальные заказы</h1>
        <p className="mt-1 text-sm text-gray-500">
          Список заказов обновляется в реальном времени
        </p>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-2">
        {orders.map((order) => (
          <div
            key={order.id}
            className="flex flex-col gap-4 rounded-2xl border border-gray-100 bg-white p-5 shadow-sm"
          >
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-sm font-semibold text-gray-400">{order.id}</p>
                <h3 className="text-base font-bold text-gray-900">{order.customerName}</h3>
              </div>
              <span
                className={`whitespace-nowrap rounded-full px-3 py-1 text-xs font-bold ${STATUS_STYLES[order.status]}`}
              >
                {order.status}
              </span>
            </div>

            <div className="flex flex-col gap-1.5 text-sm text-gray-500">
              <div className="flex items-center gap-2">
                <Phone className="size-3.5 shrink-0" aria-hidden="true" />
                <span>{order.phone}</span>
              </div>
              <div className="flex items-center gap-2">
                <Clock className="size-3.5 shrink-0" aria-hidden="true" />
                <span>
                  {order.fulfillment === 'delivery' ? 'Доставка' : 'Самовывоз'} · {order.scheduled}
                </span>
              </div>
              <p className="text-xs text-gray-400">Оформлен в {order.time}</p>
            </div>

            <p className="rounded-xl bg-gray-50 px-3 py-2.5 text-sm text-gray-600">
              {order.items}
            </p>

            <div className="flex flex-col gap-3 border-t border-gray-100 pt-4">
              <div className="flex items-center justify-between gap-3">
                <span className="text-lg font-extrabold text-gray-900">{order.total} ₽</span>

                <select
                  value={order.status}
                  onChange={(e) => onStatusChange(order.id, e.target.value as OrderStatus)}
                  className="rounded-lg border border-gray-200 bg-white px-3 py-1.5 text-sm font-semibold text-gray-700 outline-none focus:border-orange-400 focus:ring-2 focus:ring-orange-100"
                >
                  {STATUS_FLOW.map((status) => (
                    <option key={status} value={status}>
                      {status}
                    </option>
                  ))}
                </select>
              </div>

              {order.fulfillment === 'pickup' && order.status !== 'Готов к выдаче' && (
                <button
                  type="button"
                  onClick={() => onStatusChange(order.id, 'Готов к выдаче')}
                  className="w-full rounded-xl bg-orange-500 px-4 py-2.5 text-sm font-bold text-white shadow-sm transition-colors hover:bg-orange-600"
                >
                  Готово — можно выдавать
                </button>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

// ---------------------------------------------------------------------------
// Вкладка «Товары»
// ---------------------------------------------------------------------------

function ProductsTab({
  products,
  onToggleStock,
  onDelete,
}: {
  products: Product[]
  onToggleStock: (id: number) => void
  onDelete: (id: number) => void
}) {
  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-gray-900">Наше меню</h1>
          <p className="mt-1 text-sm text-gray-500">Управляйте товарами и их наличием</p>
        </div>

        <button
          type="button"
          onClick={() => {
            // TODO: открыть форму создания товара и INSERT в Supabase (table `products`)
          }}
          className="flex items-center gap-2 rounded-xl bg-orange-500 px-4 py-2.5 text-sm font-bold text-white shadow-sm transition-colors hover:bg-orange-600"
        >
          <Plus className="size-4" aria-hidden="true" />
          Добавить товар
        </button>
      </div>

      <div className="overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-gray-100 bg-gray-50/60">
                <th className="px-5 py-3 font-semibold text-gray-500">Фото</th>
                <th className="px-5 py-3 font-semibold text-gray-500">Название</th>
                <th className="px-5 py-3 font-semibold text-gray-500">Категория</th>
                <th className="px-5 py-3 font-semibold text-gray-500">Цена</th>
                <th className="px-5 py-3 font-semibold text-gray-500">Статус</th>
                <th className="px-5 py-3 font-semibold text-gray-500">Действия</th>
              </tr>
            </thead>
            <tbody>
              {products.map((product) => (
                <tr key={product.id} className="border-b border-gray-50 last:border-0">
                  <td className="px-5 py-3">
                    <div className="relative size-12 overflow-hidden rounded-xl bg-gray-100">
                      <Image
                        src={product.image || '/placeholder.svg'}
                        alt={product.name}
                        fill
                        className="object-cover"
                      />
                    </div>
                  </td>
                  <td className="px-5 py-3 font-semibold text-gray-900">{product.name}</td>
                  <td className="px-5 py-3 text-gray-500">{product.category}</td>
                  <td className="px-5 py-3 font-bold text-gray-900">{product.price} ₽</td>
                  <td className="px-5 py-3">
                    <button
                      type="button"
                      role="switch"
                      aria-checked={product.inStock}
                      onClick={() => onToggleStock(product.id)}
                      className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                        product.inStock ? 'bg-orange-500' : 'bg-gray-200'
                      }`}
                    >
                      <span
                        className={`inline-block size-4.5 rounded-full bg-white shadow transition-transform ${
                          product.inStock ? 'translate-x-6' : 'translate-x-1'
                        }`}
                      />
                    </button>
                    <span
                      className={`ml-2.5 text-xs font-semibold ${
                        product.inStock ? 'text-green-600' : 'text-gray-400'
                      }`}
                    >
                      {product.inStock ? 'В наличии' : 'Нет в наличии'}
                    </span>
                  </td>
                  <td className="px-5 py-3">
                    <div className="flex items-center gap-1.5">
                      <button
                        type="button"
                        onClick={() => {
                          // TODO: открыть форму редактирования и UPDATE товар в Supabase
                        }}
                        aria-label={`Редактировать «${product.name}»`}
                        className="rounded-lg p-2 text-gray-400 hover:bg-gray-100 hover:text-gray-700"
                      >
                        <Pencil className="size-4" aria-hidden="true" />
                      </button>
                      <button
                        type="button"
                        onClick={() => onDelete(product.id)}
                        aria-label={`Удалить «${product.name}»`}
                        className="rounded-lg p-2 text-gray-400 hover:bg-red-50 hover:text-red-600"
                      >
                        <Trash2 className="size-4" aria-hidden="true" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
