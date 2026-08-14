import {
  DELIVERY_POLYGON,
  RESTAURANT_LOCATION as RESTAURANT_POINT,
  isAddressInZone,
} from '@/lib/deliveryZone'

export interface LatLng {
  lat: number
  lng: number
}

export const RESTAURANT_LOCATION: LatLng = {
  lat: RESTAURANT_POINT.lat,
  lng: RESTAURANT_POINT.lon,
}

export const DELIVERY_ZONE_POLYGON: LatLng[] = DELIVERY_POLYGON.map((point) => ({
  lat: point.lat,
  lng: point.lon,
}))

export function isInDeliveryZone(point: LatLng): boolean {
  return isAddressInZone(point.lat, point.lng)
}

export { DELIVERY_POLYGON, isAddressInZone }
