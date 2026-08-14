export interface DeliveryPoint {
  lat: number
  lon: number
}

/** Точка ресторана из GeoJSON: Челябинск, ул. Руставели, 24 */
export const RESTAURANT_LOCATION: DeliveryPoint = {
  lat: 55.141032,
  lon: 61.433995,
}

/**
 * Зона доставки из Яндекс.Конструктора
 * (файл: Без названия_14-08-2026_13-16-43.geojson).
 * В GeoJSON вершины идут как [lon, lat] — здесь храним { lat, lon }.
 * Замыкающую точку (совпадает с первой) не дублируем.
 */
export const DELIVERY_POLYGON: DeliveryPoint[] = [
  { lat: 55.16082837338878, lon: 61.4167337700286 },
  { lat: 55.153506325862466, lon: 61.40813007520051 },
  { lat: 55.14613316855041, lon: 61.39817371533721 },
  { lat: 55.14146279434497, lon: 61.3933671967825 },
  { lat: 55.13438244344741, lon: 61.4009202973684 },
  { lat: 55.13091556163099, lon: 61.40662803815194 },
  { lat: 55.1297199090257, lon: 61.41863360570255 },
  { lat: 55.11935403032033, lon: 61.41921296284966 },
  { lat: 55.11573824835254, lon: 61.425414230092045 },
  { lat: 55.11662377636416, lon: 61.44249453709888 },
  { lat: 55.11111350390729, lon: 61.46154894994065 },
  { lat: 55.1119499336782, lon: 61.467299606068565 },
  { lat: 55.12847811344423, lon: 61.479315902455276 },
  { lat: 55.1520778834133, lon: 61.47897257970138 },
  { lat: 55.15964650668151, lon: 61.46420970128332 },
  { lat: 55.16131730704952, lon: 61.42850413487708 },
]

function isPointInPolygon(point: DeliveryPoint, polygon: DeliveryPoint[]): boolean {
  if (polygon.length < 3) return false

  const x = point.lon
  const y = point.lat
  let inside = false

  for (let i = 0, j = polygon.length - 1; i < polygon.length; j = i++) {
    const xi = polygon[i].lon
    const yi = polygon[i].lat
    const xj = polygon[j].lon
    const yj = polygon[j].lat

    const intersects = yi > y !== yj > y && x < ((xj - xi) * (y - yi)) / (yj - yi) + xi

    if (intersects) inside = !inside
  }

  return inside
}

/** true — адрес внутри нарисованной зоны доставки */
export function isAddressInZone(lat: number, lon: number): boolean {
  return isPointInPolygon({ lat, lon }, DELIVERY_POLYGON)
}
