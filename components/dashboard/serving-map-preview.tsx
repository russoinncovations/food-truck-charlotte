"use client"

import { useCallback, useEffect } from "react"
import { APIProvider, AdvancedMarker, Map, Pin, useMap } from "@vis.gl/react-google-maps"
import { cn } from "@/lib/utils"

const CHARLOTTE_CENTER = { lat: 35.2271, lng: -80.8431 }
const DEFAULT_ZOOM_NO_PIN = 12
const DEFAULT_ZOOM_PIN = 15

type Props = {
  latitude: number | null
  longitude: number | null
  onPositionChange: (lat: number, lng: number) => void
  className?: string
}

function readLatLngFromGoogleMouseEvent(
  e: google.maps.MapMouseEvent
): { lat: number; lng: number } | null {
  const ll = e.latLng
  if (!ll) return null
  const lat = typeof ll.lat === "function" ? ll.lat() : (ll as google.maps.LatLngLiteral).lat
  const lng = typeof ll.lng === "function" ? ll.lng() : (ll as google.maps.LatLngLiteral).lng
  if (!Number.isFinite(lat) || !Number.isFinite(lng)) return null
  return { lat, lng }
}

function MapPanToPin({ lat, lng }: { lat: number; lng: number }) {
  const map = useMap()
  useEffect(() => {
    if (!map) return
    map.panTo({ lat, lng })
    const z = map.getZoom()
    if (z != null && z < 14) {
      map.setZoom(15)
    }
  }, [map, lat, lng])
  return null
}

function ServingMapInstance({
  latitude,
  longitude,
  onPositionChange,
  mapId,
}: {
  latitude: number | null
  longitude: number | null
  onPositionChange: (lat: number, lng: number) => void
  mapId: string | undefined
}) {
  const nLat = latitude == null ? NaN : Number(latitude)
  const nLng = longitude == null ? NaN : Number(longitude)
  const hasPin = Number.isFinite(nLat) && Number.isFinite(nLng)
  const la = hasPin ? nLat : null
  const lo = hasPin ? nLng : null

  const defaultCenter = hasPin && la != null && lo != null ? { lat: la, lng: lo } : CHARLOTTE_CENTER
  const defaultZoom = hasPin ? DEFAULT_ZOOM_PIN : DEFAULT_ZOOM_NO_PIN

  const onMapClick = useCallback(
    (e: { detail: { latLng: google.maps.LatLngLiteral | null } }) => {
      const ll = e.detail.latLng
      if (!ll) return
      onPositionChange(ll.lat, ll.lng)
    },
    [onPositionChange]
  )

  return (
    <Map
      id="serving-map-preview"
      className="h-full w-full"
      defaultCenter={defaultCenter}
      defaultZoom={defaultZoom}
      gestureHandling="greedy"
      mapId={mapId}
      onClick={onMapClick}
    >
      {hasPin && la != null && lo != null && (
        <>
          <MapPanToPin lat={la} lng={lo} />
          <AdvancedMarker
            position={{ lat: la, lng: lo }}
            draggable
            onDragEnd={(e) => {
              const p = readLatLngFromGoogleMouseEvent(e)
              if (p) onPositionChange(p.lat, p.lng)
            }}
            title="Serving location"
          >
            <Pin background="#2563eb" borderColor="#1d4ed8" glyphColor="#ffffff" />
          </AdvancedMarker>
        </>
      )}
    </Map>
  )
}

/**
 * Editable pin for the vendor “today’s location” form using the same map stack as the public map.
 */
export function ServingMapPreview({ latitude, longitude, onPositionChange, className }: Props) {
  const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY ?? ""
  const mapId = process.env.NEXT_PUBLIC_GOOGLE_MAPS_MAP_ID || undefined

  if (!apiKey) {
    return (
      <div
        className={cn(
          "flex min-h-[220px] w-full flex-col items-center justify-center gap-2 rounded-md border border-dashed border-border bg-muted/30 p-4 text-center text-sm text-muted-foreground",
          className
        )}
      >
        <p className="font-medium text-foreground">Google Maps is not configured</p>
        <p>
          Set <code className="text-xs">NEXT_PUBLIC_GOOGLE_MAPS_API_KEY</code> in your environment to use the map.
        </p>
        {latitude != null && longitude != null && (
          <p className="text-xs font-mono text-muted-foreground tabular-nums">
            {Number(latitude).toFixed(5)}, {Number(longitude).toFixed(5)}
          </p>
        )}
      </div>
    )
  }

  return (
    <div className={cn("flex flex-col overflow-hidden rounded-md border border-border", className)}>
      <div className="h-[220px] w-full min-h-[220px]">
        <APIProvider apiKey={apiKey} libraries={["marker"]}>
          <ServingMapInstance
            latitude={latitude}
            longitude={longitude}
            onPositionChange={onPositionChange}
            mapId={mapId}
          />
        </APIProvider>
      </div>
      {latitude != null && longitude != null && (
        <p className="border-t border-border bg-muted/20 px-3 py-2 text-xs font-mono text-muted-foreground tabular-nums">
          {Number(latitude).toFixed(5)}, {Number(longitude).toFixed(5)}
        </p>
      )}
    </div>
  )
}
