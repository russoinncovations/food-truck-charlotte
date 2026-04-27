"use client"

import { useEffect, useMemo, useState } from "react"
import Link from "next/link"
import Image from "next/image"
import dynamic from "next/dynamic"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Navigation, ArrowRight, Calendar } from "lucide-react"
import { createClient } from "@/lib/supabase/client"
import { mapRowsToMapTrucks, type ServingTruckRow } from "@/lib/map/serving-row-to-food-truck"
import { isValidTruckMapCoordinates } from "@/lib/location/truck-map-coords"
import type { MapEventMarker } from "@/lib/events/map-event-markers"
import type { FoodTruck } from "@/lib/data"

const MapView = dynamic(() => import("@/components/map-view"), {
  ssr: false,
  loading: () => (
    <div className="h-full w-full min-h-[inherit] flex items-center justify-center bg-muted">
      <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full" />
    </div>
  ),
})

const TRUCK_IMAGES = [
  "https://images.unsplash.com/photo-1687351977296-e909232009b4?w=400&h=300&fit=crop",
  "https://images.unsplash.com/photo-1509315811345-672d83ef2fbc?w=400&h=300&fit=crop",
  "https://images.unsplash.com/photo-1626186241349-5d5f44407f55?w=400&h=300&fit=crop",
  "https://images.unsplash.com/photo-1563861019306-9cccb83bdf0c?w=400&h=300&fit=crop",
  "https://images.unsplash.com/photo-1519861155730-0b5fbf0dd889?w=400&h=300&fit=crop",
  "https://images.unsplash.com/photo-1726868734684-ce396eef668e?w=400&h=300&fit=crop",
  "https://images.unsplash.com/photo-1669039415113-48f87a568fdd?w=400&h=300&fit=crop",
]

function getTruckImage(truckId: string): string {
  const index = truckId.split("").reduce((acc, c) => acc + c.charCodeAt(0), 0) % TRUCK_IMAGES.length
  return TRUCK_IMAGES[index]
}

function mappableTruckCount(mapped: FoodTruck[]) {
  return mapped.filter(
    (t) =>
      t.location &&
      isValidTruckMapCoordinates(t.location.lat, t.location.lng)
  ).length
}

function MapPreviewContent({ mapEvents }: { mapEvents: MapEventMarker[] }) {
  const [openTrucks, setOpenTrucks] = useState<ServingTruckRow[]>([])
  const [fetchDone, setFetchDone] = useState(false)
  const [selectedTruck, setSelectedTruck] = useState<FoodTruck | null>(null)
  const [selectedEvent, setSelectedEvent] = useState<MapEventMarker | null>(null)

  useEffect(() => {
    let cancelled = false
    async function load() {
      const supabase = createClient()
      const { data } = await supabase
        .from("trucks")
        .select("id, name, slug, cuisine, latitude, longitude, serving_today, today_location, street_address, today_specials")
        .eq("serving_today", true)
        .limit(12)

      if (!cancelled) {
        setOpenTrucks((data as ServingTruckRow[] | null) ?? [])
        setFetchDone(true)
      }
    }
    void load()
    return () => {
      cancelled = true
    }
  }, [])

  const mapTrucks = useMemo(() => mapRowsToMapTrucks(openTrucks), [openTrucks])
  const trucksOnMap = useMemo(
    () => mapTrucks.filter((t) => t.location && isValidTruckMapCoordinates(t.location.lat, t.location.lng)),
    [mapTrucks]
  )

  const mappableN = mappableTruckCount(mapTrucks)
  const eventN = mapEvents.length
  const totalPins = mappableN + eventN

  return (
    <section className="py-16 md:py-24 bg-muted/30">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex items-end justify-between mb-8">
          <div>
            <h2 className="font-display text-2xl md:text-3xl font-bold text-foreground">Live truck map</h2>
            <p className="mt-2 text-muted-foreground">
              See live trucks and upcoming public food truck events across Charlotte. Orange pins are events.
            </p>
          </div>
          <Button variant="outline" asChild className="hidden md:flex">
            <Link href="/map" className="flex items-center gap-2">
              Open full map
              <ArrowRight className="h-4 w-4" />
            </Link>
          </Button>
        </div>

        <Card className="overflow-hidden">
          <div className="grid lg:grid-cols-3">
            <div className="lg:col-span-2 group relative w-full aspect-[4/3] lg:aspect-auto lg:h-[500px] lg:min-h-[500px] bg-[#f2efe9]">
              <div className="absolute inset-0 z-0 h-full w-full min-h-[inherit]">
                <MapView
                  trucks={trucksOnMap}
                  mapEvents={mapEvents}
                  selectedTruck={selectedTruck}
                  selectedEvent={selectedEvent}
                  onSelectTruck={(t) => {
                    setSelectedEvent(null)
                    setSelectedTruck(t)
                  }}
                  onSelectEvent={(e) => {
                    setSelectedTruck(null)
                    setSelectedEvent(e)
                  }}
                />
              </div>

              <div className="absolute inset-0 z-10 flex items-center justify-center bg-foreground/10 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none group-hover:pointer-events-auto">
                <Button size="lg" asChild>
                  <Link href="/map" className="flex items-center gap-2">
                    <Navigation className="h-5 w-5" />
                    Open Full Map
                  </Link>
                </Button>
              </div>

              <div className="absolute bottom-4 left-4 z-20 bg-background/95 backdrop-blur rounded-lg p-3 shadow-lg pointer-events-none max-w-[min(100%,20rem)]">
                <p className="text-xs text-muted-foreground">
                  {totalPins > 0 ? (
                    <>
                      <span className="font-medium text-foreground tabular-nums">{totalPins}</span> on the map
                      {mappableN > 0 && eventN > 0 ? (
                        <span>
                          {" "}
                          ({mappableN} truck{mappableN === 1 ? "" : "s"}, {eventN} event{eventN === 1 ? "" : "s"}
                          )
                        </span>
                      ) : mappableN > 0 ? (
                        <span> serving now</span>
                      ) : (
                        <span> upcoming event{eventN === 1 ? "" : "s"}</span>
                      )}
                    </>
                  ) : fetchDone ? (
                    <span>No pins to show</span>
                  ) : (
                    "Loading map…"
                  )}
                </p>
                <div className="flex items-center gap-4 text-sm mt-2">
                  <div className="flex items-center gap-2">
                    <div className="h-3 w-3 rounded-full bg-green-600" />
                    <span className="text-muted-foreground">Live truck</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="h-3 w-3 rounded-full bg-orange-500" />
                    <span className="text-muted-foreground">Event</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="p-6 bg-background border-t lg:border-t-0 lg:border-l">
              <div className="flex items-center justify-between mb-2">
                <h3 className="font-semibold text-foreground">On the map</h3>
              </div>
              <p className="text-sm text-muted-foreground mb-4">
                {openTrucks.length > 0 ? (
                  <>
                    <span className="font-medium text-foreground">{openTrucks.length}</span> truck
                    {openTrucks.length === 1 ? "" : "s"} serving
                  </>
                ) : (
                  "No trucks serving right now"
                )}
                {mapEvents.length > 0 ? (
                  <>
                    {" "}
                    · <span className="font-medium text-foreground">{mapEvents.length}</span> upcoming event
                    {mapEvents.length === 1 ? "" : "s"} pinned
                  </>
                ) : null}
                .
              </p>

              {mapEvents.length > 0 && (
                <div className="mb-4 rounded-lg border border-orange-500/20 bg-orange-500/5 p-3 text-sm">
                  <p className="font-medium text-foreground flex items-center gap-2">
                    <span className="h-2 w-2 rounded-full bg-orange-500" />
                    Upcoming events
                  </p>
                  <ul className="mt-2 space-y-1.5 text-muted-foreground text-xs">
                    {mapEvents.slice(0, 4).map((ev) => (
                      <li key={ev.id} className="line-clamp-2">
                        {ev.title}
                      </li>
                    ))}
                    {mapEvents.length > 4 ? (
                      <li>
                        <Link href="/events" className="text-primary font-medium">
                          +{mapEvents.length - 4} more on the events page
                        </Link>
                      </li>
                    ) : null}
                  </ul>
                </div>
              )}

              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <span className="relative flex h-2 w-2">
                    <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-green-500 opacity-75" />
                    <span className="relative inline-flex h-2 w-2 rounded-full bg-green-500" />
                  </span>
                  <h3 className="font-semibold text-foreground">Open now</h3>
                </div>
                <span className="text-sm text-muted-foreground">{openTrucks.length} serving</span>
              </div>

              <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
                {openTrucks.length === 0 ? (
                  <p className="text-sm text-muted-foreground py-2">
                    {mapEvents.length > 0
                      ? "Trucks are offline — see orange event pins on the map or check the full events calendar."
                      : "No trucks serving right now — check back soon"}
                  </p>
                ) : (
                  openTrucks.map((truck) => (
                    <Link
                      key={truck.id}
                      href={`/trucks/${encodeURIComponent((truck.slug && String(truck.slug).trim()) || truck.id)}`}
                      className="flex items-center gap-3 p-3 rounded-lg hover:bg-muted/50 transition-colors"
                    >
                      <div className="relative h-11 w-11 rounded-lg overflow-hidden shrink-0">
                        <Image
                          src={getTruckImage(truck.id)}
                          alt={truck.name}
                          fill
                          className="object-cover"
                        />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-foreground truncate text-sm">{truck.name}</p>
                        <p className="text-xs text-muted-foreground truncate">
                          {truck.today_location?.trim() ? truck.today_location : "Location not set"}
                        </p>
                      </div>
                    </Link>
                  ))
                )}
              </div>

              <div className="mt-4 flex flex-col gap-2">
                <Button asChild variant="default" className="w-full">
                  <Link href="/map" className="flex items-center justify-center gap-2">
                    <Navigation className="h-4 w-4" />
                    Open live map
                  </Link>
                </Button>
                {mapEvents.length > 0 ? (
                  <Button asChild variant="outline" className="w-full">
                    <Link href="/events" className="flex items-center justify-center gap-2">
                      <Calendar className="h-4 w-4" />
                      All upcoming events
                    </Link>
                  </Button>
                ) : null}
              </div>
            </div>
          </div>
        </Card>
      </div>
    </section>
  )
}

export function MapPreview({ mapEvents }: { mapEvents: MapEventMarker[] }) {
  return <MapPreviewContent mapEvents={mapEvents} />
}
export default MapPreview
