import { NextResponse } from 'next/server'

interface NominatimAddress {
  house_number?: string
  road?: string
  pedestrian?: string
  residential?: string
  suburb?: string
  city?: string
  town?: string
  village?: string
  state?: string
}

interface NominatimReverse {
  display_name?: string
  address?: NominatimAddress
}

function formatAddress(data: NominatimReverse) {
  const details = data.address ?? {}
  const city = details.city || details.town || details.village
  const street = details.road || details.pedestrian || details.residential
  const house = details.house_number

  const parts: string[] = []
  if (city) parts.push(`г ${city}`)
  if (street) parts.push(street)
  if (house) parts.push(`д ${house}`)

  if (parts.length >= 2) return parts.join(', ')
  return data.display_name?.replace(/,\s*Россия$/i, '').trim() || null
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const lat = Number(searchParams.get('lat'))
  const lng = Number(searchParams.get('lng'))

  if (!Number.isFinite(lat) || !Number.isFinite(lng)) {
    return NextResponse.json({ error: 'Нужны lat и lng' }, { status: 400 })
  }

  const url = new URL('https://nominatim.openstreetmap.org/reverse')
  url.searchParams.set('format', 'jsonv2')
  url.searchParams.set('lat', String(lat))
  url.searchParams.set('lon', String(lng))
  url.searchParams.set('zoom', '18')
  url.searchParams.set('addressdetails', '1')
  url.searchParams.set('accept-language', 'ru')

  const response = await fetch(url.toString(), {
    headers: {
      Accept: 'application/json',
      'User-Agent': 'YaPonchik/1.0 (delivery reverse geocode)',
    },
  })

  if (!response.ok) {
    return NextResponse.json({ error: 'Не удалось определить адрес' }, { status: 502 })
  }

  const data = (await response.json()) as NominatimReverse
  const value = formatAddress(data)

  if (!value) {
    return NextResponse.json({ error: 'Адрес не найден' }, { status: 404 })
  }

  return NextResponse.json({ value, lat, lng })
}
