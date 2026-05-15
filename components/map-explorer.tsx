"use client"

import { useState, useMemo } from "react"
import { useMinWidthLg } from "@/hooks/use-min-width-lg"
import Link from "next/link"
import Image from "next/image"
import dynamic from "next/dynamic"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Search,
  MapPin,
  Star,
  Clock,
  Filter,
  X,
  List,
  Map,
  ChevronLeft,
  Truck,
  Navigation,
  Calendar,
} from "lucide-react"
import { cuisineCategories, type FoodTruck } from "@/lib/data"
import { mapRowsToMapTrucks, type ServingTruckRow } from "@/lib/map/serving-row-to-food-truck"
import { type MapEventMarker, formatMapEventDateTime } from "@/lib/events/map-event-markers"

export type { ServingTruckRow }

// Dynamically import map to avoid SSR issues
const MapView = dynamic(() => import("@/components/map-view"), {
  ssr: false,
  loading: () => (
    <div className="h-full w-full bg-muted flex items-center justify-center">
      <div className="text-center">
        <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full mx-auto mb-4" />
        <p className="text-muted-foreground">Loading map...</p>
      </div>
    </div>
  ),
})

export function MapExplorer({
  liveTruckRows,
  exploreTruckRows,
  sidebarMapEvents,
  mapPinEvents,
  hasAnyTrucksInDb = true,
}: {
  liveTruckRows: ServingTruckRow[]
  exploreTruckRows: ServingTruckRow[]
  sidebarMapEvents: MapEventMarker[]
  mapPinEvents: MapEventMarker[]
  hasAnyTrucksInDb?: boolean
}) {
  const isLg = useMinWidthLg()
  const [searchQuery, setSearchQuery] = useState("")
  const [selectedCuisine, setSelectedCuisine] = useState("all")
  const [showOpenOnly, setShowOpenOnly] = useState(false)
  const [selectedTruck, setSelectedTruck] = useState<FoodTruck | null>(null)
  const [selectedEvent, setSelectedEvent] = useState<MapEventMarker | null>(null)
  const [viewMode, setViewMode] = useState<"map" | "list">("map")
  const [isSidebarOpen, setIsSidebarOpen] = useState(true)

  const liveMapTrucks = useMemo(() => mapRowsToMapTrucks(liveTruckRows), [liveTruckRows])
  const exploreMapTrucks = useMemo(() => mapRowsToMapTrucks(exploreTruckRows), [exploreTruckRows])

  const liveCount = useMemo(
    () =>
      liveMapTrucks.filter((t) => t.mapPinStatus === "live" || t.mapDisplaySource === "live").length,
    [liveMapTrucks]
  )
  const anyLiveReporting = liveCount > 0

  const filteredLiveTrucks = useMemo(() => {
    const q = searchQuery.toLowerCase()
    return liveMapTrucks.filter((truck) => {
      const hint = (truck.directoryLocationHint ?? "").toLowerCase()
      const matchesSearch =
        searchQuery === "" ||
        truck.name.toLowerCase().includes(q) ||
        truck.cuisine.some((c) => c.toLowerCase().includes(q)) ||
        hint.includes(q)
      const matchesCuisine =
        selectedCuisine === "all" ||
        truck.cuisine.some((c) => c.toLowerCase() === selectedCuisine.toLowerCase())
      const matchesOpen = !showOpenOnly || truck.isOpen
      return matchesSearch && matchesCuisine && matchesOpen
    })
  }, [liveMapTrucks, searchQuery, selectedCuisine, showOpenOnly])

  const filteredExploreTrucks = useMemo(() => {
    if (showOpenOnly) return []
    const q = searchQuery.toLowerCase()
    return exploreMapTrucks.filter((truck) => {
      const hint = (truck.directoryLocationHint ?? "").toLowerCase()
      const matchesSearch =
        searchQuery === "" ||
        truck.name.toLowerCase().includes(q) ||
        truck.cuisine.some((c) => c.toLowerCase().includes(q)) ||
        hint.includes(q)
      const matchesCuisine =
        selectedCuisine === "all" ||
        truck.cuisine.some((c) => c.toLowerCase() === selectedCuisine.toLowerCase())
      return matchesSearch && matchesCuisine
    })
  }, [exploreMapTrucks, searchQuery, selectedCuisine, showOpenOnly])

  const upcomingEvents = useMemo(
    () => sidebarMapEvents.filter((e) => e.pinPhase === "upcoming"),
    [sidebarMapEvents]
  )

  const filteredUpcomingMapEvents = useMemo(() => {
    const q = searchQuery.toLowerCase()

    return upcomingEvents.filter((e) => e.title.toLowerCase().includes(q))
  }, [upcomingEvents, searchQuery])

  const filteredMapPinEvents = useMemo(() => {
    if (!searchQuery.trim()) return mapPinEvents
    const q = searchQuery.toLowerCase()
    return mapPinEvents.filter((e) => e.title.toLowerCase().includes(q))
  }, [mapPinEvents, searchQuery])

  const setSelectedTruckAndClearEvent = (t: FoodTruck | null) => {
    setSelectedEvent(null)
    setSelectedTruck(t)
  }
  const setSelectedEventAndClearTruck = (e: MapEventMarker | null) => {
    setSelectedTruck(null)
    setSelectedEvent(e)
  }

  return (
    <div className="h-screen flex flex-col">
      {/* Header */}
      <header className="h-16 border-b bg-background flex items-center justify-between px-4 shrink-0">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" asChild>
            <Link href="/">
              <ChevronLeft className="h-5 w-5" />
              <span className="sr-only">Back to home</span>
            </Link>
          </Button>
          <Link href="/" className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary">
              <Truck className="h-4 w-4 text-primary-foreground" />
            </div>
            <span className="font-display font-bold hidden sm:block">FoodTruck CLT</span>
          </Link>
        </div>

        {/* Mobile View Toggle */}
        <div className="flex items-center gap-2 lg:hidden">
          <Tabs value={viewMode} onValueChange={(v) => setViewMode(v as "map" | "list")}>
            <TabsList className="h-9">
              <TabsTrigger value="map" className="px-3">
                <Map className="h-4 w-4" />
              </TabsTrigger>
              <TabsTrigger value="list" className="px-3">
                <List className="h-4 w-4" />
              </TabsTrigger>
            </TabsList>
          </Tabs>
        </div>

        {/* Desktop Controls */}
        <div className="hidden lg:flex items-center gap-2">
          {anyLiveReporting ? (
            <Badge variant="secondary" className="gap-1">
              <span className="relative flex h-2 w-2">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-green-500 opacity-75" />
                <span className="relative inline-flex h-2 w-2 rounded-full bg-green-500" />
              </span>
              {liveCount} {liveCount === 1 ? "truck" : "trucks"} checked in
            </Badge>
          ) : (
            <Badge variant="secondary" className="max-w-[18rem] text-left font-normal leading-snug text-muted-foreground">
              No trucks checked in
            </Badge>
          )}
          <Button
            variant="outline"
            size="sm"
            onClick={() => setIsSidebarOpen(!isSidebarOpen)}
          >
            {isSidebarOpen ? "Hide List" : "Show List"}
          </Button>
        </div>
      </header>

      <p className="shrink-0 border-b border-border/80 bg-muted/30 px-4 py-2 text-center text-xs text-muted-foreground leading-snug">
        Map pins are real-time only: green for trucks checked in now, orange for public events in progress. Sidebar lists
        directory trucks and upcoming events — those never get pins until live.
      </p>

      <div className="flex-1 flex overflow-hidden">
        {/* Sidebar - Desktop */}
        <aside
          className={`hidden lg:flex flex-col w-96 border-r bg-background transition-all ${
            isSidebarOpen ? "" : "w-0 overflow-hidden border-0"
          }`}
        >
          <SidebarContent
            searchQuery={searchQuery}
            setSearchQuery={setSearchQuery}
            selectedCuisine={selectedCuisine}
            setSelectedCuisine={setSelectedCuisine}
            showOpenOnly={showOpenOnly}
            setShowOpenOnly={setShowOpenOnly}
            filteredLiveTrucks={filteredLiveTrucks}
            filteredExploreTrucks={filteredExploreTrucks}
            filteredMapPinEvents={filteredMapPinEvents}
            filteredUpcomingMapEvents={filteredUpcomingMapEvents}
            mapPinEventsCount={mapPinEvents.length}
            anyLiveReporting={anyLiveReporting}
            selectedTruck={selectedTruck}
            selectedEvent={selectedEvent}
            setSelectedTruck={setSelectedTruckAndClearEvent}
            setSelectedEvent={setSelectedEventAndClearTruck}
            hasAnyTrucksInDb={hasAnyTrucksInDb}
          />
        </aside>

        {/* Mobile Sidebar Sheet */}
        <Sheet>
          <SheetTrigger asChild>
            <Button
              variant="secondary"
              size="icon"
              className="lg:hidden fixed bottom-20 left-4 z-50 h-12 w-12 rounded-full shadow-lg"
            >
              <Filter className="h-5 w-5" />
            </Button>
          </SheetTrigger>
          <SheetContent side="left" className="w-full sm:w-96 p-0">
            <SidebarContent
              searchQuery={searchQuery}
              setSearchQuery={setSearchQuery}
              selectedCuisine={selectedCuisine}
              setSelectedCuisine={setSelectedCuisine}
              showOpenOnly={showOpenOnly}
              setShowOpenOnly={setShowOpenOnly}
              filteredLiveTrucks={filteredLiveTrucks}
              filteredExploreTrucks={filteredExploreTrucks}
              filteredMapPinEvents={filteredMapPinEvents}
              filteredUpcomingMapEvents={filteredUpcomingMapEvents}
              mapPinEventsCount={mapPinEvents.length}
              anyLiveReporting={anyLiveReporting}
              selectedTruck={selectedTruck}
              selectedEvent={selectedEvent}
              setSelectedTruck={setSelectedTruckAndClearEvent}
              setSelectedEvent={setSelectedEventAndClearTruck}
              hasAnyTrucksInDb={hasAnyTrucksInDb}
            />
          </SheetContent>
        </Sheet>

        {/* Map or List View */}
        <main className="flex-1 relative">
          {viewMode === "map" || isLg ? (
            <MapView
              trucks={filteredLiveTrucks}
              mapEvents={filteredMapPinEvents}
              selectedTruck={selectedTruck}
              selectedEvent={selectedEvent}
              onSelectTruck={setSelectedTruckAndClearEvent}
              onSelectEvent={setSelectedEventAndClearTruck}
              filtersInactive={
                searchQuery.trim() === "" && selectedCuisine === "all" && !showOpenOnly
              }
            />
          ) : (
            <div className="lg:hidden h-full overflow-auto p-4">
              <MobileListView
                filteredLiveTrucks={filteredLiveTrucks}
                filteredExploreTrucks={filteredExploreTrucks}
                filteredMapPinEvents={filteredMapPinEvents}
                filteredUpcomingMapEvents={filteredUpcomingMapEvents}
                searchQuery={searchQuery}
                setSearchQuery={setSearchQuery}
                selectedCuisine={selectedCuisine}
                setSelectedCuisine={setSelectedCuisine}
                selectedTruck={selectedTruck}
                selectedEvent={selectedEvent}
                setSelectedTruck={setSelectedTruckAndClearEvent}
                setSelectedEvent={setSelectedEventAndClearTruck}
              />
            </div>
          )}

          {/* Selected Truck Card - Mobile */}
          {selectedTruck && viewMode === "map" && (
            <div className="lg:hidden absolute bottom-4 left-4 right-4 z-40">
              <TruckCard
                truck={selectedTruck}
                onClose={() => setSelectedTruckAndClearEvent(null)}
                compact
              />
            </div>
          )}
          {selectedEvent && viewMode === "map" && (
            <div className="lg:hidden absolute bottom-4 left-4 right-4 z-40">
              <EventMapCard event={selectedEvent} onClose={() => setSelectedEventAndClearTruck(null)} />
            </div>
          )}
        </main>
      </div>
    </div>
  )
}

function MapPinLegend({ className }: { className?: string }) {
  return (
    <div className={className}>
      <div
        className="flex flex-wrap gap-x-4 gap-y-2 text-[11px] text-muted-foreground"
        aria-label="Map legend — real-time pins only"
      >
        <div className="flex items-center gap-1.5">
          <span className="h-2.5 w-2.5 rounded-full bg-green-600 shrink-0" />
          <span>Live now (checked in)</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="h-2.5 w-2.5 rounded-full bg-orange-500 shrink-0" />
          <span>Event in progress</span>
        </div>
      </div>
      <p className="text-[10px] text-muted-foreground/90 mt-1.5 leading-snug">
        Pins never include directory-only trucks or upcoming events — those stay in the sidebar lists.
      </p>
    </div>
  )
}

function SidebarContent({
  searchQuery,
  setSearchQuery,
  selectedCuisine,
  setSelectedCuisine,
  showOpenOnly,
  setShowOpenOnly,
  filteredLiveTrucks,
  filteredExploreTrucks,
  filteredMapPinEvents,
  filteredUpcomingMapEvents,
  mapPinEventsCount,
  anyLiveReporting,
  selectedTruck,
  selectedEvent,
  setSelectedTruck,
  setSelectedEvent,
  hasAnyTrucksInDb,
}: {
  searchQuery: string
  setSearchQuery: (v: string) => void
  selectedCuisine: string
  setSelectedCuisine: (v: string) => void
  showOpenOnly: boolean
  setShowOpenOnly: (v: boolean) => void
  filteredLiveTrucks: FoodTruck[]
  filteredExploreTrucks: FoodTruck[]
  filteredMapPinEvents: MapEventMarker[]
  filteredUpcomingMapEvents: MapEventMarker[]
  mapPinEventsCount: number
  anyLiveReporting: boolean
  selectedTruck: FoodTruck | null
  selectedEvent: MapEventMarker | null
  setSelectedTruck: (v: FoodTruck | null) => void
  setSelectedEvent: (v: MapEventMarker | null) => void
  hasAnyTrucksInDb: boolean
}) {
  const filtersActive =
    searchQuery.trim() !== "" || selectedCuisine !== "all" || showOpenOnly
  const listTotallyEmpty =
    filteredLiveTrucks.length === 0 &&
    filteredMapPinEvents.length === 0 &&
    filteredUpcomingMapEvents.length === 0 &&
    filteredExploreTrucks.length === 0

  return (
    <>
      {/* Search & Filters */}
      <div className="p-4 border-b space-y-4">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            type="text"
            placeholder="Search trucks, cuisines, or events…"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9"
          />
        </div>

        <MapPinLegend className="pb-3 border-b" />

        <div className="flex gap-2">
          <Select value={selectedCuisine} onValueChange={setSelectedCuisine}>
            <SelectTrigger className="flex-1">
              <SelectValue placeholder="All Cuisines" />
            </SelectTrigger>
            <SelectContent>
              {cuisineCategories.map((cat) => (
                <SelectItem key={cat.id} value={cat.id}>
                  {cat.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Button
            variant={showOpenOnly ? "default" : "outline"}
            size="sm"
            disabled={!anyLiveReporting}
            title={anyLiveReporting ? undefined : "No trucks checked in right now"}
            onClick={() => anyLiveReporting && setShowOpenOnly(!showOpenOnly)}
            className="whitespace-nowrap"
          >
            Open only
          </Button>
        </div>
      </div>

      {/* Results Count — map-relevant live counts */}
      <div className="px-4 py-3 border-b bg-muted/50 space-y-1">
        <p className="text-sm text-muted-foreground">
          <span className="font-medium text-foreground">{filteredLiveTrucks.length}</span> truck
          {filteredLiveTrucks.length === 1 ? "" : "s"} live now in this list
          {mapPinEventsCount > 0 ? (
            <>
              {" "}
              ·{" "}
              <span className="font-medium text-foreground">{filteredMapPinEvents.length}</span> event
              {filteredMapPinEvents.length === 1 ? "" : "s"} in progress on the map
            </>
          ) : null}
          .
        </p>
        {!anyLiveReporting ? (
          <p className="text-xs text-muted-foreground leading-snug">
            No trucks currently checked in — green pins will appear when vendors mark themselves serving.
          </p>
        ) : null}
      </div>

      <ScrollArea className="flex-1">
        <div className="p-4 space-y-6">
          {/* 1 — Live Now */}
          <div className="space-y-2">
            <h3 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Live Now</h3>
            {filteredLiveTrucks.length > 0 ? (
              <div className="space-y-3">
                {filteredLiveTrucks.map((truck) => (
                  <div key={truck.id} className="space-y-1">
                    <button
                      type="button"
                      className="w-full text-left rounded-xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                      onClick={() => setSelectedTruck(truck)}
                    >
                      <TruckCard truck={truck} isSelected={selectedTruck?.id === truck.id} />
                    </button>
                    <Link
                      href={`/trucks/${truck.slug}`}
                      className="text-xs text-primary pl-1 hover:underline"
                      onClick={(e) => e.stopPropagation()}
                    >
                      View truck profile
                    </Link>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground rounded-lg border border-dashed border-border/80 bg-muted/30 px-3 py-3">
                No trucks currently checked in.
              </p>
            )}
          </div>

          {/* 2 — Happening Now */}
          {filteredMapPinEvents.length > 0 ? (
            <div className="space-y-2">
              <h3 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Happening Now</h3>
              <p className="text-[11px] text-muted-foreground leading-snug">
                Matches orange map pins (public event within scheduled hours).
              </p>
              <div className="space-y-2">
                {filteredMapPinEvents.map((ev) => (
                  <button
                    key={ev.id}
                    type="button"
                    className={`w-full text-left rounded-xl border transition-all ${
                      selectedEvent?.id === ev.id
                        ? "border-amber-600 shadow-md ring-1 ring-amber-600/30"
                        : "border-border hover:border-amber-600/50"
                    }`}
                    onClick={() => setSelectedEvent(ev)}
                  >
                    <div className="p-3">
                      <div className="flex items-start gap-2">
                        <span className="mt-1.5 h-2.5 w-2.5 shrink-0 rounded-full bg-amber-600" aria-hidden />
                        <div className="min-w-0 flex-1">
                          <p className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
                            Happening now
                          </p>
                          <p className="font-semibold text-sm text-foreground leading-snug">{ev.title}</p>
                          <p className="text-xs text-muted-foreground flex items-center gap-1 mt-0.5">
                            <Calendar className="h-3 w-3 shrink-0" />
                            {formatMapEventDateTime(ev.date, ev.startTime, ev.endTime)}
                          </p>
                          <p className="text-xs text-muted-foreground mt-1 line-clamp-2">{ev.locationLabel}</p>
                        </div>
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          ) : null}

          {/* 3 — Explore Trucks */}
          {!showOpenOnly && filteredExploreTrucks.length > 0 ? (
            <div className="space-y-2">
              <h3 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Explore Trucks</h3>
              <p className="text-[11px] text-muted-foreground leading-snug">
                Directory listings — not shown as map pins unless checked in as open.
              </p>
              <div className="space-y-3">
                {filteredExploreTrucks.map((truck) => (
                  <div key={truck.id} className="space-y-1">
                    <button
                      type="button"
                      className="w-full text-left rounded-xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                      onClick={() => setSelectedTruck(truck)}
                    >
                      <TruckCard truck={truck} isSelected={selectedTruck?.id === truck.id} />
                    </button>
                    <Link
                      href={`/trucks/${truck.slug}`}
                      className="text-xs text-primary pl-1 hover:underline"
                      onClick={(e) => e.stopPropagation()}
                    >
                      View truck profile
                    </Link>
                  </div>
                ))}
              </div>
            </div>
          ) : null}

          {/* 4 — Upcoming events */}
          {filteredUpcomingMapEvents.length > 0 ? (
            <div className="space-y-2">
              <h3 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Upcoming Events</h3>
              <p className="text-[11px] text-muted-foreground leading-snug">
                Not on the map yet — pins appear when the event reaches its start time.
              </p>
              <div className="space-y-2">
                {filteredUpcomingMapEvents.map((ev) => (
                  <button
                    key={ev.id}
                    type="button"
                    className={`w-full text-left rounded-xl border transition-all ${
                      selectedEvent?.id === ev.id
                        ? "border-orange-500 shadow-md ring-1 ring-orange-500/30"
                        : "border-border hover:border-orange-500/50"
                    }`}
                    onClick={() => setSelectedEvent(ev)}
                  >
                    <div className="p-3">
                      <div className="flex items-start gap-2">
                        <span className="mt-1.5 h-2.5 w-2.5 shrink-0 rounded-full bg-orange-500" aria-hidden />
                        <div className="min-w-0 flex-1">
                          <p className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
                            Upcoming
                          </p>
                          <p className="font-semibold text-sm text-foreground leading-snug">{ev.title}</p>
                          <p className="text-[11px] text-orange-800 dark:text-orange-300/90 mt-0.5">Not on the map yet.</p>
                          <p className="text-xs text-muted-foreground flex items-center gap-1 mt-0.5">
                            <Calendar className="h-3 w-3 shrink-0" />
                            {formatMapEventDateTime(ev.date, ev.startTime, ev.endTime)}
                          </p>
                          <p className="text-xs text-muted-foreground mt-1 line-clamp-2">{ev.locationLabel}</p>
                        </div>
                      </div>
                    </div>
                  </button>
                ))}
                <p className="text-xs text-muted-foreground pl-1">
                  Full calendar on the{" "}
                  <Link href="/events" className="text-primary underline">
                    events page
                  </Link>
                  .
                </p>
              </div>
            </div>
          ) : null}

          {listTotallyEmpty ? (
            <div className="text-center py-8 space-y-4">
              <Truck className="h-10 w-10 mx-auto text-muted-foreground/50" />
              {!hasAnyTrucksInDb ? (
                <p className="text-muted-foreground text-sm">Trucks are being added now — check back soon.</p>
              ) : filtersActive ? (
                <>
                  <p className="text-muted-foreground text-sm">
                    Nothing matched your search or filters. Try different keywords or clear filters.
                  </p>
                  <Button asChild variant="default" size="sm">
                    <Link href="/trucks">View all trucks</Link>
                  </Button>
                </>
              ) : (
                <>
                  <p className="text-muted-foreground text-sm">
                    Nothing to show here yet. Browse the full directory or events calendar.
                  </p>
                  <Button asChild variant="default" size="sm">
                    <Link href="/trucks">View all trucks</Link>
                  </Button>
                </>
              )}
            </div>
          ) : null}
        </div>
      </ScrollArea>
    </>
  )
}

function EventMapCard({ event, onClose }: { event: MapEventMarker; onClose: () => void }) {
  const href =
    event.slug && String(event.slug).trim() !== "" ? `/events/${encodeURIComponent(String(event.slug).trim())}` : "/events"
  const isUpcoming = event.mapPinStatus === "upcoming_event"
  return (
    <div
      className={`relative bg-card rounded-xl shadow-xl p-4 border ${
        isUpcoming ? "border-orange-500/40" : "border-amber-600/45"
      }`}
    >
      <Button variant="ghost" size="icon" className="absolute top-2 right-2 h-8 w-8" onClick={onClose}>
        <X className="h-4 w-4" />
      </Button>
      <div className="pr-8">
        <div className="flex items-center gap-2 mb-1">
          <span
            className={`h-2.5 w-2.5 rounded-full shrink-0 ${isUpcoming ? "bg-orange-500" : "bg-amber-600"}`}
          />
          <h3 className="font-semibold text-foreground">{event.title}</h3>
        </div>
        <p className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wide">
          {isUpcoming ? "Upcoming Event" : "Happening now — public event"}
        </p>
        {isUpcoming ? (
          <p className="text-xs text-orange-800 dark:text-orange-300/90 mt-1">Not open yet.</p>
        ) : null}
        <p className="text-xs text-muted-foreground flex items-center gap-1 mb-2 mt-1.5">
          <Calendar className="h-3.5 w-3.5 shrink-0" />
          {formatMapEventDateTime(event.date, event.startTime, event.endTime)}
        </p>
        <p className="text-sm text-muted-foreground mb-3 flex items-start gap-1.5">
          <MapPin className="h-3.5 w-3.5 shrink-0 mt-0.5" />
          <span>{event.locationLabel}</span>
        </p>
        <Button size="sm" className="w-full" asChild>
          <Link href={href}>View Event</Link>
        </Button>
      </div>
    </div>
  )
}

function TruckCard({
  truck,
  isSelected,
  onClose,
  compact = false,
}: {
  truck: FoodTruck
  isSelected?: boolean
  onClose?: () => void
  compact?: boolean
}) {
  const nextStop = truck.schedule[0]
  const isLivePin = truck.mapPinStatus === "live" || truck.mapDisplaySource === "live"
  const locationLine =
    truck.location?.address && truck.location.address.trim() !== ""
      ? truck.location.address
      : truck.directoryLocationHint && truck.directoryLocationHint.trim() !== ""
        ? truck.directoryLocationHint
        : null

  return (
    <div
      className={`relative bg-card rounded-xl border transition-all ${
        isSelected
          ? isLivePin
            ? "border-primary shadow-lg"
            : "border-slate-500 shadow-md ring-1 ring-slate-500/20"
          : isLivePin
            ? "hover:border-primary/50"
            : "hover:border-slate-400/60"
      } ${compact ? "shadow-xl" : ""}`}
    >
      {onClose && (
        <Button
          variant="ghost"
          size="icon"
          className="absolute top-2 right-2 z-10 h-8 w-8"
          onClick={(e) => {
            e.stopPropagation()
            onClose()
          }}
        >
          <X className="h-4 w-4" />
        </Button>
      )}

      <div className={`flex gap-4 ${compact ? "p-3" : "p-4"}`}>
        {/* Image */}
        <div className={`relative rounded-lg overflow-hidden shrink-0 ${compact ? "h-20 w-20" : "h-24 w-24"}`}>
          <Image
            src={truck.image}
            alt={truck.name}
            fill
            className="object-cover"
          />
          {isLivePin && (
            <div className="absolute top-1 left-1">
              <span className="flex h-3 w-3">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-green-500 opacity-75" />
                <span className="relative inline-flex h-3 w-3 rounded-full bg-green-500" />
              </span>
            </div>
          )}
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2">
            <div>
              <h3 className="font-semibold text-foreground truncate">{truck.name}</h3>
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <div className="flex items-center gap-1">
                  <Star className="h-3.5 w-3.5 fill-accent text-accent" />
                  <span>{truck.rating}</span>
                </div>
                <span>·</span>
                <span>{truck.priceRange}</span>
              </div>
            </div>
          </div>

          {/* Cuisine Tags */}
          <div className="flex flex-wrap gap-1 mt-2">
            {truck.cuisine.slice(0, 2).map((c) => (
              <Badge key={c} variant="secondary" className="text-xs">
                {c}
              </Badge>
            ))}
          </div>

          {locationLine && (
            <div className="mt-2 pt-2 border-t">
              <div className="flex items-start gap-1.5 text-sm">
                <MapPin className="h-3.5 w-3.5 text-primary shrink-0 mt-0.5" />
                <div className="min-w-0">
                  <p className="text-xs font-medium text-muted-foreground">
                    {isLivePin ? "Current location" : "Location"}
                  </p>
                  <p className="text-sm text-foreground break-words leading-snug">{locationLine}</p>
                </div>
              </div>
            </div>
          )}

          {nextStop && isLivePin && (
            <div className="mt-2 pt-2 border-t">
              <div className="flex items-center gap-1 text-sm">
                <MapPin className="h-3.5 w-3.5 text-primary shrink-0" />
                <span className="truncate text-muted-foreground">{nextStop.location}</span>
              </div>
              <div className="flex items-center gap-1 text-xs text-muted-foreground mt-0.5">
                <Clock className="h-3 w-3" />
                <span>{nextStop.startTime} - {nextStop.endTime}</span>
              </div>
            </div>
          )}

          {/* Actions */}
          {compact && (
            <div className="flex gap-2 mt-3 flex-wrap items-center">
              <Button size="sm" className="flex-1" asChild>
                <Link href={`/trucks/${truck.slug}`}>View Details</Link>
              </Button>
              <Button size="sm" variant="outline" className="gap-1">
                <Navigation className="h-3.5 w-3.5" />
                Directions
              </Button>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

function MobileListView({
  filteredLiveTrucks,
  filteredExploreTrucks,
  filteredMapPinEvents,
  filteredUpcomingMapEvents,
  searchQuery,
  setSearchQuery,
  selectedCuisine,
  setSelectedCuisine,
  selectedTruck,
  selectedEvent,
  setSelectedTruck,
  setSelectedEvent,
}: {
  filteredLiveTrucks: FoodTruck[]
  filteredExploreTrucks: FoodTruck[]
  filteredMapPinEvents: MapEventMarker[]
  filteredUpcomingMapEvents: MapEventMarker[]
  searchQuery: string
  setSearchQuery: (v: string) => void
  selectedCuisine: string
  setSelectedCuisine: (v: string) => void
  selectedTruck: FoodTruck | null
  selectedEvent: MapEventMarker | null
  setSelectedTruck: (v: FoodTruck | null) => void
  setSelectedEvent: (v: MapEventMarker | null) => void
}) {
  return (
    <div className="space-y-6">
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          type="text"
          placeholder="Search trucks, cuisines, or events…"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="pl-9"
        />
      </div>

      <div className="flex gap-2 overflow-x-auto pb-2 -mx-4 px-4">
        {cuisineCategories.map((cat) => (
          <Button
            key={cat.id}
            variant={selectedCuisine === cat.id ? "default" : "outline"}
            size="sm"
            onClick={() => setSelectedCuisine(cat.id)}
            className="shrink-0"
          >
            {cat.name}
          </Button>
        ))}
      </div>

      <div className="space-y-2">
        <h3 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Live Now</h3>
        {filteredLiveTrucks.length > 0 ? (
          <div className="space-y-3">
            {filteredLiveTrucks.map((truck) => (
              <button
                key={truck.id}
                type="button"
                className="w-full text-left"
                onClick={() => setSelectedTruck(truck)}
              >
                <TruckCard truck={truck} isSelected={selectedTruck?.id === truck.id} />
              </button>
            ))}
          </div>
        ) : (
          <p className="text-sm text-muted-foreground border border-dashed rounded-lg p-3 bg-muted/30">
            No trucks currently checked in.
          </p>
        )}
      </div>

      {filteredMapPinEvents.length > 0 ? (
        <div className="space-y-2">
          <h3 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Happening Now</h3>
          <div className="space-y-2">
            {filteredMapPinEvents.map((ev) => (
              <button
                key={ev.id}
                type="button"
                className={`w-full text-left rounded-xl border p-3 text-sm ${
                  selectedEvent?.id === ev.id ? "border-amber-600 ring-1 ring-amber-600/30" : "border-border"
                }`}
                onClick={() => setSelectedEvent(ev)}
              >
                <p className="font-semibold text-foreground">{ev.title}</p>
                <p className="text-xs text-muted-foreground mt-1">
                  {formatMapEventDateTime(ev.date, ev.startTime, ev.endTime)}
                </p>
              </button>
            ))}
          </div>
        </div>
      ) : null}

      {filteredExploreTrucks.length > 0 ? (
        <div className="space-y-2">
          <h3 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Explore Trucks</h3>
          <p className="text-[11px] text-muted-foreground">Not on the map until checked in.</p>
          <div className="space-y-3">
            {filteredExploreTrucks.map((truck) => (
              <button
                key={truck.id}
                type="button"
                className="w-full text-left"
                onClick={() => setSelectedTruck(truck)}
              >
                <TruckCard truck={truck} isSelected={selectedTruck?.id === truck.id} />
              </button>
            ))}
          </div>
        </div>
      ) : null}

      {filteredUpcomingMapEvents.length > 0 ? (
        <div className="space-y-2">
          <h3 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Upcoming Events</h3>
          <div className="space-y-2">
            {filteredUpcomingMapEvents.map((ev) => (
              <button
                key={ev.id}
                type="button"
                className={`w-full text-left rounded-xl border p-3 text-sm ${
                  selectedEvent?.id === ev.id ? "border-orange-500 ring-1 ring-orange-500/30" : "border-border"
                }`}
                onClick={() => setSelectedEvent(ev)}
              >
                <p className="font-semibold text-foreground">{ev.title}</p>
                <p className="text-xs text-muted-foreground mt-1">
                  {formatMapEventDateTime(ev.date, ev.startTime, ev.endTime)}
                </p>
              </button>
            ))}
          </div>
          <Link href="/events" className="text-xs text-primary font-medium">
            Full events calendar →
          </Link>
        </div>
      ) : null}
    </div>
  )
}
