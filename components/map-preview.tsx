"use client"

import { useMemo, useState } from "react"
import Link from "next/link"
import Image from "next/image"
import dynamic from "next/dynamic"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Navigation, ArrowRight, Calendar } from "lucide-react"
import { mapRowsToMapTrucks, type ServingTruckRow } from "@/lib/map/serving-row-to-food-truck"
import { isValidTruckMapCoordinates } from "@/lib/location/truck-map-coords"
import { formatMapEventDateTime, type MapEventMarker } from "@/lib/events/map-event-markers"
import type { FoodTruck } from "@/lib/data"

const MapView = dynamic(() => import("@/components/map-view"), {
  ssr: false,
  loading: () => (
    <div className="h-full w-full min-h-[inherit] flex items-center justify-center bg-muted">
      <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full" />
    </div>
  ),
})

function isLiveOnMapTruck(t: FoodTruck): boolean {
  return (
    (t.mapPinStatus === "live" || t.mapDisplaySource === "live") &&
    !!t.location &&
    isValidTruckMapCoordinates(t.location.lat, t.location.lng)
  )
}

function truckIsLive(t: FoodTruck): boolean {
  return t.mapPinStatus === "live" || t.mapDisplaySource === "live"
}

function truckLocationLine(truck: FoodTruck): string {
  const a = truck.location?.address?.trim()
  if (a) return a
  const h = truck.directoryLocationHint?.trim()
  if (h) return h
  return "Charlotte area"
}

function MapPreviewContent({
  liveTruckRows,
  allListedTruckRows,
  mapPinEvents,
}: {
  liveTruckRows: ServingTruckRow[]
  allListedTruckRows: ServingTruckRow[]
  mapPinEvents: MapEventMarker[]
}) {
  const [selectedTruck, setSelectedTruck] = useState<FoodTruck | null>(null)
  const [selectedEvent, setSelectedEvent] = useState<MapEventMarker | null>(null)

  const liveMapTrucks = useMemo(() => mapRowsToMapTrucks(liveTruckRows), [liveTruckRows])
  const allListedMapTrucks = useMemo(() => mapRowsToMapTrucks(allListedTruckRows), [allListedTruckRows])
  const listedOnlyMapTrucks = useMemo(
    () => allListedMapTrucks.filter((t) => !truckIsLive(t)),
    [allListedMapTrucks]
  )

  const trucksOnMap = useMemo(() => liveMapTrucks.filter(isLiveOnMapTruck), [liveMapTrucks])

  const liveN = useMemo(() => liveMapTrucks.filter(truckIsLive).length, [liveMapTrucks])
  const mappableLiveN = trucksOnMap.length
  const eventLiveN = mapPinEvents.length
  const totalPins = mappableLiveN + eventLiveN
  const hasLive = liveN > 0

  const statusBlurb = hasLive ? (
    <>
      <span className="font-medium text-foreground">{liveN}</span> truck{liveN === 1 ? "" : "s"} open now
      {eventLiveN > 0 ? (
        <>
          {" "}
          · <span className="font-medium text-foreground">{eventLiveN}</span> event{eventLiveN === 1 ? "" : "s"}{" "}
          happening now on the map.
        </>
      ) : (
        "."
      )}
    </>
  ) : eventLiveN > 0 ? (
    <>
      No trucks open right now.{" "}
      <span className="font-medium text-foreground">{eventLiveN}</span> event{eventLiveN === 1 ? "" : "s"} happening now
      on the map.
    </>
  ) : (
    <>
      No trucks open on the map right now. Browse listed vendors in the sidebar — green pins appear when they check in.
    </>
  )

  const mapKeyLine =
    totalPins > 0 ? (
      <>
        <span className="font-medium text-foreground tabular-nums">{totalPins}</span> live pin{totalPins === 1 ? "" : "s"}{" "}
        right now
        {mappableLiveN > 0 && eventLiveN > 0 ? (
          <span>
            {" "}
            ({mappableLiveN} truck{mappableLiveN === 1 ? "" : "s"}, {eventLiveN} event{eventLiveN === 1 ? "" : "s"})
          </span>
        ) : mappableLiveN > 0 ? (
          <span> · trucks serving now</span>
        ) : eventLiveN > 0 ? (
          <span> · events happening now</span>
        ) : null}
      </>
    ) : (
      <>No live pins right now</>
    )

  const previewListed = listedOnlyMapTrucks.slice(0, 6)
  const previewHappening = mapPinEvents.slice(0, 4)

  return (
    <section className="py-16 md:py-24 bg-muted/30">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex items-end justify-between mb-8">
          <div>
            <h2 className="font-display text-2xl md:text-3xl font-bold text-foreground">Live truck map</h2>
            <p className="mt-2 text-muted-foreground">
              Green pins are trucks serving now. Orange pins are events happening now. The sidebar also lists directory
              vendors without pins until they check in.
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
                  mapEvents={mapPinEvents}
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
                  homeMapPreview
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

              <div className="absolute bottom-4 left-4 z-20 bg-background/95 backdrop-blur rounded-lg p-3 shadow-lg pointer-events-none max-w-[min(100%,22rem)]">
                <p className="text-xs text-muted-foreground">{mapKeyLine}</p>
                <div className="flex flex-wrap items-center gap-x-3 gap-y-2 text-[11px] mt-2 text-muted-foreground">
                  <div className="flex items-center gap-1.5">
                    <div className="h-3 w-3 rounded-full bg-green-600 shrink-0" />
                    <span>Open Now</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <div className="h-3 w-3 rounded-full bg-orange-500 shrink-0" />
                    <span>Happening Now</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="p-6 bg-background border-t lg:border-t-0 lg:border-l space-y-5 max-h-[min(80vh,560px)] lg:max-h-[500px] overflow-y-auto">
              <div>
                <h3 className="font-semibold text-foreground text-sm">Snapshot</h3>
                <p className="text-sm text-muted-foreground mt-1">{statusBlurb}</p>
              </div>

              <div>
                <h3 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Open now</h3>
                <div className="space-y-2 mt-2 max-h-40 overflow-y-auto pr-1">
                  {liveMapTrucks.length === 0 ? (
                    <p className="text-sm text-muted-foreground py-1">No trucks serving on the map right now.</p>
                  ) : (
                    liveMapTrucks.map((truck) => {
                      const isLivePin = truckIsLive(truck)
                      return (
                        <Link
                          key={truck.id}
                          href={`/trucks/${encodeURIComponent(truck.slug)}`}
                          className="flex items-center gap-3 p-2 rounded-lg hover:bg-muted/50 transition-colors"
                        >
                          <div className="relative h-10 w-10 rounded-lg overflow-hidden shrink-0">
                            <Image src={truck.image} alt={truck.name} fill className="object-cover" />
                          </div>
                          <div className="flex-1 min-w-0 flex items-start gap-2">
                            {isLivePin ? (
                              <span className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-green-600" aria-hidden />
                            ) : null}
                            <div className="min-w-0">
                              <p className="font-medium text-foreground truncate text-sm">{truck.name}</p>
                              <p className="text-xs text-muted-foreground truncate">{truckLocationLine(truck)}</p>
                            </div>
                          </div>
                        </Link>
                      )
                    })
                  )}
                </div>
              </div>

              {previewHappening.length > 0 ? (
                <div>
                  <h3 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Happening Now</h3>
                  <ul className="mt-2 space-y-2 text-xs text-muted-foreground">
                    {previewHappening.map((ev) => (
                      <li key={ev.id} className="line-clamp-3">
                        <span className="mr-1 inline-block h-1.5 w-1.5 rounded-full bg-amber-600 align-middle" aria-hidden />
                        <span className="font-medium text-foreground">{ev.title}</span>
                        <span className="block text-[10px] mt-0.5">
                          {formatMapEventDateTime(ev.date, ev.startTime, ev.endTime)} · {ev.locationLabel}
                        </span>
                      </li>
                    ))}
                  </ul>
                </div>
              ) : null}

              <div>
                <h3 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">All listed trucks</h3>
                <p className="text-[11px] text-muted-foreground mt-1">Explore trucks — no pin on the map until checked in.</p>
                <div className="space-y-2 mt-2 max-h-44 overflow-y-auto pr-1">
                  {previewListed.length === 0 ? (
                    <p className="text-xs text-muted-foreground">No directory listings to preview.</p>
                  ) : (
                    previewListed.map((truck) => (
                      <Link
                        key={truck.id}
                        href={`/trucks/${encodeURIComponent(truck.slug)}`}
                        className="flex items-center gap-3 p-2 rounded-lg hover:bg-muted/50 transition-colors"
                      >
                        <div className="relative h-10 w-10 rounded-lg overflow-hidden shrink-0">
                          <Image src={truck.image} alt={truck.name} fill className="object-cover" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-medium text-foreground truncate text-sm">{truck.name}</p>
                          <p className="text-xs text-muted-foreground truncate">{truckLocationLine(truck)}</p>
                        </div>
                      </Link>
                    ))
                  )}
                </div>
              </div>

              <div className="flex flex-col gap-2 pt-2">
                <Button asChild variant="default" className="w-full">
                  <Link href="/map" className="flex items-center justify-center gap-2">
                    <Navigation className="h-4 w-4" />
                    Open full map
                  </Link>
                </Button>
                <Button asChild variant="outline" className="w-full">
                  <Link href="/trucks">Browse all trucks</Link>
                </Button>
                <Button asChild variant="outline" className="w-full">
                  <Link href="/events" className="flex items-center justify-center gap-2">
                    <Calendar className="h-4 w-4" />
                    Events calendar
                  </Link>
                </Button>
              </div>
            </div>
          </div>
        </Card>
      </div>
    </section>
  )
}

export function MapPreview({
  liveTruckRows,
  allListedTruckRows,
  mapPinEvents,
}: {
  liveTruckRows: ServingTruckRow[]
  allListedTruckRows: ServingTruckRow[]
  mapPinEvents: MapEventMarker[]
}) {
  return (
    <MapPreviewContent
      liveTruckRows={liveTruckRows}
      allListedTruckRows={allListedTruckRows}
      mapPinEvents={mapPinEvents}
    />
  )
}

export default MapPreview
