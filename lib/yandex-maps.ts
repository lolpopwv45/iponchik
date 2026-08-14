type YandexSuggestItem = {
  value: string
  displayName: string
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
      get: (index: number) => {
        geometry: { getCoordinates: () => [number, number] }
        getAddressLine: () => string
      } | null
    }
  }>
}

declare global {
  interface Window {
    ymaps?: YandexMapsApi
  }
}

const CHELYABINSK_BOUNDS: [[number, number], [number, number]] = [
  [55.05, 61.2],
  [55.28, 61.65],
]

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
  const text = /челябинск/i.test(query) ? query : `Челябинск, ${query}`
  const items = await ymaps.suggest(text, {
    results: 7,
    boundedBy: CHELYABINSK_BOUNDS,
  })

  return items.map((item, index) => ({
    id: `yandex-${index}-${item.value}`,
    value: item.value,
    displayName: item.displayName,
    lat: null as number | null,
    lng: null as number | null,
  }))
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
  const result = await ymaps.geocode([lat, lon], { results: 1 })
  const geoObject = result.geoObjects.get(0)
  if (!geoObject) return null

  return {
    lat,
    lng: lon,
    value: geoObject.getAddressLine(),
  }
}
