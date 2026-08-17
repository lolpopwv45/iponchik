'use client'

import { useCallback, useEffect, useState } from 'react'
import { fallbackCatalog, fetchCatalog, subscribeCatalog } from '@/lib/catalog'
import type { MenuCategory, Product } from '@/lib/products'
import { isSupabaseConfigured } from '@/lib/supabase'

export function useCatalog() {
  const configured = isSupabaseConfigured()
  const fallback = fallbackCatalog()
  const [categories, setCategories] = useState<MenuCategory[]>(configured ? [] : fallback.categories)
  const [products, setProducts] = useState<Product[]>(configured ? [] : fallback.products)
  const [loading, setLoading] = useState(configured)
  const [error, setError] = useState('')

  const loadCatalog = useCallback(async () => {
    if (!isSupabaseConfigured()) {
      const local = fallbackCatalog()
      setCategories(local.categories)
      setProducts(local.products)
      setLoading(false)
      return
    }

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
    void loadCatalog()
    if (!isSupabaseConfigured()) return

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

  return { categories, products, loading, error }
}
