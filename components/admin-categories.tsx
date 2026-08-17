'use client'

import { Loader2, Pencil, Plus, Tag, Trash2, X } from 'lucide-react'
import { useState } from 'react'
import type { MenuCategory, Product } from '@/lib/products'
import { cn } from '@/lib/utils'

interface AdminCategoriesProps {
  categories: MenuCategory[]
  products: Product[]
  busy: boolean
  onCreate: (name: string) => Promise<void>
  onRename: (id: number, name: string) => Promise<void>
  onDelete: (category: MenuCategory) => void
}

export function AdminCategories({
  categories,
  products,
  busy,
  onCreate,
  onRename,
  onDelete,
}: AdminCategoriesProps) {
  const [name, setName] = useState('')
  const [editingId, setEditingId] = useState<number | null>(null)
  const [draft, setDraft] = useState('')
  const [saving, setSaving] = useState(false)

  const countByCategory = (id: number) => products.filter((product) => product.categoryId === id).length

  async function handleCreate(event: React.FormEvent) {
    event.preventDefault()
    const nextName = name.trim()
    if (!nextName || saving) return
    setSaving(true)
    try {
      await onCreate(nextName)
      setName('')
    } finally {
      setSaving(false)
    }
  }

  async function handleRename(id: number) {
    const nextName = draft.trim()
    if (!nextName || saving) return
    setSaving(true)
    try {
      await onRename(id, nextName)
      setEditingId(null)
    } finally {
      setSaving(false)
    }
  }

  return (
    <section className="rounded-2xl border border-gray-100 bg-white p-4 shadow-sm sm:p-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="flex items-center gap-2 text-base font-bold text-gray-900">
            <Tag className="size-4 text-orange-500" aria-hidden="true" />
            Категории меню
          </h2>
          <p className="mt-1 text-sm text-gray-500">
            Создайте разделы — гости будут искать по ним товары на витрине
          </p>
        </div>
      </div>

      <form onSubmit={handleCreate} className="mt-4 flex flex-col gap-2 sm:flex-row">
        <label className="sr-only" htmlFor="new-category-name">
          Название категории
        </label>
        <input
          id="new-category-name"
          value={name}
          onChange={(event) => setName(event.target.value)}
          placeholder="Например, Пончики"
          maxLength={40}
          className="min-h-11 flex-1 rounded-xl border border-gray-200 bg-white px-3 text-sm text-gray-900 outline-none placeholder:text-gray-400 focus:border-orange-400 focus:ring-2 focus:ring-orange-100"
        />
        <button
          type="submit"
          disabled={busy || saving || name.trim().length < 2}
          className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-orange-500 px-4 text-sm font-bold text-white shadow-sm transition-colors hover:bg-orange-600 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {saving ? <Loader2 className="size-4 animate-spin" aria-hidden="true" /> : <Plus className="size-4" aria-hidden="true" />}
          Добавить категорию
        </button>
      </form>

      {categories.length === 0 ? (
        <p className="mt-4 rounded-xl border border-dashed border-gray-200 bg-gray-50 px-4 py-6 text-center text-sm text-gray-500">
          Пока нет ни одной категории. Добавьте первую, чтобы можно было создавать товары.
        </p>
      ) : (
        <ul className="mt-4 flex flex-col gap-2">
          {categories.map((category) => {
            const count = countByCategory(category.id)
            const isEditing = editingId === category.id
            return (
              <li
                key={category.id}
                className="flex flex-wrap items-center gap-2 rounded-xl border border-gray-100 bg-gray-50/70 px-3 py-2.5"
              >
                {isEditing ? (
                  <div className="flex min-w-0 flex-1 items-center gap-2">
                    <input
                      value={draft}
                      onChange={(event) => setDraft(event.target.value)}
                      onKeyDown={(event) => {
                        if (event.key === 'Enter') {
                          event.preventDefault()
                          void handleRename(category.id)
                        }
                        if (event.key === 'Escape') setEditingId(null)
                      }}
                      autoFocus
                      maxLength={40}
                      className="min-h-10 min-w-0 flex-1 rounded-lg border border-orange-200 bg-white px-3 text-sm font-semibold text-gray-900 outline-none focus:border-orange-400 focus:ring-2 focus:ring-orange-100"
                    />
                    <button
                      type="button"
                      onClick={() => void handleRename(category.id)}
                      disabled={saving || draft.trim().length < 2}
                      className="rounded-lg bg-orange-500 px-3 py-2 text-xs font-bold text-white hover:bg-orange-600 disabled:opacity-50"
                    >
                      Сохранить
                    </button>
                    <button
                      type="button"
                      onClick={() => setEditingId(null)}
                      className="rounded-lg p-2 text-gray-400 hover:bg-white hover:text-gray-700"
                      aria-label="Отменить"
                    >
                      <X className="size-4" aria-hidden="true" />
                    </button>
                  </div>
                ) : (
                  <>
                    <div className="min-w-0 flex-1">
                      <p className="truncate font-semibold text-gray-900">{category.name}</p>
                      <p className="text-xs text-gray-500">
                        {count === 0 ? 'Пока без товаров' : `${count} ${productWord(count)}`}
                      </p>
                    </div>
                    <div className="flex items-center gap-1">
                      <button
                        type="button"
                        onClick={() => {
                          setEditingId(category.id)
                          setDraft(category.name)
                        }}
                        aria-label={`Переименовать «${category.name}»`}
                        className="rounded-lg p-2 text-gray-400 hover:bg-white hover:text-gray-700"
                      >
                        <Pencil className="size-4" aria-hidden="true" />
                      </button>
                      <button
                        type="button"
                        onClick={() => onDelete(category)}
                        disabled={count > 0}
                        title={
                          count > 0
                            ? 'Сначала удалите или перенесите товары из этой категории'
                            : `Удалить «${category.name}»`
                        }
                        aria-label={`Удалить «${category.name}»`}
                        className={cn(
                          'rounded-lg p-2',
                          count > 0
                            ? 'cursor-not-allowed text-gray-300'
                            : 'text-gray-400 hover:bg-red-50 hover:text-red-600',
                        )}
                      >
                        <Trash2 className="size-4" aria-hidden="true" />
                      </button>
                    </div>
                  </>
                )}
              </li>
            )
          })}
        </ul>
      )}
    </section>
  )
}

function productWord(count: number) {
  const mod10 = count % 10
  const mod100 = count % 100
  if (mod10 === 1 && mod100 !== 11) return 'товар'
  if (mod10 >= 2 && mod10 <= 4 && (mod100 < 12 || mod100 > 14)) return 'товара'
  return 'товаров'
}
