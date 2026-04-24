"use client"

import { useCallback, useEffect, useMemo, useRef, useState } from "react"
import L from "leaflet"
import "leaflet/dist/leaflet.css"
import { isValidTruckMapCoordinates } from "@/lib/location/truck-map-coords"
import { CARTO_LIGHT_BASEMAP_URL, CARTO_LIGHT_TILE_OPTIONS } from "@/lib/leaflet-basemap"
import { cn } from "@/lib/utils"

const CHARLOTTE: [number, number] = [35.2271, -80.8431]
const DEFAULT_ZOOM = 14
/** Zoom when centering on geocode or programmatic pin (street-level) */
const FOCUS_ZOOM = 16
const LOG = "[ServingMapPreview]"
const isDev = process.env.NODE_ENV === "development"

type Props = {
  latitude: number | null
  longitude: number | null
  onPositionChange: (lat: number, lng: number) => void
  className?: string
}

/**
 * divIcon: default Leaflet image markers often fail to load under Next.js bundling (invisible pin).
 */
function createServingPinIcon(): L.DivIcon {
  return L.divIcon({
    className: "serving-map-pin-wrap",
    html: `<div class="serving-map-pin" aria-hidden="true">
  <svg viewBox="0 0 24 36" width="32" height="40" style="filter: drop-shadow(0 2px 2px rgba(0,0,0,.25))" focusable="false">
    <path fill="#0d9488" d="M12 0C5.4 0 0 5.1 0 11.4c0 6.2 4.6 9.1 4.6 9.1L12 36l7.3-15.4s4.5-2.3 4.5-9.1C24 5.1 18.6 0 12 0z"/>
    <circle fill="#fff" cx="12" cy="10.5" r="3.2"/>
  </svg>
</div>`,
    iconSize: [32, 40],
    iconAnchor: [16, 40],
  })
}

/**
 * Draggable pin + map click. Placement uses coordinates only, not the address string.
 */
export function ServingMapPreview({ latitude, longitude, onPositionChange, className }: Props) {
  const containerRef = useRef<HTMLDivElement>(null)
  const mapRef = useRef<L.Map | null>(null)
  const markerRef = useRef<L.Marker | null>(null)
  const onPositionChangeRef = useRef(onPositionChange)
  onPositionChangeRef.current = onPositionChange
  const pinIcon = useMemo(() => createServingPinIcon(), [])

  const [mapReady, setMapReady] = useState(false)

  const bindDragHandlers = useCallback((m: L.Marker) => {
    m.on("drag", () => {
      const ll = m.getLatLng()
      if (isDev) {
        // eslint-disable-next-line no-console
        console.log(LOG, "marker drag", { lat: ll.lat, lng: ll.lng })
      }
      onPositionChangeRef.current(ll.lat, ll.lng)
    })
    m.on("dragend", () => {
      const ll = m.getLatLng()
      if (isDev) {
        // eslint-disable-next-line no-console
        console.log(LOG, "marker dragend", { lat: ll.lat, lng: ll.lng })
      }
      onPositionChangeRef.current(ll.lat, ll.lng)
    })
  }, [])

  useEffect(() => {
    const el = containerRef.current
    if (!el || mapRef.current) return

    const map = L.map(el, { center: CHARLOTTE, zoom: DEFAULT_ZOOM, zoomControl: true })
    mapRef.current = map
    L.tileLayer(CARTO_LIGHT_BASEMAP_URL, { ...CARTO_LIGHT_TILE_OPTIONS }).addTo(map)

    if (isDev) {
      // eslint-disable-next-line no-console
      console.log(LOG, "map initialized")
    }

    const placeOrMoveMarker = (lat: number, lng: number) => {
      if (markerRef.current) {
        markerRef.current.setLatLng([lat, lng])
        return
      }
      const m = L.marker([lat, lng], { icon: pinIcon, draggable: true, riseOnHover: true }).addTo(map)
      bindDragHandlers(m)
      markerRef.current = m
    }

    const onMapClick = (e: L.LeafletMouseEvent) => {
      const lat = e.latlng.lat
      const lng = e.latlng.lng
      if (isDev) {
        // eslint-disable-next-line no-console
        console.log(LOG, "map click", { lat, lng })
      }
      if (!isValidTruckMapCoordinates(lat, lng)) {
        if (isDev) {
          // eslint-disable-next-line no-console
          console.warn(LOG, "map click outside allowed area; move toward Charlotte to place a pin")
        }
        return
      }
      placeOrMoveMarker(lat, lng)
      onPositionChangeRef.current(lat, lng)
    }

    map.on("click", onMapClick)
    const bump = () => map.invalidateSize({ animate: false })
    map.whenReady(() => {
      setMapReady(true)
      bump()
      requestAnimationFrame(bump)
    })
    requestAnimationFrame(bump)
    setTimeout(bump, 0)
    setTimeout(bump, 100)

    return () => {
      setMapReady(false)
      map.off("click", onMapClick)
      markerRef.current = null
      map.remove()
      mapRef.current = null
    }
  }, [bindDragHandlers, pinIcon])

  // Sync from props (geocode / server pin) — also re-runs when map becomes ready if pin was set first.
  useEffect(() => {
    if (!mapReady) return
    const map = mapRef.current
    if (!map) return
    if (latitude == null || longitude == null) return
    if (!isValidTruckMapCoordinates(latitude, longitude)) return

    const la = Number(latitude)
    const lo = Number(longitude)

    if (markerRef.current) {
      markerRef.current.setLatLng([la, lo])
    } else {
      const m = L.marker([la, lo], { icon: pinIcon, draggable: true, riseOnHover: true }).addTo(map)
      bindDragHandlers(m)
      markerRef.current = m
    }
    map.setView([la, lo], FOCUS_ZOOM, { animate: false })
    requestAnimationFrame(() => {
      mapRef.current?.invalidateSize({ animate: false })
    })
  }, [mapReady, latitude, longitude, bindDragHandlers, pinIcon])

  return (
    <div
      ref={containerRef}
      className={cn(
        "pointer-events-auto relative z-0 w-full min-h-[220px] rounded-md border border-border bg-[#f2efe9] touch-manipulation [&_.leaflet-container]:h-[220px] [&_.leaflet-container]:min-h-[220px] [&_.leaflet-container]:w-full [&_.serving-map-pin-wrap]:bg-transparent [&_.serving-map-pin-wrap]:border-0",
        className
      )}
    />
  )
}
