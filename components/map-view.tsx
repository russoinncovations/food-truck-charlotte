"use client"

import { useEffect, useLayoutEffect, useRef, useState } from "react"
import Link from "next/link"
import { APIProvider, AdvancedMarker, InfoWindow, Map, Pin, useMap } from "@vis.gl/react-google-maps"
import { type FoodTruck } from "@/lib/data"
import { isValidTruckMapCoordinates } from "@/lib/location/truck-map-coords"
import { formatMapEventDateTime, type MapEventMarker } from "@/lib/events/map-event-markers"
import { Calendar } from "lucide-react"

const CHARLOTTE_CENTER = { lat: 35.2271, lng: -80.8431 }
const DEFAULT_ZOOM = 12

const ORANGE_EVENT = "#f97316"
const ORANGE_EVENT_BORDER = "#c2410c"

interface MapViewProps {
  trucks: FoodTruck[]
  mapEvents: MapEventMarker[]
  selectedTruck: FoodTruck | null
  selectedEvent: MapEventMarker | null
  onSelectTruck: (truck: FoodTruck | null) => void
  onSelectEvent: (event: MapEventMarker | null) => void
  /** Homepage map preview: friendlier empty copy (no “search / filters” messaging). */
  homeMapPreview?: boolean
  /** When filters/search are inactive, show live-map empty copy instead of “adjust search”. */
  filtersInactive?: boolean
}

function hasMapLocation(truck: FoodTruck): truck is FoodTruck & {
  location: { lat: number; lng: number; address: string }
} {
  if (!truck.location) return false
  const { lat, lng } = truck.location
  return isValidTruckMapCoordinates(lat, lng)
}

function MapPanToSelected({
  selectedTruck,
  selectedEvent,
}: {
  selectedTruck: FoodTruck | null
  selectedEvent: MapEventMarker | null
}) {
  const map = useMap()
  useEffect(() => {
    if (!map) return
    if (selectedTruck && hasMapLocation(selectedTruck)) {
      const { lat, lng } = selectedTruck.location
      map.panTo({ lat, lng })
      const z = map.getZoom()
      if (z != null && z < 13) map.setZoom(14)
      return
    }
    if (selectedEvent) {
      map.panTo({ lat: selectedEvent.lat, lng: selectedEvent.lng })
      const z = map.getZoom()
      if (z != null && z < 13) map.setZoom(14)
    }
  }, [map, selectedTruck, selectedEvent])
  return null
}

export default function MapView({
  trucks,
  mapEvents,
  selectedTruck,
  selectedEvent,
  onSelectTruck,
  onSelectEvent,
  homeMapPreview = false,
  filtersInactive = false,
}: MapViewProps) {
  const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY ?? ""
  const mapId = process.env.NEXT_PUBLIC_GOOGLE_MAPS_MAP_ID

  const mappable = trucks.filter(hasMapLocation)
  const [infoTruckId, setInfoTruckId] = useState<string | null>(null)
  const [infoEventId, setInfoEventId] = useState<string | null>(null)
  const markerById = useRef(new globalThis.Map<string, google.maps.marker.AdvancedMarkerElement | null>())
  const eventMarkerById = useRef(new globalThis.Map<string, google.maps.marker.AdvancedMarkerElement | null>())
  const [infoAnchor, setInfoAnchor] = useState<google.maps.marker.AdvancedMarkerElement | null>(null)
  const [infoEventAnchor, setInfoEventAnchor] = useState<google.maps.marker.AdvancedMarkerElement | null>(null)

  const hasTruckPins = mappable.length > 0
  const hasEventPins = mapEvents.length > 0
  const isEmpty = !hasTruckPins && !hasEventPins

  useEffect(() => {
    if (selectedTruck == null) {
      setInfoTruckId(null)
    } else if (hasMapLocation(selectedTruck)) {
      setInfoTruckId(selectedTruck.id)
      setInfoEventId(null)
    } else {
      setInfoTruckId(null)
    }
  }, [selectedTruck])

  useEffect(() => {
    if (selectedEvent == null) {
      setInfoEventId(null)
    } else {
      setInfoEventId(selectedEvent.id)
      setInfoTruckId(null)
    }
  }, [selectedEvent])

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

  useLayoutEffect(() => {
    if (!infoEventId) {
      setInfoEventAnchor(null)
      return
    }
    const sync = () => setInfoEventAnchor(eventMarkerById.current.get(infoEventId) ?? null)
    sync()
    const a = requestAnimationFrame(sync)
    const t = window.setTimeout(sync, 0)
    return () => {
      cancelAnimationFrame(a)
      window.clearTimeout(t)
    }
  }, [infoEventId, mapEvents.length])

  const infoTruck = infoTruckId != null ? mappable.find((t) => t.id === infoTruckId) : undefined
  const infoEvent = infoEventId != null ? mapEvents.find((e) => e.id === infoEventId) : undefined

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
          <MapPanToSelected selectedTruck={selectedTruck} selectedEvent={selectedEvent} />

          {mappable.map((truck) => (
            <AdvancedMarker
              key={`t-${truck.id}`}
              ref={(el) => {
                if (el) markerById.current.set(truck.id, el)
                else markerById.current.delete(truck.id)
              }}
              position={{ lat: truck.location.lat, lng: truck.location.lng }}
              title={truck.name}
              onClick={() => {
                onSelectTruck(truck)
                onSelectEvent(null)
                setInfoTruckId(truck.id)
                setInfoEventId(null)
              }}
            >
              <Pin background="#16a34a" borderColor="#15803d" glyphColor="#ffffff" />
            </AdvancedMarker>
          ))}

          {mapEvents.map((ev) => (
            <AdvancedMarker
              key={`e-${ev.id}`}
              ref={(el) => {
                if (el) eventMarkerById.current.set(ev.id, el)
                else eventMarkerById.current.delete(ev.id)
              }}
              position={{ lat: ev.lat, lng: ev.lng }}
              title={ev.title}
              onClick={() => {
                onSelectEvent(ev)
                onSelectTruck(null)
                setInfoEventId(ev.id)
                setInfoTruckId(null)
              }}
            >
              <Pin background={ORANGE_EVENT} borderColor={ORANGE_EVENT_BORDER} glyphColor="#ffffff" />
            </AdvancedMarker>
          ))}

          {infoTruck != null && (
            <InfoWindow
              key={`iw-t-${infoTruck.id}`}
              anchor={infoAnchor}
              position={infoAnchor ? undefined : { lat: infoTruck.location.lat, lng: infoTruck.location.lng }}
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

          {infoEvent != null && (
            <InfoWindow
              key={`iw-e-${infoEvent.id}`}
              anchor={infoEventAnchor}
              position={infoEventAnchor ? undefined : { lat: infoEvent.lat, lng: infoEvent.lng }}
              onCloseClick={() => {
                setInfoEventId(null)
              }}
            >
              <div className="max-w-[280px] p-1 pr-2 text-foreground text-sm">
                <p className="font-semibold leading-tight mb-0.5">{infoEvent.title}</p>
                <p className="text-xs text-muted-foreground flex items-center gap-1 mt-0.5 mb-2">
                  <Calendar className="h-3 w-3 shrink-0" />
                  {formatMapEventDateTime(infoEvent.date, infoEvent.startTime, infoEvent.endTime)}
                </p>
                <div className="mb-2">
                  <p className="text-[10px] font-medium uppercase tracking-wide text-muted-foreground">Location</p>
                  <p className="text-xs leading-snug">{infoEvent.locationLabel}</p>
                </div>
                {infoEvent.slug && String(infoEvent.slug).trim() !== "" ? (
                  <Link
                    href={`/events/${encodeURIComponent(String(infoEvent.slug).trim())}`}
                    className="text-xs font-semibold text-primary hover:underline"
                  >
                    View event
                  </Link>
                ) : (
                  <Link href="/events" className="text-xs font-semibold text-primary hover:underline">
                    All events
                  </Link>
                )}
              </div>
            </InfoWindow>
          )}
        </Map>

        {isEmpty && (
          <div className="pointer-events-none absolute inset-0 z-10 flex items-center justify-center p-4">
            <div className="pointer-events-auto rounded-lg border border-border/80 bg-background/90 px-4 py-3 text-sm text-muted-foreground shadow-sm backdrop-blur text-center space-y-2 max-w-sm">
              {homeMapPreview || filtersInactive ? (
                <>
                  <p>No trucks are live right now.</p>
                  <Link
                    href="/trucks"
                    className="inline-flex text-xs font-semibold text-primary hover:underline"
                  >
                    View all trucks
                  </Link>
                </>
              ) : (
                <p>No locations match your search. Try different keywords or clear filters.</p>
              )}
            </div>
          </div>
        )}
      </div>
    </APIProvider>
  )
}

