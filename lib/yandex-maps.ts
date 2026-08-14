import { buildSearchVariants } from '@/lib/address-query'

type YandexSuggestItem = {
  value: string
  displayName: string
}

type YandexGeoObject = {
  geometry: { getCoordinates: () => [number, number] }
  getAddressLine: () => string
  getName?: () => string
  properties?: { get: (key: string) => string | undefined }
}

type YandexMapsApi = {
  ready: (callback: () => void) => void
  suggest: (
    query: string,
    options?: { results?: number; boundedBy?: [[number, number], [number, number]] },
  ) => Promise<YandexSuggestItem[]>
  geocode: (
    query: string | [number, number],
    options?: { results?: number; kind?: string },
  ) => Promise<{
    geoObjects: {
      get: (index: number) => YandexGeoObject | null
    }
  }>
}

declare global {
  interface Window {
    ymaps?: YandexMapsApi
  }
}

let mapsPromise: Promise<YandexMapsApi> | null = null

export function hasYandexJsKey() {
  return Boolean(process.env.NEXT_PUBLIC_YANDEX_MAPS_API_KEY)
}

export function loadYandexMaps(): Promise<YandexMapsApi> {
  if (typeof window === 'undefined') {
    return Promise.reject(new Error('Yandex Maps JS API доступен только в браузере'))
  }

  if (window.ymaps) {
    return new Promise((resolve) => window.ymaps!.ready(() => resolve(window.ymaps!)))
  }

  if (mapsPromise) return mapsPromise

  const apiKey = process.env.NEXT_PUBLIC_YANDEX_MAPS_API_KEY
  if (!apiKey) {
    return Promise.reject(new Error('Нет NEXT_PUBLIC_YANDEX_MAPS_API_KEY'))
  }

  mapsPromise = new Promise((resolve, reject) => {
    const existing = document.querySelector<HTMLScriptElement>('script[data-yandex-maps]')
    const onReady = () => {
      if (!window.ymaps) {
        reject(new Error('Yandex Maps не загрузился'))
        return
      }
      window.ymaps.ready(() => resolve(window.ymaps!))
    }

    if (existing) {
      existing.addEventListener('load', onReady)
      existing.addEventListener('error', () => reject(new Error('Не удалось загрузить Yandex Maps')))
      return
    }

    const script = document.createElement('script')
    script.dataset.yandexMaps = 'true'
    script.src = `https://api-maps.yandex.ru/2.1/?apikey=${encodeURIComponent(apiKey)}&lang=ru_RU`
    script.async = true
    script.onload = onReady
    script.onerror = () => {
      mapsPromise = null
      reject(new Error('Не удалось загрузить Yandex Maps'))
    }
    document.head.appendChild(script)
  })

  return mapsPromise
}

export async function suggestYandexAddresses(query: string) {
  const ymaps = await loadYandexMaps()
  const variants = buildSearchVariants(query)

  const batches = await Promise.all(
    variants.map(async (text) => {
      try {
        return await ymaps.suggest(text, { results: 10 })
      } catch {
        return []
      }
    }),
  )

  const seen = new Set<string>()
  return batches.flat().flatMap((item, index) => {
    const value = item.value || item.displayName
    if (!value) return []
    const key = value.toLowerCase()
    if (seen.has(key)) return []
    seen.add(key)
    return [
      {
        id: `yandex-${index}-${value}`,
        value,
        displayName: item.displayName,
        lat: null as number | null,
        lng: null as number | null,
      },
    ]
  })
}

export async function geocodeYandexAddress(address: string) {
  const ymaps = await loadYandexMaps()
  const result = await ymaps.geocode(address, { results: 1 })
  const geoObject = result.geoObjects.get(0)
  if (!geoObject) return null

  const [lat, lon] = geoObject.geometry.getCoordinates()
  return {
    lat,
    lng: lon,
    value: geoObject.getAddressLine() || address,
  }
}

export async function reverseGeocodeYandex(lat: number, lon: number) {
  const ymaps = await loadYandexMaps()
  const result = await ymaps.geocode([lat, lon], { results: 1, kind: 'house' })
  const geoObject = result.geoObjects.get(0)
  if (!geoObject) return null

  const value =
    geoObject.getAddressLine?.() ||
    geoObject.properties?.get('text') ||
    geoObject.getName?.() ||
    ''

  if (!value.trim()) return null

  return {
    lat,
    lng: lon,
    value: value.trim(),
  }
}
