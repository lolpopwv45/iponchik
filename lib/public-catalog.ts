import { cache } from 'react'
import { unstable_cache } from 'next/cache'
import { fallbackCatalog, fetchCatalog, type Catalog } from '@/lib/catalog'
import { isSupabaseConfigured } from '@/lib/supabase'

const CATALOG_REVALIDATE_SECONDS = 60

const getCachedCatalog = unstable_cache(
  async (): Promise<Catalog> => {
    if (!isSupabaseConfigured()) return fallbackCatalog()
    try {
      return await fetchCatalog()
    } catch {
      return fallbackCatalog()
    }
  },
  ['raw-catalog'],
  { revalidate: CATALOG_REVALIDATE_SECONDS, tags: ['catalog'] },
)

export const getRawCatalog = cache(async (): Promise<Catalog> => getCachedCatalog())
