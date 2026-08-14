'use client'

import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from 'react'
import type { Product } from '@/lib/products'

interface ActiveProductContextValue {
  activeProduct: Product | null
  isPinned: boolean
  previewProduct: (product: Product) => void
  clearPreview: (productId?: number) => void
  pinProduct: (product: Product) => void
  clearActiveProduct: () => void
}

const ActiveProductContext = createContext<ActiveProductContextValue | null>(null)

export function ActiveProductProvider({ children }: { children: ReactNode }) {
  const [activeProduct, setActiveProduct] = useState<Product | null>(null)
  const [isPinned, setIsPinned] = useState(false)

  const previewProduct = useCallback((product: Product) => {
    setActiveProduct((current) => {
      if (isPinned) return current
      return product
    })
  }, [isPinned])

  const clearPreview = useCallback((productId?: number) => {
    if (isPinned) return
    setActiveProduct((current) => {
      if (!current) return null
      if (productId !== undefined && current.id !== productId) return current
      return null
    })
  }, [isPinned])

  const pinProduct = useCallback((product: Product) => {
    setActiveProduct(product)
    setIsPinned(true)
  }, [])

  const clearActiveProduct = useCallback(() => {
    setActiveProduct(null)
    setIsPinned(false)
  }, [])

  const value = useMemo(
    () => ({
      activeProduct,
      isPinned,
      previewProduct,
      clearPreview,
      pinProduct,
      clearActiveProduct,
    }),
    [activeProduct, isPinned, previewProduct, clearPreview, pinProduct, clearActiveProduct],
  )

  return <ActiveProductContext.Provider value={value}>{children}</ActiveProductContext.Provider>
}

export function useActiveProduct() {
  const context = useContext(ActiveProductContext)
  if (!context) {
    throw new Error('useActiveProduct must be used within ActiveProductProvider')
  }
  return context
}
