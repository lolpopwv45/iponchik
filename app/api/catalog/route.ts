import { NextResponse } from 'next/server'
import { fallbackCatalog, fetchCatalog } from '@/lib/catalog'
import { withProxiedProductImages } from '@/lib/media-proxy'
import { isSupabaseConfigured } from '@/lib/supabase'

export const dynamic = 'force-dynamic'

export async function GET() {
  try {
    if (!isSupabaseConfigured()) {
      const local = fallbackCatalog()
      return NextResponse.json(local)
    }

    const catalog = await fetchCatalog()
    return NextResponse.json({
      categories: catalog.categories,
      products: withProxiedProductImages(catalog.products),
    })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Не удалось загрузить меню'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
