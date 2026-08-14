import { NextResponse } from 'next/server'
import { RESTAURANT_LOCATION } from '@/lib/geo'
import type { AddressSuggestion, SuggestResponse } from '@/lib/geocoding'

/**
 * Прокси геокодера. Ключи читаются только на сервере из .env.local:
 *   DADATA_API_KEY
 *   YANDEX_GEOCODER_API_KEY
 *   GEOCODER_PROVIDER=dadata | yandex
 *
 * Клиентский код ключей не видит.
 */

const MOCK_ADDRESSES: AddressSuggestion[] = [
  {
    id: 'mock-in-1',
    value: 'г Челябинск, ул Руставели, д 24',
    lat: RESTAURANT_LOCATION.lat,
    lng: RESTAURANT_LOCATION.lng,
  },
  {
    id: 'mock-in-2',
    value: 'г Челябинск, ул Новороссийская, д 40',
    lat: 55.145,
    lng: 61.425,
  },
  {
    id: 'mock-in-3',
    value: 'г Челябинск, ул 3-го Интернационала, д 98',
    lat: 55.148,
    lng: 61.44,
  },
  {
    id: 'mock-out-center',
    value: 'г Челябинск, пр-кт Ленина, д 21',
    lat: 55.16,
    lng: 61.4,
  },
  {
    id: 'mock-out-1',
    value: 'г Копейск, пр-кт Победы, д 10',
    lat: 55.116,
    lng: 61.618,
  },
  {
    id: 'mock-out-2',
    value: 'г Челябинск, Шагол, ул Лётчиков, д 1',
    lat: 55.305,
    lng: 61.503,
  },
]

function mockSuggest(query: string): SuggestResponse {
  const normalized = query.trim().toLowerCase()
  const suggestions = MOCK_ADDRESSES.filter((item) =>
    item.value.toLowerCase().includes(normalized),
  )
  return {
    provider: 'mock',
    suggestions: suggestions.length > 0 ? suggestions : MOCK_ADDRESSES.slice(0, 4),
  }
}

async function suggestDadata(query: string, token: string): Promise<AddressSuggestion[]> {
  const response = await fetch('https://suggestions.dadata.ru/suggestions/api/4_1/rs/suggest/address', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Accept: 'application/json',
      Authorization: `Token ${token}`,
    },
    body: JSON.stringify({
      query,
      count: 7,
      // Ограничение подсказок городом Челябинск. Уберите locations, если нужна вся область.
      locations: [{ kladr_id: '7400000100000' }],
    }),
  })

  if (!response.ok) {
    throw new Error(`DaData error ${response.status}`)
  }

  const data = (await response.json()) as {
    suggestions?: Array<{
      value: string
      unrestricted_value?: string
      data?: { geo_lat?: string | null; geo_lon?: string | null }
    }>
  }

  return (data.suggestions ?? []).map((item, index) => {
    const lat = item.data?.geo_lat ? Number(item.data.geo_lat) : null
    const lng = item.data?.geo_lon ? Number(item.data.geo_lon) : null
    return {
      id: `dadata-${index}-${item.value}`,
      value: item.unrestricted_value ?? item.value,
      lat: Number.isFinite(lat) ? lat : null,
      lng: Number.isFinite(lng) ? lng : null,
    }
  })
}

async function suggestYandex(query: string, apiKey: string): Promise<AddressSuggestion[]> {
  const url = new URL('https://geocode-maps.yandex.ru/1.x/')
  url.searchParams.set('apikey', apiKey)
  url.searchParams.set('geocode', query)
  url.searchParams.set('format', 'json')
  url.searchParams.set('results', '7')
  url.searchParams.set(
    'll',
    `${RESTAURANT_LOCATION.lng},${RESTAURANT_LOCATION.lat}`,
  )
  url.searchParams.set('spn', '0.35,0.25')

  const response = await fetch(url.toString())
  if (!response.ok) {
    throw new Error(`Yandex geocoder error ${response.status}`)
  }

  const data = (await response.json()) as {
    response?: {
      GeoObjectCollection?: {
        featureMember?: Array<{
          GeoObject?: {
            name?: string
            description?: string
            Point?: { pos?: string }
          }
        }>
      }
    }
  }

  const members = data.response?.GeoObjectCollection?.featureMember ?? []

  return members.flatMap((member, index) => {
    const geo = member.GeoObject
    const pos = geo?.Point?.pos?.split(' ')
    const lng = pos?.[0] ? Number(pos[0]) : null
    const lat = pos?.[1] ? Number(pos[1]) : null
    const value = [geo?.name, geo?.description].filter(Boolean).join(', ')
    if (!value) return []
    return [
      {
        id: `yandex-${index}-${value}`,
        value,
        lat: Number.isFinite(lat) ? lat : null,
        lng: Number.isFinite(lng) ? lng : null,
      },
    ]
  })
}

export async function POST(request: Request) {
  const body = (await request.json()) as { query?: string }
  const query = body.query?.trim() ?? ''

  if (query.length < 3) {
    return NextResponse.json({ suggestions: [], provider: 'mock' } satisfies SuggestResponse)
  }

  const provider = (process.env.GEOCODER_PROVIDER ?? '').toLowerCase()
  const dadataKey = process.env.DADATA_API_KEY
  const yandexKey = process.env.YANDEX_GEOCODER_API_KEY

  try {
    if ((provider === 'dadata' || (!provider && dadataKey)) && dadataKey) {
      const suggestions = await suggestDadata(query, dadataKey)
      return NextResponse.json({ suggestions, provider: 'dadata' } satisfies SuggestResponse)
    }

    if ((provider === 'yandex' || (!provider && yandexKey)) && yandexKey) {
      const suggestions = await suggestYandex(query, yandexKey)
      return NextResponse.json({ suggestions, provider: 'yandex' } satisfies SuggestResponse)
    }

    await new Promise((resolve) => setTimeout(resolve, 280))
    return NextResponse.json(mockSuggest(query))
  } catch (error) {
    console.error('[geocode/suggest]', error)
    return NextResponse.json(mockSuggest(query))
  }
}
