'use client'

import { useState } from 'react'
import { Package, Croissant, Archive, Menu, X } from 'lucide-react'
import { AdminOrdersList } from '@/components/admin-orders-list'
import { AdminProducts } from '@/components/admin-products'
import { AdminSignOutButton } from '@/components/admin-sign-out-button'

type Tab = 'orders' | 'archive' | 'products'

export default function AdminDashboard() {
  const [activeTab, setActiveTab] = useState<Tab>('orders')
  const [sidebarOpen, setSidebarOpen] = useState(false)

  const navItems: { id: Tab; label: string; icon: typeof Package }[] = [
    { id: 'orders', label: '📦 Заказы', icon: Package },
    { id: 'archive', label: '📁 Архив', icon: Archive },
    { id: 'products', label: '🍩 Товары', icon: Croissant },
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
                {item.label}
              </button>
            )
          })}
        </nav>

        <div className="border-t border-gray-100 px-3 py-4">
          <AdminSignOutButton />
          <p className="mt-3 px-3 text-xs text-gray-400">Панель сотрудника кулинарии</p>
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
            {navItems.find((item) => item.id === activeTab)?.label}
          </span>
          <div className="size-9" />
        </header>

        <main className="flex-1 px-3 py-4 sm:px-4 lg:px-6 lg:py-5">
          {activeTab === 'orders' ? (
            <AdminOrdersList mode="active" />
          ) : activeTab === 'archive' ? (
            <AdminOrdersList mode="archive" />
          ) : (
            <AdminProducts />
          )}
        </main>
      </div>
    </div>
  )
}

