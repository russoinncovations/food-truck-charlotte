"use client"

import { useEffect, useLayoutEffect, useRef, useState } from "react"
import Link from "next/link"
import { APIProvider, AdvancedMarker, InfoWindow, Map, Pin, useMap } from "@vis.gl/react-google-maps"
import { type FoodTruck } from "@/lib/data"
import { isValidTruckMapCoordinates } from "@/lib/location/truck-map-coords"

const CHARLOTTE_CENTER = { lat: 35.2271, lng: -80.8431 }
const DEFAULT_ZOOM = 12

interface MapViewProps {
  trucks: FoodTruck[]
  selectedTruck: FoodTruck | null
  onSelectTruck: (truck: FoodTruck | null) => void
}

function hasMapLocation(truck: FoodTruck): truck is FoodTruck & {
  location: { lat: number; lng: number; address: string }
} {
  if (!truck.location) return false
  const { lat, lng } = truck.location
  return isValidTruckMapCoordinates(lat, lng)
}

function MapPanToSelected({ selectedTruck }: { selectedTruck: FoodTruck | null }) {
  const map = useMap()
  useEffect(() => {
    if (!map || !selectedTruck || !hasMapLocation(selectedTruck)) return
    const { lat, lng } = selectedTruck.location
    map.panTo({ lat, lng })
    const z = map.getZoom()
    if (z != null && z < 13) {
      map.setZoom(14)
    }
  }, [map, selectedTruck])
  return null
}

export default function MapView({ trucks, selectedTruck, onSelectTruck }: MapViewProps) {
  const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY ?? ""
  const mapId = process.env.NEXT_PUBLIC_GOOGLE_MAPS_MAP_ID

  const mappable = trucks.filter(hasMapLocation)
  const [infoTruckId, setInfoTruckId] = useState<string | null>(null)
  const markerById = useRef(
    new globalThis.Map<string, google.maps.marker.AdvancedMarkerElement | null>()
  )
  const [infoAnchor, setInfoAnchor] = useState<google.maps.marker.AdvancedMarkerElement | null>(null)

  useEffect(() => {
    if (selectedTruck == null) {
      setInfoTruckId(null)
      return
    }
    if (hasMapLocation(selectedTruck)) {
      setInfoTruckId(selectedTruck.id)
    } else {
      setInfoTruckId(null)
    }
  }, [selectedTruck])

  // Bind InfoWindow to the AdvancedMarker instance for the active truck
  useLayoutEffect(() => {
    if (!infoTruckId) {
      setInfoAnchor(null)
      return
    }
    const sync = () => setInfoAnchor(markerById.current.get(infoTruckId) ?? null)
    sync()
    const a = requestAnimationFrame(sync)
    const t = window.setTimeout(sync, 0)
    return () => {
      cancelAnimationFrame(a)
      window.clearTimeout(t)
    }
  }, [infoTruckId, mappable.length])

  const infoTruck = infoTruckId != null ? mappable.find((t) => t.id === infoTruckId) : undefined

  if (!apiKey) {
    return (
      <div className="h-full w-full min-h-[320px] flex flex-col items-center justify-center gap-2 bg-muted/50 border border-dashed border-border p-6 text-center text-sm text-muted-foreground">
        <p className="font-medium text-foreground">Google Maps is not configured</p>
        <p>
          Set <code className="text-xs">NEXT_PUBLIC_GOOGLE_MAPS_API_KEY</code> in your environment.
        </p>
      </div>
    )
  }

  return (
    <APIProvider apiKey={apiKey} libraries={["marker"]}>
      <div className="h-full w-full min-h-[320px] relative">
        <Map
          className="h-full w-full"
          defaultCenter={CHARLOTTE_CENTER}
          defaultZoom={DEFAULT_ZOOM}
          gestureHandling="greedy"
          mapId={mapId || undefined}
        >
          <MapPanToSelected selectedTruck={selectedTruck} />

          {mappable.map((truck) => {
            const open = truck.isOpen
            return (
              <AdvancedMarker
                key={truck.id}
                ref={(el) => {
                  if (el) markerById.current.set(truck.id, el)
                  else markerById.current.delete(truck.id)
                }}
                position={{ lat: truck.location.lat, lng: truck.location.lng }}
                title={truck.name}
                onClick={() => {
                  onSelectTruck(truck)
                  setInfoTruckId(truck.id)
                }}
              >
                <Pin
                  background={open ? "#16a34a" : "#64748b"}
                  borderColor={open ? "#15803d" : "#475569"}
                  glyphColor="#ffffff"
                />
              </AdvancedMarker>
            )
          })}

          {infoTruck != null && (
            <InfoWindow
              key={infoTruck.id}
              anchor={infoAnchor}
              position={
                infoAnchor
                  ? undefined
                  : { lat: infoTruck.location.lat, lng: infoTruck.location.lng }
              }
              onCloseClick={() => {
                setInfoTruckId(null)
              }}
            >
              <div className="max-w-[280px] p-1 pr-2 text-foreground text-sm">
                <p className="font-semibold leading-tight mb-0.5">{infoTruck.name}</p>
                <p className="text-xs text-muted-foreground mb-2">
                  {infoTruck.cuisine.length > 0 ? infoTruck.cuisine.join(", ") : "Cuisine TBD"}
                </p>
                <div className="mb-3">
                  <p className="text-[10px] font-medium uppercase tracking-wide text-muted-foreground">Location</p>
                  <p className="text-xs leading-snug">
                    {infoTruck.location?.address?.trim() ? infoTruck.location.address : "Address not set"}
                  </p>
                </div>
                <div className="flex flex-wrap gap-x-3 gap-y-1">
                  <Link
                    href={`/trucks/${encodeURIComponent(infoTruck.slug)}`}
                    className="text-xs font-semibold text-primary hover:underline"
                  >
                    View profile
                  </Link>
                  <Link href="/book-a-truck" className="text-xs font-semibold text-primary hover:underline">
                    Book this truck
                  </Link>
                </div>
              </div>
            </InfoWindow>
          )}
        </Map>
      </div>
    </APIProvider>
  )
}
