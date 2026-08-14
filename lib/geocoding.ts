import { geocodeYandexAddress, hasYandexJsKey, reverseGeocodeYandex, suggestYandexAddresses } from '@/lib/yandex-maps'

export interface AddressSuggestion {
  id: string
  value: string
  lat: number | null
  lng: number | null
}

export interface SuggestResponse {
  suggestions: AddressSuggestion[]
  provider: 'dadata' | 'yandex' | 'mock' | 'nominatim'
}

export async function fetchAddressSuggestions(query: string): Promise<SuggestResponse> {
  let suggestions: AddressSuggestion[] = []
  let provider: SuggestResponse['provider'] = 'yandex'

  if (hasYandexJsKey()) {
    try {
      suggestions = await suggestYandexAddresses(query)
    } catch {
      suggestions = []
    }
  }

  if (suggestions.length === 0) {
    const response = await fetch(`/api/geocode/search?q=${encodeURIComponent(query)}`)
    if (response.ok) {
      const data = (await response.json()) as SuggestResponse
      suggestions = data.suggestions ?? []
      provider = 'nominatim'
    }
  }

  return { suggestions, provider }
}

export async function resolveSuggestionCoords(
  suggestion: AddressSuggestion,
): Promise<AddressSuggestion> {
  if (suggestion.lat != null && suggestion.lng != null) return suggestion

  if (hasYandexJsKey()) {
    try {
      const geo = await geocodeYandexAddress(suggestion.value)
      if (geo?.lat != null && geo.lng != null) {
        return { ...suggestion, value: geo.value || suggestion.value, lat: geo.lat, lng: geo.lng }
      }
    } catch {
      // JS-ключ Яндекса часто не открывает HTTP-геокодер
    }
  }

  const response = await fetch(`/api/geocode/search?q=${encodeURIComponent(suggestion.value)}`)
  if (response.ok) {
    const data = (await response.json()) as SuggestResponse
    const match = data.suggestions.find((item) => item.lat != null && item.lng != null)
    if (match) {
      return {
        ...suggestion,
        value: match.value || suggestion.value,
        lat: match.lat,
        lng: match.lng,
      }
    }
  }

  return suggestion
}

export async function reverseGeocodePoint(lat: number, lng: number): Promise<AddressSuggestion> {
  const response = await fetch(
    `/api/geocode/reverse?lat=${encodeURIComponent(String(lat))}&lng=${encodeURIComponent(String(lng))}`,
  )
  if (response.ok) {
    const data = (await response.json()) as { value?: string }
    if (data.value && !looksLikeCoordinates(data.value)) {
      return {
        id: `map-${lat}-${lng}`,
        value: data.value,
        lat,
        lng,
      }
    }
  }

  if (hasYandexJsKey()) {
    try {
      const geo = await reverseGeocodeYandex(lat, lng)
      if (geo?.value && !looksLikeCoordinates(geo.value)) {
        return {
          id: `map-${lat}-${lng}`,
          value: geo.value,
          lat: geo.lat,
          lng: geo.lng,
        }
      }
    } catch {
      // JS-ключ Яндекса не умеет HTTP-геокодер
    }
  }

  throw new Error('Не удалось определить адрес по точке на карте')
}

function looksLikeCoordinates(value: string) {
  return /^-?\d+(\.\d+)?,\s*-?\d+(\.\d+)?$/.test(value.trim())
}
