'use client'

import { useEffect, useRef, useState } from 'react'
import type { Map as LeafletMap, Marker as LeafletMarker, Polygon as LeafletPolygon } from 'leaflet'
import 'leaflet/dist/leaflet.css'
import { DELIVERY_ZONE_POLYGON, RESTAURANT_LOCATION, type LatLng } from '@/lib/geo'

type LeafletLib = typeof import('leaflet')

async function loadLeaflet(): Promise<LeafletLib> {
  const leafletModule = await import('leaflet')
  return leafletModule.default ?? leafletModule
}

type ZoneStatus = 'idle' | 'checking' | 'inside' | 'outside' | 'incomplete'

interface DeliveryZoneMapProps {
  customer: LatLng | null
  status: ZoneStatus
  visible?: boolean
  onPick?: (point: LatLng) => void
}

function markerIcon(L: LeafletLib, bg: string, emoji: string) {
  return L.divIcon({
    className: 'delivery-map-pin',
    html: `<span style="
      display:flex;align-items:center;justify-content:center;
      width:32px;height:32px;border-radius:9999px;
      background:${bg};box-shadow:0 2px 8px rgba(0,0,0,.25);
      font-size:16px;line-height:1;
    ">${emoji}</span>`,
    iconSize: [32, 32],
    iconAnchor: [16, 32],
  })
}

function restaurantIcon(L: LeafletLib) {
  return L.icon({
    iconUrl: '/restaurant-pin.png',
    iconSize: [42, 52],
    iconAnchor: [21, 50],
    tooltipAnchor: [0, -40],
    className: 'delivery-restaurant-pin',
  })
}

const ZONE_COLORS = {
  idle: { color: '#ea580c', fill: '#f97316' },
  checking: { color: '#ea580c', fill: '#f97316' },
  incomplete: { color: '#ea580c', fill: '#f97316' },
  inside: { color: '#059669', fill: '#10b981' },
  outside: { color: '#dc2626', fill: '#ef4444' },
} as const

export function DeliveryZoneMap({ customer, status, visible = true, onPick }: DeliveryZoneMapProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const mapRef = useRef<LeafletMap | null>(null)
  const polygonRef = useRef<LeafletPolygon | null>(null)
  const customerMarkerRef = useRef<LeafletMarker | null>(null)
  const leafletRef = useRef<LeafletLib | null>(null)
  const onPickRef = useRef(onPick)
  const [mapReady, setMapReady] = useState(0)
  onPickRef.current = onPick

  useEffect(() => {
    if (!containerRef.current) return

    let cancelled = false
    let resize: number | undefined

    void (async () => {
      const L = await loadLeaflet()
      if (cancelled || !containerRef.current || mapRef.current) return

      leafletRef.current = L

      const map = L.map(containerRef.current, {
        zoomControl: false,
        attributionControl: false,
        scrollWheelZoom: false,
      })

      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        maxZoom: 19,
      }).addTo(map)

      L.control.zoom({ position: 'topright' }).addTo(map)

      const polygon = L.polygon(
        DELIVERY_ZONE_POLYGON.map((point) => [point.lat, point.lng] as [number, number]),
        {
          color: ZONE_COLORS.idle.color,
          fillColor: ZONE_COLORS.idle.fill,
          fillOpacity: 0.22,
          weight: 2,
          interactive: false,
        },
      ).addTo(map)

      L.marker([RESTAURANT_LOCATION.lat, RESTAURANT_LOCATION.lng], {
        icon: restaurantIcon(L),
        interactive: false,
      })
        .addTo(map)
        .bindTooltip('Я-пончик · Руставели, 24')

      map.fitBounds(polygon.getBounds(), { padding: [18, 18] })

      map.on('click', (event) => {
        onPickRef.current?.({ lat: event.latlng.lat, lng: event.latlng.lng })
      })

      mapRef.current = map
      polygonRef.current = polygon
      setMapReady((value) => value + 1)

      resize = window.setTimeout(() => map.invalidateSize(), 250)
    })()

    return () => {
      cancelled = true
      if (resize) window.clearTimeout(resize)
      mapRef.current?.remove()
      mapRef.current = null
      polygonRef.current = null
      customerMarkerRef.current = null
    }
  }, [])

  useEffect(() => {
    const L = leafletRef.current
    const map = mapRef.current
    const polygon = polygonRef.current
    if (!L || !map || !polygon) return

    map.invalidateSize()

    const palette = ZONE_COLORS[status]
    polygon.setStyle({
      color: palette.color,
      fillColor: palette.fill,
      fillOpacity: 0.22,
      weight: 2,
    })

    customerMarkerRef.current?.remove()
    customerMarkerRef.current = null

    if (customer) {
      const marker = L.marker([customer.lat, customer.lng], {
        icon: markerIcon(L, status === 'outside' ? '#dc2626' : '#059669', '📍'),
        interactive: false,
      }).addTo(map)
      customerMarkerRef.current = marker

      const latlng = L.latLng(customer.lat, customer.lng)
      if (!map.getBounds().contains(latlng)) {
        const bounds = L.latLngBounds(
          DELIVERY_ZONE_POLYGON.map((point) => [point.lat, point.lng] as [number, number]),
        )
        bounds.extend(customer)
        map.flyToBounds(bounds, { padding: [28, 28], duration: 0.7, maxZoom: 14 })
      }
    }
  }, [customer, mapReady, status, visible])

  return (
    <div className="overflow-hidden rounded-2xl border border-border">
      <div
        ref={containerRef}
        className="z-0 h-48 w-full cursor-crosshair sm:h-52 [&_.leaflet-control-zoom]:border-0 [&_.leaflet-control-zoom-in]:rounded-t-lg [&_.leaflet-control-zoom-out]:rounded-b-lg [&_.leaflet-pane]:!z-0 [&_.leaflet-top]:!z-10"
      />
      <div className="flex flex-col gap-0.5 bg-secondary px-3 py-1.5 text-[11px] font-semibold text-muted-foreground">
        <div className="flex flex-wrap gap-x-3 gap-y-1">
          <span>Нажмите на карту, чтобы выбрать адрес</span>
          {customer ? <span>{status === 'outside' ? '📍 вне зоны' : '📍 ваш адрес'}</span> : null}
        </div>
        <p className="font-medium">*отдаленные районы уточнять у оператора</p>
      </div>
    </div>
  )
}
