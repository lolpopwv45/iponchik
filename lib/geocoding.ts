import {
  geocodeYandexAddress,
  hasYandexJsKey,
  reverseGeocodeYandex,
  suggestYandexAddresses,
} from '@/lib/yandex-maps'

export interface AddressSuggestion {
  id: string
  value: string
  lat: number | null
  lng: number | null
}

export interface SuggestResponse {
  suggestions: AddressSuggestion[]
  provider: 'dadata' | 'yandex' | 'mock'
}

export async function fetchAddressSuggestions(query: string): Promise<SuggestResponse> {
  if (hasYandexJsKey()) {
    const suggestions = await suggestYandexAddresses(query)
    return { suggestions, provider: 'yandex' }
  }

  const response = await fetch('/api/geocode/suggest', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ query }),
  })

  if (!response.ok) {
    throw new Error('Не удалось получить подсказки адреса')
  }

  return (await response.json()) as SuggestResponse
}

export async function resolveSuggestionCoords(
  suggestion: AddressSuggestion,
): Promise<AddressSuggestion> {
  if (suggestion.lat != null && suggestion.lng != null) return suggestion

  if (hasYandexJsKey()) {
    const geo = await geocodeYandexAddress(suggestion.value)
    if (!geo) return suggestion
    return { ...suggestion, value: geo.value, lat: geo.lat, lng: geo.lng }
  }

  return suggestion
}

export async function reverseGeocodePoint(lat: number, lng: number): Promise<AddressSuggestion> {
  if (hasYandexJsKey()) {
    const geo = await reverseGeocodeYandex(lat, lng)
    if (geo?.value) {
      return {
        id: `map-${lat}-${lng}`,
        value: geo.value,
        lat: geo.lat,
        lng: geo.lng,
      }
    }
  }

  return {
    id: `map-${lat}-${lng}`,
    value: `${lat.toFixed(6)}, ${lng.toFixed(6)}`,
    lat,
    lng,
  }
}
