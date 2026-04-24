"use client"

import { useCallback, useEffect, useRef } from "react"
import L from "leaflet"
import "leaflet/dist/leaflet.css"
import { isValidTruckMapCoordinates } from "@/lib/location/truck-map-coords"
import { CARTO_LIGHT_BASEMAP_URL, CARTO_LIGHT_TILE_OPTIONS } from "@/lib/leaflet-basemap"
import { cn } from "@/lib/utils"

const CHARLOTTE: [number, number] = [35.2271, -80.8431]
const ZOOM = 14
const LOG = "[ServingMapPreview]"
const isDev = process.env.NODE_ENV === "development"

type Props = {
  latitude: number | null
  longitude: number | null
  onPositionChange: (lat: number, lng: number) => void
  className?: string
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

    const map = L.map(el, { center: CHARLOTTE, zoom: ZOOM, zoomControl: true })
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
      const m = L.marker([lat, lng], { draggable: true, riseOnHover: true }).addTo(map)
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
    requestAnimationFrame(() => map.invalidateSize({ animate: false }))
    setTimeout(() => map.invalidateSize({ animate: false }), 0)
    setTimeout(() => map.invalidateSize({ animate: false }), 100)

    return () => {
      map.off("click", onMapClick)
      markerRef.current = null
      map.remove()
      mapRef.current = null
    }
  }, [bindDragHandlers])

  // Sync from props (geocode / server pin) so marker and map follow parent state
  useEffect(() => {
    const map = mapRef.current
    if (!map) return
    if (latitude == null || longitude == null) return
    if (!isValidTruckMapCoordinates(latitude, longitude)) return

    if (markerRef.current) {
      markerRef.current.setLatLng([Number(latitude), Number(longitude)])
    } else {
      const m = L.marker([Number(latitude), Number(longitude)], { draggable: true, riseOnHover: true }).addTo(map)
      bindDragHandlers(m)
      markerRef.current = m
    }
    map.panTo([Number(latitude), Number(longitude)], { animate: false })
    requestAnimationFrame(() => mapRef.current?.invalidateSize({ animate: false }))
  }, [latitude, longitude, bindDragHandlers])

  return (
    <div
      ref={containerRef}
      className={cn(
        "pointer-events-auto relative z-0 w-full min-h-[220px] rounded-md border border-border bg-[#f2efe9] touch-manipulation",
        className
      )}
    />
  )
}
