import { NextResponse } from 'next/server'
import { getRawCatalog } from '@/lib/public-catalog'

export const revalidate = 60

export async function GET() {
  try {
    const catalog = await getRawCatalog()
    return NextResponse.json(catalog, {
      headers: {
        'Cache-Control': 'public, s-maxage=60, stale-while-revalidate=300',
      },
    })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Не удалось загрузить меню'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
