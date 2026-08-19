import { cache } from 'react'
import { fallbackCatalog, fetchCatalog, type Catalog } from '@/lib/catalog'
import { isSupabaseConfigured } from '@/lib/supabase'

export const getRawCatalog = cache(async (): Promise<Catalog> => {
  try {
    if (!isSupabaseConfigured()) return fallbackCatalog()
    return await fetchCatalog()
  } catch {
    return fallbackCatalog()
  }
})
