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

function truckLocationLine(truck: FoodTruck): string {
  const a = truck.location?.address?.trim()
  if (a) return a
  const h = truck.directoryLocationHint?.trim()
  if (h) return h
  return "Charlotte area"
}

function MapPreviewContent({
  trucks: displayRows,
  sidebarMapEvents,
  mapPinEvents,
}: {
  trucks: ServingTruckRow[]
  sidebarMapEvents: MapEventMarker[]
  mapPinEvents: MapEventMarker[]
}) {
  const [selectedTruck, setSelectedTruck] = useState<FoodTruck | null>(null)
  const [selectedEvent, setSelectedEvent] = useState<MapEventMarker | null>(null)

  const mapTrucks = useMemo(() => mapRowsToMapTrucks(displayRows), [displayRows])
  const trucksOnMap = useMemo(() => mapTrucks.filter(isLiveOnMapTruck), [mapTrucks])

  const liveN = useMemo(
    () => mapTrucks.filter((t) => t.mapPinStatus === "live" || t.mapDisplaySource === "live").length,
    [mapTrucks]
  )
  const mappableLiveN = trucksOnMap.length
  const eventLiveN = mapPinEvents.length
  const totalPins = mappableLiveN + eventLiveN
  const hasLive = liveN > 0

  const statusBlurb = hasLive ? (
    <>
      <span className="font-medium text-foreground">{liveN}</span> truck{liveN === 1 ? "" : "s"} marked open now
      {eventLiveN > 0 ? (
        <>
          {" "}
          · <span className="font-medium text-foreground">{eventLiveN}</span> public event
          {eventLiveN === 1 ? "" : "s"} happening now on the map.
        </>
      ) : (
        "."
      )}
      {eventLiveN === 0 && sidebarMapEvents.some((e) => e.pinPhase === "upcoming") ? (
        <span className="block mt-1 text-xs">
          Event pins appear only during scheduled hours — see upcoming dates in the list or on the events page.
        </span>
      ) : null}
    </>
  ) : eventLiveN > 0 ? (
    <>
      No trucks are marked open right now.{" "}
      <span className="font-medium text-foreground">{eventLiveN}</span> public event
      {eventLiveN === 1 ? "" : "s"} happening now on the map.
    </>
  ) : sidebarMapEvents.length > 0 ? (
    <>
      No live pins on the map right now. Upcoming public events are listed below — orange pins appear when an event is in
      progress.
    </>
  ) : (
    <>No trucks are marked open right now.</>
  )

  const mapKeyLine =
    totalPins > 0 ? (
      <>
        <span className="font-medium text-foreground tabular-nums">{totalPins}</span> live pin
        {totalPins === 1 ? "" : "s"} right now
        {mappableLiveN > 0 && eventLiveN > 0 ? (
          <span>
            {" "}
            ({mappableLiveN} open now, {eventLiveN} event{eventLiveN === 1 ? "" : "s"})
          </span>
        ) : mappableLiveN > 0 ? (
          <span> · vendor check-ins</span>
        ) : eventLiveN > 0 ? (
          <span> · public events in progress</span>
        ) : null}
      </>
    ) : (
      <>No live pins right now</>
    )

  return (
    <section className="py-16 md:py-24 bg-muted/30">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex items-end justify-between mb-8">
          <div>
            <h2 className="font-display text-2xl md:text-3xl font-bold text-foreground">Live truck map</h2>
            <p className="mt-2 text-muted-foreground">
              The map shows real-time activity only: green pins when vendors check in as open, and orange pins when a
              public event is within its scheduled start and end time. For the full vendor directory, visit{" "}
              <Link href="/trucks" className="text-primary hover:underline">
                the trucks page
              </Link>
              .
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
                    <span>Open now (vendor check-in)</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <div className="h-3 w-3 rounded-full bg-orange-500 shrink-0" />
                    <span>Happening now (public event)</span>
                  </div>
                </div>
                <p className="text-[10px] text-muted-foreground/90 mt-1.5 leading-snug">
                  Event pins only during scheduled hours — not a vendor check-in.
                </p>
              </div>
            </div>

            <div className="p-6 bg-background border-t lg:border-t-0 lg:border-l">
              <div className="flex items-center justify-between mb-2">
                <h3 className="font-semibold text-foreground">Live activity</h3>
              </div>
              <p className="text-sm text-muted-foreground mb-4">{statusBlurb}</p>

              {!hasLive && (
                <div className="mb-4 space-y-2">
                  <Button asChild variant="default" className="w-full">
                    <Link href="/trucks">View all trucks</Link>
                  </Button>
                </div>
              )}

              {sidebarMapEvents.length > 0 && (
                <div className="mb-4 rounded-lg border border-orange-500/20 bg-orange-500/5 p-3 text-sm">
                  <p className="font-medium text-foreground flex items-center gap-2">
                    <span className="h-2 w-2 rounded-full bg-orange-500" />
                    Public events
                  </p>
                  <p className="text-[11px] text-muted-foreground mt-1 leading-snug">
                    Cards include upcoming dates; map pins are orange only while an event is in progress.
                  </p>
                  <ul className="mt-2 space-y-2 text-muted-foreground text-xs">
                    {sidebarMapEvents.slice(0, 4).map((ev) => (
                      <li key={ev.id} className="line-clamp-3">
                        <span
                          className={`mr-1 inline-block h-1.5 w-1.5 rounded-full align-middle ${
                            ev.pinPhase === "upcoming" ? "bg-orange-500" : "bg-amber-600"
                          }`}
                          aria-hidden
                        />
                        <span className="font-medium text-foreground">{ev.title}</span>
                        {ev.mapPinStatus === "upcoming_event" ? (
                          <span className="block text-[10px] text-orange-800 dark:text-orange-300/90 mt-0.5">
                            Upcoming · pin during scheduled hours
                          </span>
                        ) : (
                          <span className="block text-[10px] text-amber-800 dark:text-amber-200/80 mt-0.5">
                            Happening now
                          </span>
                        )}
                        <span className="block text-[10px] mt-0.5">
                          {formatMapEventDateTime(ev.date, ev.startTime, ev.endTime)} · {ev.locationLabel}
                        </span>
                      </li>
                    ))}
                    {sidebarMapEvents.length > 4 ? (
                      <li>
                        <Link href="/events" className="text-primary font-medium">
                          +{sidebarMapEvents.length - 4} more on the events page
                        </Link>
                      </li>
                    ) : null}
                  </ul>
                </div>
              )}

              <div className="flex items-center justify-between mb-3">
                <h3 className="font-semibold text-foreground">Open now (map)</h3>
                <span className="text-sm text-muted-foreground tabular-nums">{mapTrucks.length}</span>
              </div>

              <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
                {mapTrucks.length === 0 ? (
                  <p className="text-sm text-muted-foreground py-2">
                    No trucks checked in right now. See Charlotte-area vendors on the{" "}
                    <Link href="/trucks" className="text-primary hover:underline">
                      trucks page
                    </Link>
                    .
                  </p>
                ) : (
                  mapTrucks.map((truck) => {
                    const isLivePin = truck.mapPinStatus === "live" || truck.mapDisplaySource === "live"
                    return (
                      <Link
                        key={truck.id}
                        href={`/trucks/${encodeURIComponent(truck.slug)}`}
                        className="flex items-center gap-3 p-3 rounded-lg hover:bg-muted/50 transition-colors"
                      >
                        <div className="relative h-11 w-11 rounded-lg overflow-hidden shrink-0">
                          <Image src={truck.image} alt={truck.name} fill className="object-cover" />
                        </div>
                        <div className="flex-1 min-w-0 flex items-start gap-2">
                          <span
                            className={`mt-1.5 h-2.5 w-2.5 shrink-0 rounded-full ${
                              isLivePin ? "bg-green-600" : "bg-slate-500"
                            }`}
                            aria-hidden
                          />
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

              <div className="mt-4 flex flex-col gap-2">
                <Button asChild variant="default" className="w-full">
                  <Link href="/map" className="flex items-center justify-center gap-2">
                    <Navigation className="h-4 w-4" />
                    Open full map
                  </Link>
                </Button>
                {sidebarMapEvents.length > 0 ? (
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

export function MapPreview({
  trucks,
  sidebarMapEvents,
  mapPinEvents,
}: {
  trucks: ServingTruckRow[]
  sidebarMapEvents: MapEventMarker[]
  mapPinEvents: MapEventMarker[]
}) {
  return (
    <MapPreviewContent
      trucks={trucks}
      sidebarMapEvents={sidebarMapEvents}
      mapPinEvents={mapPinEvents}
    />
  )
}

export default MapPreview
