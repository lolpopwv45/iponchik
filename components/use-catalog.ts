'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import type { MenuCategory, Product } from '@/lib/products'

export function useCatalog() {
  const [categories, setCategories] = useState<MenuCategory[]>([])
  const [products, setProducts] = useState<Product[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const loadedOnce = useRef(false)

  const loadCatalog = useCallback(async () => {
    try {
      const response = await fetch('/api/catalog', { cache: 'no-store' })
      const payload = (await response.json()) as {
        categories?: MenuCategory[]
        products?: Product[]
        error?: string
      }
      if (!response.ok) {
        throw new Error(payload.error || 'Не удалось загрузить меню')
      }
      setCategories(payload.categories ?? [])
      setProducts(payload.products ?? [])
      setError('')
      loadedOnce.current = true
    } catch (loadError) {
      if (!loadedOnce.current) {
        setError(loadError instanceof Error ? loadError.message : 'Не удалось загрузить меню')
      }
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    void loadCatalog()
    const timerId = window.setInterval(() => {
      void loadCatalog()
    }, 60_000)
    return () => window.clearInterval(timerId)
  }, [loadCatalog])

  return { categories, products, loading, error }
}
