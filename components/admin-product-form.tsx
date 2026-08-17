'use client'

import Image from 'next/image'
import { ImagePlus, Loader2, X } from 'lucide-react'
import { useEffect, useId, useMemo, useRef, useState } from 'react'
import {
  MAX_PRODUCT_IMAGE_BYTES,
  PRODUCT_IMAGE_TYPES,
  type ProductInput,
  validateProductImage,
} from '@/lib/catalog'
import { BADGE_META, PRODUCT_BADGES, type MenuCategory, type Product, type ProductBadge } from '@/lib/products'
import { cn } from '@/lib/utils'

interface AdminProductFormProps {
  open: boolean
  product: Product | null
  categories: MenuCategory[]
  saving: boolean
  onClose: () => void
  onSubmit: (input: ProductInput, file: File | null, newCategoryName: string) => Promise<void>
}

interface FormState {
  name: string
  description: string
  categoryId: number | 'new' | ''
  newCategoryName: string
  price: string
  weightGrams: string
  inStock: boolean
  imageUrl: string
  proteins: string
  fats: string
  carbs: string
  calories: string
  badges: ProductBadge[]
}

const EMPTY_FORM: FormState = {
  name: '',
  description: '',
  categoryId: '',
  newCategoryName: '',
  price: '',
  weightGrams: '',
  inStock: true,
  imageUrl: '',
  proteins: '',
  fats: '',
  carbs: '',
  calories: '',
  badges: [],
}

function toFormState(product: Product | null, categories: MenuCategory[]): FormState {
  if (!product) {
    return {
      ...EMPTY_FORM,
      categoryId: categories.length === 0 ? 'new' : (categories[0]?.id ?? ''),
    }
  }

  return {
    name: product.name,
    description: product.description,
    categoryId: product.categoryId,
    newCategoryName: '',
    price: String(product.price),
    weightGrams: String(product.weightGrams),
    inStock: product.inStock,
    imageUrl: product.image,
    proteins: formatNutrientInput(product.nutrition.proteins),
    fats: formatNutrientInput(product.nutrition.fats),
    carbs: formatNutrientInput(product.nutrition.carbs),
    calories: formatNutrientInput(product.nutrition.calories),
    badges: product.badges,
  }
}

function formatNutrientInput(value: number) {
  if (!Number.isFinite(value) || value === 0) return ''
  return String(value)
}

function parseNutrient(value: string) {
  const parsed = Number(value.replace(',', '.').trim())
  return Number.isFinite(parsed) ? parsed : 0
}

export function AdminProductForm({
  open,
  product,
  categories,
  saving,
  onClose,
  onSubmit,
}: AdminProductFormProps) {
  const titleId = useId()
  const fileInputId = useId()
  const [form, setForm] = useState<FormState>(() => toFormState(product, categories))
  const [file, setFile] = useState<File | null>(null)
  const [fileError, setFileError] = useState('')
  const [formError, setFormError] = useState('')
  const [dragging, setDragging] = useState(false)
  const filePreview = useMemo(() => (file ? URL.createObjectURL(file) : ''), [file])
  const dropRef = useRef<HTMLLabelElement>(null)

  useEffect(() => {
    if (!open) return
    setForm(toFormState(product, categories))
    setFile(null)
    setFileError('')
    setFormError('')
  }, [open, product])

  useEffect(() => {
    return () => {
      if (filePreview) URL.revokeObjectURL(filePreview)
    }
  }, [filePreview])

  useEffect(() => {
    if (!open) return
    const previous = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    function onKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape' && !saving) onClose()
    }
    window.addEventListener('keydown', onKeyDown)
    return () => {
      document.body.style.overflow = previous
      window.removeEventListener('keydown', onKeyDown)
    }
  }, [open, onClose, saving])

  const previewSrc = filePreview || form.imageUrl
  const isEdit = Boolean(product)

  function patch<K extends keyof FormState>(key: K, value: FormState[K]) {
    setForm((current) => ({ ...current, [key]: value }))
  }

  function handleFiles(list: FileList | null) {
    const next = list?.[0]
    if (!next) return
    try {
      validateProductImage(next)
      if (
        next.type &&
        !PRODUCT_IMAGE_TYPES.includes(next.type as (typeof PRODUCT_IMAGE_TYPES)[number]) &&
        !next.type.startsWith('image/')
      ) {
        throw new Error('Можно загрузить только изображение')
      }
      if (next.size > MAX_PRODUCT_IMAGE_BYTES) {
        throw new Error('Фото не должно быть больше 5 МБ')
      }
      setFile(next)
      setFileError('')
    } catch (error) {
      setFileError(error instanceof Error ? error.message : 'Не удалось выбрать фото')
    }
  }

  function toggleBadge(badge: ProductBadge) {
    setForm((current) => ({
      ...current,
      badges: current.badges.includes(badge)
        ? current.badges.filter((item) => item !== badge)
        : [...current.badges, badge],
    }))
  }

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault()
    setFormError('')

    const categoryId = form.categoryId === 'new' ? 0 : Number(form.categoryId)
    const newCategoryName = form.categoryId === 'new' ? form.newCategoryName : ''
    if (form.categoryId === 'new' && form.newCategoryName.trim().length < 2) {
      setFormError('Укажите название новой категории')
      return
    }
    if (form.categoryId !== 'new' && !categoryId) {
      setFormError('Выберите категорию')
      return
    }
    if (!file && !form.imageUrl) {
      setFormError('Добавьте фото товара')
      return
    }

    const input: ProductInput = {
      name: form.name,
      description: form.description,
      categoryId,
      price: Number(form.price.replace(',', '.').trim()),
      inStock: form.inStock,
      imageUrl: form.imageUrl,
      weightGrams: Number(form.weightGrams.replace(',', '.').trim()),
      nutrition: {
        proteins: parseNutrient(form.proteins),
        fats: parseNutrient(form.fats),
        carbs: parseNutrient(form.carbs),
        calories: parseNutrient(form.calories),
      },
      badges: form.badges,
      sortOrder: product?.sortOrder,
    }

    try {
      await onSubmit(input, file, newCategoryName)
    } catch (error) {
      setFormError(error instanceof Error ? error.message : 'Не удалось сохранить товар')
    }
  }

  if (!open) return null

  return (
    <div className="fixed inset-0 z-[80] flex items-end justify-center sm:items-center sm:p-6">
      <button
        type="button"
        aria-label="Закрыть"
        className="absolute inset-0 bg-gray-900/40"
        onClick={() => {
          if (!saving) onClose()
        }}
      />

      <form
        onSubmit={handleSubmit}
        aria-labelledby={titleId}
        className="relative z-10 flex max-h-[94dvh] w-full max-w-3xl flex-col overflow-hidden rounded-t-3xl bg-white shadow-xl sm:rounded-3xl"
      >
        <div className="flex items-start justify-between gap-3 border-b border-gray-100 px-5 py-4">
          <div>
            <h2 id={titleId} className="text-lg font-bold text-gray-900">
              {isEdit ? 'Редактировать товар' : 'Новый товар'}
            </h2>
            <p className="mt-0.5 text-sm text-gray-500">
              Эти данные увидят гости в меню и в карточке блюда
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            disabled={saving}
            className="rounded-xl p-2 text-gray-400 hover:bg-gray-100 hover:text-gray-700 disabled:opacity-50"
            aria-label="Закрыть"
          >
            <X className="size-5" aria-hidden="true" />
          </button>
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto px-5 py-4">
          <div className="grid gap-5 md:grid-cols-[220px_1fr]">
            <div>
              <p className="mb-2 text-sm font-semibold text-gray-700">Фото</p>
              <label
                ref={dropRef}
                htmlFor={fileInputId}
                onDragOver={(event) => {
                  event.preventDefault()
                  setDragging(true)
                }}
                onDragLeave={() => setDragging(false)}
                onDrop={(event) => {
                  event.preventDefault()
                  setDragging(false)
                  handleFiles(event.dataTransfer.files)
                }}
                className={cn(
                  'relative flex aspect-square cursor-pointer flex-col items-center justify-center overflow-hidden rounded-2xl border-2 border-dashed bg-gray-50 text-center transition-colors',
                  dragging ? 'border-orange-400 bg-orange-50' : 'border-gray-200 hover:border-orange-300',
                )}
              >
                {previewSrc ? (
                  previewSrc.startsWith('blob:') ? (
                    // Local file preview — next/image does not accept blob URLs.
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={previewSrc} alt="" className="absolute inset-0 size-full object-cover" />
                  ) : (
                    <Image src={previewSrc} alt="" fill className="object-cover" />
                  )
                ) : (
                  <>
                    <ImagePlus className="size-8 text-gray-400" aria-hidden="true" />
                    <span className="mt-2 px-3 text-xs font-semibold text-gray-500">
                      Нажмите или перетащите фото
                    </span>
                  </>
                )}
              </label>
              <input
                id={fileInputId}
                type="file"
                accept="image/jpeg,image/png,image/webp,image/gif"
                className="sr-only"
                onChange={(event) => handleFiles(event.target.files)}
              />
              {fileError ? <p className="mt-2 text-xs font-semibold text-red-600">{fileError}</p> : null}
              <p className="mt-2 text-xs text-gray-400">JPG, PNG, WEBP или GIF, до 5 МБ</p>
            </div>

            <div className="flex flex-col gap-3">
              <Field label="Название">
                <input
                  required
                  value={form.name}
                  onChange={(event) => patch('name', event.target.value)}
                  placeholder="Пончик классический"
                  className={fieldClass}
                />
              </Field>

              <Field label="Описание">
                <textarea
                  required
                  value={form.description}
                  onChange={(event) => patch('description', event.target.value)}
                  placeholder="Коротко расскажите, из чего блюдо и чем оно вкусно"
                  rows={3}
                  className={`${fieldClass} min-h-[5.5rem] resize-y py-2.5`}
                />
              </Field>

              <Field label="Категория">
                <select
                  value={form.categoryId}
                  onChange={(event) => {
                    const value = event.target.value
                    patch('categoryId', value === 'new' ? 'new' : value ? Number(value) : '')
                  }}
                  className={fieldClass}
                >
                  <option value="" disabled>
                    Выберите категорию
                  </option>
                  {categories.map((category) => (
                    <option key={category.id} value={category.id}>
                      {category.name}
                    </option>
                  ))}
                  <option value="new">+ Создать новую категорию</option>
                </select>
              </Field>

              {form.categoryId === 'new' ? (
                <Field label="Название новой категории">
                  <input
                    value={form.newCategoryName}
                    onChange={(event) => patch('newCategoryName', event.target.value)}
                    placeholder="Пончики"
                    className={fieldClass}
                  />
                </Field>
              ) : null}

              <div className="grid grid-cols-2 gap-3">
                <Field label="Цена, ₽">
                  <input
                    required
                    inputMode="numeric"
                    min={0}
                    step={1}
                    type="number"
                    value={form.price}
                    onChange={(event) => patch('price', event.target.value)}
                    placeholder="89"
                    className={fieldClass}
                  />
                </Field>
                <Field label="Вес, граммы">
                  <input
                    required
                    inputMode="numeric"
                    min={1}
                    step={1}
                    type="number"
                    value={form.weightGrams}
                    onChange={(event) => patch('weightGrams', event.target.value)}
                    placeholder="70"
                    className={fieldClass}
                  />
                </Field>
              </div>

              <div className="flex items-center justify-between rounded-xl border border-gray-100 bg-gray-50 px-3 py-2.5">
                <div>
                  <p className="text-sm font-semibold text-gray-900">В наличии</p>
                  <p className="text-xs text-gray-500">Если выключить, гости не смогут положить товар в корзину</p>
                </div>
                <button
                  type="button"
                  role="switch"
                  aria-checked={form.inStock}
                  onClick={() => patch('inStock', !form.inStock)}
                  className={cn(
                    'relative inline-flex h-6 w-11 items-center rounded-full transition-colors',
                    form.inStock ? 'bg-orange-500' : 'bg-gray-200',
                  )}
                >
                  <span
                    className={cn(
                      'inline-block size-4.5 rounded-full bg-white shadow transition-transform',
                      form.inStock ? 'translate-x-6' : 'translate-x-1',
                    )}
                  />
                </button>
              </div>
            </div>
          </div>

          <div className="mt-5 rounded-2xl border border-gray-100 bg-gray-50/80 p-4">
            <p className="text-sm font-bold text-gray-900">Пищевая ценность на 100 г</p>
            <p className="mt-0.5 text-xs text-gray-500">Гости увидят эти цифры в карточке товара</p>
            <div className="mt-3 grid grid-cols-2 gap-3 sm:grid-cols-4">
              <Field label="Белки, г">
                <input
                  inputMode="decimal"
                  min={0}
                  step="0.01"
                  type="number"
                  value={form.proteins}
                  onChange={(event) => patch('proteins', event.target.value)}
                  placeholder="5.40"
                  className={fieldClass}
                />
              </Field>
              <Field label="Жиры, г">
                <input
                  inputMode="decimal"
                  min={0}
                  step="0.01"
                  type="number"
                  value={form.fats}
                  onChange={(event) => patch('fats', event.target.value)}
                  placeholder="18.20"
                  className={fieldClass}
                />
              </Field>
              <Field label="Углеводы, г">
                <input
                  inputMode="decimal"
                  min={0}
                  step="0.01"
                  type="number"
                  value={form.carbs}
                  onChange={(event) => patch('carbs', event.target.value)}
                  placeholder="48.50"
                  className={fieldClass}
                />
              </Field>
              <Field label="Ккал">
                <input
                  inputMode="decimal"
                  min={0}
                  step="0.01"
                  type="number"
                  value={form.calories}
                  onChange={(event) => patch('calories', event.target.value)}
                  placeholder="377"
                  className={fieldClass}
                />
              </Field>
            </div>
          </div>

          <fieldset className="mt-5">
            <legend className="text-sm font-bold text-gray-900">Метки на витрине</legend>
            <div className="mt-2 flex flex-wrap gap-2">
              {PRODUCT_BADGES.map((badge) => {
                const meta = BADGE_META[badge]
                const selected = form.badges.includes(badge)
                return (
                  <button
                    key={badge}
                    type="button"
                    onClick={() => toggleBadge(badge)}
                    aria-pressed={selected}
                    className={cn(
                      'rounded-full px-3 py-1.5 text-xs font-bold transition-colors',
                      selected ? meta.className : 'bg-gray-100 text-gray-600 hover:bg-gray-200',
                    )}
                  >
                    {meta.emoji} {meta.label}
                  </button>
                )
              })}
            </div>
          </fieldset>

          {formError ? (
            <p className="mt-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-semibold text-red-700" role="alert">
              {formError}
            </p>
          ) : null}
        </div>

        <div className="flex flex-col-reverse gap-2 border-t border-gray-100 px-5 py-4 sm:flex-row sm:justify-end">
          <button
            type="button"
            onClick={onClose}
            disabled={saving}
            className="min-h-11 rounded-xl border border-gray-200 px-4 text-sm font-semibold text-gray-600 hover:bg-gray-50 disabled:opacity-50"
          >
            Отмена
          </button>
          <button
            type="submit"
            disabled={saving}
            className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-orange-500 px-5 text-sm font-bold text-white shadow-sm hover:bg-orange-600 disabled:opacity-60"
          >
            {saving ? <Loader2 className="size-4 animate-spin" aria-hidden="true" /> : null}
            {isEdit ? 'Сохранить изменения' : 'Создать товар'}
          </button>
        </div>
      </form>
    </div>
  )
}

const fieldClass =
  'min-h-11 w-full rounded-xl border border-gray-200 bg-white px-3 text-sm text-gray-900 outline-none placeholder:text-gray-400 focus:border-orange-400 focus:ring-2 focus:ring-orange-100'

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="flex flex-col gap-1.5">
      <span className="text-sm font-semibold text-gray-700">{label}</span>
      {children}
    </label>
  )
}
