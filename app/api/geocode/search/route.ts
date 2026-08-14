import { NextResponse } from 'next/server'
import { buildSearchVariants } from '@/lib/address-query'

interface NominatimSearchItem {
  lat: string
  lon: string
  display_name?: string
  address?: {
    house_number?: string
    road?: string
    pedestrian?: string
    residential?: string
    city?: string
    town?: string
    village?: string
  }
}

function formatItem(item: NominatimSearchItem) {
  const details = item.address ?? {}
  const city = details.city || details.town || details.village
  const street = details.road || details.pedestrian || details.residential
  const house = details.house_number
  const parts: string[] = []
  if (city) parts.push(`г ${city}`)
  if (street) parts.push(street)
  if (house) parts.push(`д ${house}`)
  const value = parts.length >= 2 ? parts.join(', ') : item.display_name?.replace(/,\s*Россия$/i, '').trim()
  if (!value) return null
  return {
    id: `nominatim-${item.lat}-${item.lon}`,
    value,
    lat: Number(item.lat),
    lng: Number(item.lon),
  }
}

async function nominatimSearch(q: string) {
  const url = new URL('https://nominatim.openstreetmap.org/search')
  url.searchParams.set('format', 'jsonv2')
  url.searchParams.set('q', q)
  url.searchParams.set('addressdetails', '1')
  url.searchParams.set('limit', '7')
  url.searchParams.set('countrycodes', 'ru')
  url.searchParams.set('accept-language', 'ru')
  url.searchParams.set('viewbox', '61.20,55.28,61.70,55.05')
  url.searchParams.set('bounded', '0')

  const response = await fetch(url.toString(), {
    headers: {
      Accept: 'application/json',
      'User-Agent': 'YaPonchik/1.0 (delivery address search)',
    },
  })

  if (!response.ok) return []
  const data = (await response.json()) as NominatimSearchItem[]
  return data.map(formatItem).filter((item): item is NonNullable<typeof item> => Boolean(item))
}

export async function GET(request: Request) {
  const query = new URL(request.url).searchParams.get('q')?.trim() ?? ''
  if (query.length < 3) {
    return NextResponse.json({ suggestions: [] })
  }

  const variants = buildSearchVariants(query)
  const suggestions: NonNullable<ReturnType<typeof formatItem>>[] = []
  const seen = new Set<string>()

  for (const variant of variants) {
    const batch = await nominatimSearch(variant)
    for (const item of batch) {
      const key = item.value.toLowerCase()
      if (seen.has(key)) continue
      seen.add(key)
      suggestions.push(item)
    }
    if (suggestions.length >= 5) break
  }

  return NextResponse.json({ suggestions, provider: 'nominatim' })
}
