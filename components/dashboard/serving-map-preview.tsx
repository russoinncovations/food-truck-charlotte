"use client"

import { useEffect, useRef } from "react"
import L from "leaflet"
import "leaflet/dist/leaflet.css"
import { isValidTruckMapCoordinates } from "@/lib/location/truck-map-coords"
import { CARTO_LIGHT_BASEMAP_URL, CARTO_LIGHT_TILE_OPTIONS } from "@/lib/leaflet-basemap"
import { cn } from "@/lib/utils"

const CHARLOTTE: [number, number] = [35.2271, -80.8431]
const ZOOM = 14

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

  useEffect(() => {
    const el = containerRef.current
    if (!el || mapRef.current) return

    const map = L.map(el, { center: CHARLOTTE, zoom: ZOOM, zoomControl: true })
    mapRef.current = map
    L.tileLayer(CARTO_LIGHT_BASEMAP_URL, { ...CARTO_LIGHT_TILE_OPTIONS }).addTo(map)

    const ensureMarker = (lat: number, lng: number) => {
      if (!isValidTruckMapCoordinates(lat, lng)) return
      if (markerRef.current) {
        markerRef.current.setLatLng([lat, lng])
      } else {
        const m = L.marker([lat, lng], { draggable: true, riseOnHover: true }).addTo(map)
        m.on("dragend", () => {
          const ll = m.getLatLng()
          onPositionChangeRef.current(ll.lat, ll.lng)
        })
        markerRef.current = m
      }
    }

    map.on("click", (e) => {
      const { lat, lng } = e.latlng
      if (!isValidTruckMapCoordinates(lat, lng)) return
      ensureMarker(lat, lng)
      onPositionChangeRef.current(lat, lng)
    })

    requestAnimationFrame(() => map.invalidateSize())

    return () => {
      markerRef.current = null
      map.remove()
      mapRef.current = null
    }
  }, [])

  // Sync when parent provides new coordinates (e.g. geocoding) or after loading saved pin
  useEffect(() => {
    const map = mapRef.current
    if (!map || latitude == null || longitude == null) return
    if (!isValidTruckMapCoordinates(latitude, longitude)) return

    if (markerRef.current) {
      markerRef.current.setLatLng([latitude, longitude])
    } else {
      const m = L.marker([latitude, longitude], { draggable: true, riseOnHover: true }).addTo(map)
      m.on("dragend", () => {
        const ll = m.getLatLng()
        onPositionChangeRef.current(ll.lat, ll.lng)
      })
      markerRef.current = m
    }
    map.panTo([latitude, longitude], { animate: false })
    requestAnimationFrame(() => map.invalidateSize())
  }, [latitude, longitude])

  return (
    <div
      ref={containerRef}
      className={cn("w-full min-h-[220px] rounded-md border border-border bg-[#f2efe9]", className)}
    />
  )
}
