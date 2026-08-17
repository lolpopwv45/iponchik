'use client'

import Image from 'next/image'
import { Loader2, Pencil, Plus, RefreshCw, Trash2 } from 'lucide-react'
import { useCallback, useEffect, useMemo, useState } from 'react'
import { AdminCategories } from '@/components/admin-categories'
import { AdminProductForm } from '@/components/admin-product-form'
import {
  createCategory,
  createProduct,
  deleteCategory,
  deleteProduct,
  deleteStoredProductImage,
  fetchCatalog,
  subscribeCatalog,
  updateCategory,
  updateProduct,
  updateProductStock,
  uploadProductImage,
  type ProductInput,
} from '@/lib/catalog'
import { ALL_CATEGORY, type MenuCategory, type Product } from '@/lib/products'
import { isSupabaseConfigured } from '@/lib/supabase'
import { cn } from '@/lib/utils'

type ConfirmState =
  | { type: 'product'; product: Product }
  | { type: 'category'; category: MenuCategory }
  | null

export function AdminProducts() {
  const [categories, setCategories] = useState<MenuCategory[]>([])
  const [products, setProducts] = useState<Product[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [filterId, setFilterId] = useState<number | 'all'>('all')
  const [formOpen, setFormOpen] = useState(false)
  const [editing, setEditing] = useState<Product | null>(null)
  const [saving, setSaving] = useState(false)
  const [confirm, setConfirm] = useState<ConfirmState>(null)
  const [busyId, setBusyId] = useState<number | null>(null)

  const loadCatalog = useCallback(async () => {
    setError('')
    try {
      const next = await fetchCatalog()
      setCategories(next.categories)
      setProducts(next.products)
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : 'Не удалось загрузить меню')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    if (!isSupabaseConfigured()) {
      setLoading(false)
      return
    }

    void loadCatalog()

    let refreshTimer: number | undefined
    const unsubscribe = subscribeCatalog(() => {
      window.clearTimeout(refreshTimer)
      refreshTimer = window.setTimeout(() => {
        void loadCatalog()
      }, 250)
    })

    return () => {
      window.clearTimeout(refreshTimer)
      unsubscribe()
    }
  }, [loadCatalog])

  useEffect(() => {
    if (filterId !== 'all' && !categories.some((category) => category.id === filterId)) {
      setFilterId('all')
    }
  }, [categories, filterId])

  const visibleProducts = useMemo(() => {
    if (filterId === 'all') return products
    return products.filter((product) => product.categoryId === filterId)
  }, [filterId, products])

  function openCreate() {
    setEditing(null)
    setFormOpen(true)
  }

  function openEdit(product: Product) {
    setEditing(product)
    setFormOpen(true)
  }

  async function handleToggleStock(product: Product) {
    const next = !product.inStock
    setBusyId(product.id)
    setProducts((current) =>
      current.map((item) => (item.id === product.id ? { ...item, inStock: next } : item)),
    )
    try {
      await updateProductStock(product.id, next)
    } catch (updateError) {
      setProducts((current) =>
        current.map((item) => (item.id === product.id ? { ...item, inStock: product.inStock } : item)),
      )
      setError(updateError instanceof Error ? updateError.message : 'Не удалось обновить наличие')
    } finally {
      setBusyId(null)
    }
  }

  async function handleSave(input: ProductInput, file: File | null, newCategoryName: string) {
    setSaving(true)
    setError('')
    let uploadedUrl: string | null = null
    try {
      let categoryId = input.categoryId
      if (newCategoryName.trim()) {
        const created = await createCategory({ name: newCategoryName }, categories)
        categoryId = created.id
        setCategories((current) => [...current, created])
      }

      let imageUrl = input.imageUrl
      if (file) {
        uploadedUrl = await uploadProductImage(file)
        imageUrl = uploadedUrl
      }

      const payload: ProductInput = {
        ...input,
        categoryId,
        imageUrl,
        sortOrder: editing?.sortOrder ?? input.sortOrder,
      }

      if (editing) {
        const previousImage = editing.image
        await updateProduct(editing.id, payload)
        if (uploadedUrl && previousImage && previousImage !== uploadedUrl) {
          void deleteStoredProductImage(previousImage)
        }
      } else {
        await createProduct(payload, products)
      }

      await loadCatalog()
      setFormOpen(false)
      setEditing(null)
    } catch (saveError) {
      if (uploadedUrl) void deleteStoredProductImage(uploadedUrl)
      throw saveError
    } finally {
      setSaving(false)
    }
  }

  async function handleConfirmedDelete() {
    if (!confirm) return
    setBusyId(confirm.type === 'product' ? confirm.product.id : confirm.category.id)
    setError('')
    try {
      if (confirm.type === 'product') {
        await deleteProduct(confirm.product.id)
        void deleteStoredProductImage(confirm.product.image)
      } else {
        await deleteCategory(confirm.category.id)
      }
      await loadCatalog()
      setConfirm(null)
    } catch (deleteError) {
      setError(deleteError instanceof Error ? deleteError.message : 'Не удалось удалить')
    } finally {
      setBusyId(null)
    }
  }

  if (!isSupabaseConfigured()) {
    return (
      <div className="rounded-2xl border border-amber-200 bg-amber-50 px-6 py-10">
        <h1 className="text-2xl font-bold tracking-tight text-gray-900">Наше меню</h1>
        <p className="mt-3 max-w-xl text-sm leading-relaxed text-amber-900">
          Чтобы создавать товары и категории, добавьте{' '}
          <code className="font-semibold">NEXT_PUBLIC_SUPABASE_URL</code> и{' '}
          <code className="font-semibold">NEXT_PUBLIC_SUPABASE_ANON_KEY</code> в{' '}
          <code className="font-semibold">.env.local</code>.
        </p>
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-5">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-gray-900">Наше меню</h1>
          <p className="mt-1 text-sm text-gray-500">Товары, категории, наличие и пищевая ценность</p>
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => {
              setLoading(true)
              void loadCatalog()
            }}
            className="inline-flex min-h-11 items-center gap-2 rounded-xl border border-gray-200 bg-white px-3 py-2 text-sm font-semibold text-gray-600 hover:bg-gray-50"
          >
            <RefreshCw className={cn('size-4', loading && 'animate-spin')} aria-hidden="true" />
            <span className="hidden sm:inline">Обновить</span>
          </button>
          <button
            type="button"
            onClick={openCreate}
            className="inline-flex min-h-11 items-center gap-2 rounded-xl bg-orange-500 px-4 py-2.5 text-sm font-bold text-white shadow-sm transition-colors hover:bg-orange-600"
          >
            <Plus className="size-4" aria-hidden="true" />
            Добавить товар
          </button>
        </div>
      </div>

      {error ? (
        <p className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-semibold text-red-700" role="alert">
          {error}
        </p>
      ) : null}

      <AdminCategories
        categories={categories}
        products={products}
        busy={saving || busyId !== null}
        onCreate={async (name) => {
          setError('')
          try {
            await createCategory({ name }, categories)
            await loadCatalog()
          } catch (createError) {
            setError(createError instanceof Error ? createError.message : 'Не удалось создать категорию')
            throw createError
          }
        }}
        onRename={async (id, name) => {
          setError('')
          try {
            await updateCategory(id, { name })
            await loadCatalog()
          } catch (renameError) {
            setError(renameError instanceof Error ? renameError.message : 'Не удалось переименовать категорию')
            throw renameError
          }
        }}
        onDelete={(category) => setConfirm({ type: 'category', category })}
      />

      <div className="flex flex-col gap-3">
        <div
          className="scrollbar-none flex gap-2 overflow-x-auto"
          role="group"
          aria-label="Фильтр товаров по категории"
        >
          <FilterChip
            label={ALL_CATEGORY}
            count={products.length}
            active={filterId === 'all'}
            onClick={() => setFilterId('all')}
          />
          {categories.map((category) => (
            <FilterChip
              key={category.id}
              label={category.name}
              count={products.filter((product) => product.categoryId === category.id).length}
              active={filterId === category.id}
              onClick={() => setFilterId(category.id)}
            />
          ))}
        </div>

        {loading && products.length === 0 ? (
          <div className="flex items-center justify-center gap-2 rounded-2xl border border-gray-100 bg-white py-16 text-sm text-gray-500">
            <Loader2 className="size-4 animate-spin" aria-hidden="true" />
            Загружаем меню…
          </div>
        ) : visibleProducts.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-gray-200 bg-white px-6 py-16 text-center">
            <p className="text-base font-bold text-gray-900">
              {products.length === 0 ? 'Пока нет товаров' : 'В этой категории пока пусто'}
            </p>
            <p className="mt-1 text-sm text-gray-500">
              {categories.length === 0
                ? 'Сначала создайте категорию, затем добавьте первый товар.'
                : 'Нажмите «Добавить товар», чтобы заполнить меню.'}
            </p>
          </div>
        ) : (
          <>
            <div className="hidden overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-sm md:block">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm">
                  <thead>
                    <tr className="border-b border-gray-100 bg-gray-50/60">
                      <th className="px-5 py-3 font-semibold text-gray-500">Фото</th>
                      <th className="px-5 py-3 font-semibold text-gray-500">Название</th>
                      <th className="px-5 py-3 font-semibold text-gray-500">Категория</th>
                      <th className="px-5 py-3 font-semibold text-gray-500">Вес</th>
                      <th className="px-5 py-3 font-semibold text-gray-500">Цена</th>
                      <th className="px-5 py-3 font-semibold text-gray-500">Статус</th>
                      <th className="px-5 py-3 font-semibold text-gray-500">Действия</th>
                    </tr>
                  </thead>
                  <tbody>
                    {visibleProducts.map((product) => (
                      <tr key={product.id} className="border-b border-gray-50 last:border-0">
                        <td className="px-5 py-3">
                          <ProductThumb product={product} />
                        </td>
                        <td className="px-5 py-3">
                          <p className="font-semibold text-gray-900">{product.name}</p>
                          <p className="mt-0.5 line-clamp-1 max-w-xs text-xs text-gray-500">{product.description}</p>
                        </td>
                        <td className="px-5 py-3 text-gray-500">{product.category}</td>
                        <td className="px-5 py-3 tabular-nums text-gray-600">{product.weight}</td>
                        <td className="px-5 py-3 font-bold tabular-nums text-gray-900">{product.price} ₽</td>
                        <td className="px-5 py-3">
                          <StockSwitch
                            product={product}
                            disabled={busyId === product.id}
                            onToggle={() => void handleToggleStock(product)}
                          />
                        </td>
                        <td className="px-5 py-3">
                          <RowActions
                            product={product}
                            onEdit={() => openEdit(product)}
                            onDelete={() => setConfirm({ type: 'product', product })}
                          />
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            <ul className="flex flex-col gap-3 md:hidden">
              {visibleProducts.map((product) => (
                <li key={product.id} className="rounded-2xl border border-gray-100 bg-white p-3 shadow-sm">
                  <div className="flex gap-3">
                    <ProductThumb product={product} />
                    <div className="min-w-0 flex-1">
                      <p className="font-semibold text-gray-900">{product.name}</p>
                      <p className="mt-0.5 text-xs text-gray-500">
                        {product.category} · {product.weight}
                      </p>
                      <p className="mt-1 text-base font-bold text-gray-900">{product.price} ₽</p>
                    </div>
                    <RowActions
                      product={product}
                      onEdit={() => openEdit(product)}
                      onDelete={() => setConfirm({ type: 'product', product })}
                    />
                  </div>
                  <div className="mt-3 border-t border-gray-50 pt-3">
                    <StockSwitch
                      product={product}
                      disabled={busyId === product.id}
                      onToggle={() => void handleToggleStock(product)}
                    />
                  </div>
                </li>
              ))}
            </ul>
          </>
        )}
      </div>

      <AdminProductForm
        key={editing ? `edit-${editing.id}` : 'create'}
        open={formOpen}
        product={editing}
        categories={categories}
        saving={saving}
        onClose={() => {
          if (saving) return
          setFormOpen(false)
          setEditing(null)
        }}
        onSubmit={handleSave}
      />

      {confirm ? (
        <div className="fixed inset-0 z-[90] flex items-center justify-center p-4">
          <button
            type="button"
            className="absolute inset-0 bg-gray-900/40"
            aria-label="Закрыть"
            onClick={() => setConfirm(null)}
          />
          <div className="relative w-full max-w-md rounded-2xl bg-white p-5 shadow-xl">
            <h2 className="text-lg font-bold text-gray-900">
              {confirm.type === 'product' ? 'Удалить товар?' : 'Удалить категорию?'}
            </h2>
            <p className="mt-2 text-sm leading-relaxed text-gray-500">
              {confirm.type === 'product'
                ? `«${confirm.product.name}» исчезнет из меню. Это нельзя отменить.`
                : `Категория «${confirm.category.name}» будет удалена.`}
            </p>
            <div className="mt-5 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setConfirm(null)}
                className="min-h-11 rounded-xl border border-gray-200 px-4 text-sm font-semibold text-gray-600 hover:bg-gray-50"
              >
                Отмена
              </button>
              <button
                type="button"
                onClick={() => void handleConfirmedDelete()}
                disabled={busyId !== null}
                className="inline-flex min-h-11 items-center gap-2 rounded-xl bg-red-600 px-4 text-sm font-bold text-white hover:bg-red-700 disabled:opacity-60"
              >
                {busyId !== null ? <Loader2 className="size-4 animate-spin" aria-hidden="true" /> : null}
                Удалить
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  )
}

function FilterChip({
  label,
  count,
  active,
  onClick,
}: {
  label: string
  count: number
  active: boolean
  onClick: () => void
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        'inline-flex shrink-0 items-center gap-1.5 rounded-full px-3 py-2 text-sm font-bold transition-colors',
        active ? 'bg-orange-500 text-white shadow-sm' : 'bg-white text-gray-600 ring-1 ring-gray-200 hover:bg-gray-50',
      )}
    >
      {label}
      <span className={cn('rounded-full px-1.5 text-[11px]', active ? 'bg-white/20' : 'bg-gray-100 text-gray-500')}>
        {count}
      </span>
    </button>
  )
}

function ProductThumb({ product }: { product: Product }) {
  return (
    <div className="relative size-12 shrink-0 overflow-hidden rounded-xl bg-gray-100">
      <Image src={product.image || '/placeholder.svg'} alt="" fill className="object-cover" />
    </div>
  )
}

function StockSwitch({
  product,
  disabled,
  onToggle,
}: {
  product: Product
  disabled: boolean
  onToggle: () => void
}) {
  return (
    <div className="flex items-center">
      <button
        type="button"
        role="switch"
        aria-checked={product.inStock}
        disabled={disabled}
        onClick={onToggle}
        className={cn(
          'relative inline-flex h-6 w-11 items-center rounded-full transition-colors disabled:opacity-60',
          product.inStock ? 'bg-orange-500' : 'bg-gray-200',
        )}
      >
        <span
          className={cn(
            'inline-block size-4.5 rounded-full bg-white shadow transition-transform',
            product.inStock ? 'translate-x-6' : 'translate-x-1',
          )}
        />
      </button>
      <span className={cn('ml-2.5 text-xs font-semibold', product.inStock ? 'text-green-600' : 'text-gray-400')}>
        {product.inStock ? 'В наличии' : 'Нет в наличии'}
      </span>
    </div>
  )
}

function RowActions({
  product,
  onEdit,
  onDelete,
}: {
  product: Product
  onEdit: () => void
  onDelete: () => void
}) {
  return (
    <div className="flex items-center gap-1.5">
      <button
        type="button"
        onClick={onEdit}
        aria-label={`Редактировать «${product.name}»`}
        className="rounded-lg p-2 text-gray-400 hover:bg-gray-100 hover:text-gray-700"
      >
        <Pencil className="size-4" aria-hidden="true" />
      </button>
      <button
        type="button"
        onClick={onDelete}
        aria-label={`Удалить «${product.name}»`}
        className="rounded-lg p-2 text-gray-400 hover:bg-red-50 hover:text-red-600"
      >
        <Trash2 className="size-4" aria-hidden="true" />
      </button>
    </div>
  )
}
