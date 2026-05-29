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
import { stopMatchesMapTimeFilter, type MapTimeFilter } from "@/lib/schedule/scheduled-stops"
import { MapAddToHomePrompt } from "@/components/pwa/map-add-to-home-prompt"

export type { ServingTruckRow }

const MAP_TIME_FILTERS: { id: MapTimeFilter; label: string }[] = [
  { id: "now", label: "Now" },
  { id: "today", label: "Today" },
  { id: "tomorrow", label: "Tomorrow" },
  { id: "week", label: "This Week" },
]

function truckProfileId(truck: FoodTruck): string {
  const i = truck.id.indexOf("__")
  return i === -1 ? truck.id : truck.id.slice(0, i)
}

function truckMatchesMapTimeFilter(truck: FoodTruck, filter: MapTimeFilter): boolean {
  if (truck.mapDisplaySource === "live") {
    return filter === "now" || filter === "today"
  }
  if (truck.mapDisplaySource !== "scheduled") return false
  const date = truck.scheduledStopDate ?? truck.schedule[0]?.date
  const start = truck.scheduledStartTime ?? truck.schedule[0]?.startTime
  const end = truck.scheduledEndTime ?? truck.schedule[0]?.endTime
  if (!date) return false
  return stopMatchesMapTimeFilter(date, start, end, filter)
}

function truckIsOnMapPin(truck: FoodTruck): boolean {
  return truck.mapPinStatus === "live" || truck.mapPinStatus === "scheduled"
}
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

function truckIsLiveOnMap(t: FoodTruck): boolean {
  return truckIsOnMapPin(t)
}

// Dynamically import map to avoid SSR issues
function truckMatchesSidebarFilters(
  truck: FoodTruck,
  q: string,
  selectedCuisine: string,
): { matchesSearch: boolean; matchesCuisine: boolean } {
  const haystack = [
    truck.name,
    ...truck.cuisine,
    truck.directoryLocationHint ?? "",
    truck.location?.address ?? "",
  ]
    .join(" ")
    .toLowerCase()
  const matchesSearch = q === "" || haystack.includes(q)
  const matchesCuisine =
    selectedCuisine === "all" ||
    truck.cuisine.some((c) => c.toLowerCase() === selectedCuisine.toLowerCase())
  return { matchesSearch, matchesCuisine }
}

export function MapExplorer({
  liveTruckRows,
  allListedTruckRows,
  mapPinEvents,
  hasAnyTrucksInDb = true,
}: {
  liveTruckRows: ServingTruckRow[]
  allListedTruckRows: ServingTruckRow[]
  mapPinEvents: MapEventMarker[]
  hasAnyTrucksInDb?: boolean
}) {
  const isLg = useMinWidthLg()
  const [searchQuery, setSearchQuery] = useState("")
  const [selectedCuisine, setSelectedCuisine] = useState("all")
  const [mapTimeFilter, setMapTimeFilter] = useState<MapTimeFilter>("now")
  const [showOpenOnly, setShowOpenOnly] = useState(false)
  const [selectedTruck, setSelectedTruck] = useState<FoodTruck | null>(null)
  const [selectedEvent, setSelectedEvent] = useState<MapEventMarker | null>(null)
  const [viewMode, setViewMode] = useState<"map" | "list">("map")
  const [isSidebarOpen, setIsSidebarOpen] = useState(true)

  const liveMapTrucks = useMemo(() => mapRowsToMapTrucks(liveTruckRows), [liveTruckRows])
  const allListedMapTrucks = useMemo(() => mapRowsToMapTrucks(allListedTruckRows), [allListedTruckRows])

  const timeFilteredMapTrucks = useMemo(
    () => liveMapTrucks.filter((t) => truckMatchesMapTimeFilter(t, mapTimeFilter)),
    [liveMapTrucks, mapTimeFilter]
  )

  const liveCount = useMemo(
    () => timeFilteredMapTrucks.filter((t) => t.mapPinStatus === "live").length,
    [timeFilteredMapTrucks]
  )
  const scheduledCount = useMemo(
    () => timeFilteredMapTrucks.filter((t) => t.mapPinStatus === "scheduled").length,
    [timeFilteredMapTrucks]
  )
  const anyLiveReporting = liveCount > 0 || scheduledCount > 0

  const filteredLiveTrucks = useMemo(() => {
    const q = searchQuery.toLowerCase()
    return timeFilteredMapTrucks.filter((truck) => {
      const { matchesSearch, matchesCuisine } = truckMatchesSidebarFilters(truck, q, selectedCuisine)
      const matchesOpen = !showOpenOnly || truck.mapPinStatus === "live"
      return matchesSearch && matchesCuisine && matchesOpen
    })
  }, [timeFilteredMapTrucks, searchQuery, selectedCuisine, showOpenOnly])

  const openNowTruckIdSet = useMemo(
    () => new Set(filteredLiveTrucks.map((t) => truckProfileId(t))),
    [filteredLiveTrucks]
  )

  const filteredAllListedTrucks = useMemo(() => {
    const q = searchQuery.toLowerCase()
    return allListedMapTrucks.filter((truck) => {
      const { matchesSearch, matchesCuisine } = truckMatchesSidebarFilters(truck, q, selectedCuisine)
      const matchesOpen = !showOpenOnly || openNowTruckIdSet.has(truckProfileId(truck))
      return matchesSearch && matchesCuisine && matchesOpen
    })
  }, [allListedMapTrucks, searchQuery, selectedCuisine, showOpenOnly, openNowTruckIdSet])

  /** Directory rows not in the Open now list (Open now is the source of truth). */
  const listedOnlySidebarTrucks = useMemo(
    () => filteredAllListedTrucks.filter((t) => !openNowTruckIdSet.has(truckProfileId(t))),
    [filteredAllListedTrucks, openNowTruckIdSet]
  )

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
              {liveCount > 0 ? `${liveCount} live` : null}
              {liveCount > 0 && scheduledCount > 0 ? " · " : null}
              {scheduledCount > 0 ? `${scheduledCount} scheduled` : null}
            </Badge>
          ) : (
            <Badge variant="secondary" className="max-w-[18rem] text-left font-normal leading-snug text-muted-foreground">
              No trucks open now
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

      <MapAddToHomePrompt />

      <p className="shrink-0 border-b border-border/80 bg-muted/30 px-4 py-2 text-center text-xs text-muted-foreground leading-snug">
        Green pins = live check-in (overrides schedule). Blue pins = scheduled stops. Orange = events now.
      </p>

      <div className="flex min-h-0 flex-1 overflow-hidden">
        {/* Sidebar - Desktop */}
        <aside
          className={`hidden lg:flex h-full min-h-0 flex-col w-96 shrink-0 border-r bg-background transition-all ${
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
            mapTimeFilter={mapTimeFilter}
            setMapTimeFilter={setMapTimeFilter}
            filteredLiveTrucks={filteredLiveTrucks}
            listedOnlySidebarTrucks={listedOnlySidebarTrucks}
            filteredMapPinEvents={filteredMapPinEvents}
            listedInSidebarCount={filteredAllListedTrucks.length}
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
              mapTimeFilter={mapTimeFilter}
            setMapTimeFilter={setMapTimeFilter}
            filteredLiveTrucks={filteredLiveTrucks}
              listedOnlySidebarTrucks={listedOnlySidebarTrucks}
              filteredMapPinEvents={filteredMapPinEvents}
              listedInSidebarCount={filteredAllListedTrucks.length}
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
        <main className="min-h-0 flex-1 relative">
          {viewMode === "map" || isLg ? (
            <MapView
              trucks={filteredLiveTrucks}
              mapEvents={filteredMapPinEvents}
              selectedTruck={selectedTruck}
              selectedEvent={selectedEvent}
              onSelectTruck={setSelectedTruckAndClearEvent}
              onSelectEvent={setSelectedEventAndClearTruck}
              filtersInactive={
                searchQuery.trim() === "" && selectedCuisine === "all" && !showOpenOnly && mapTimeFilter === "now"
              }
            />
          ) : (
            <div className="lg:hidden h-full overflow-auto p-4">
              <MobileListView
                filteredLiveTrucks={filteredLiveTrucks}
                listedOnlySidebarTrucks={listedOnlySidebarTrucks}
                filteredMapPinEvents={filteredMapPinEvents}
                showOpenOnly={showOpenOnly}
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
          {selectedTruck && truckIsLiveOnMap(selectedTruck) && viewMode === "map" && (
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
          <span>Open now · truck photo or pin</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="h-2.5 w-2.5 rounded-full bg-blue-600 shrink-0" />
          <span>Scheduled stop</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="h-2.5 w-2.5 rounded-full bg-orange-500 shrink-0" />
          <span>Happening Now</span>
        </div>
      </div>
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
  mapTimeFilter,
  setMapTimeFilter,
  filteredLiveTrucks,
  listedOnlySidebarTrucks,
  filteredMapPinEvents,
  listedInSidebarCount,
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
  mapTimeFilter: MapTimeFilter
  setMapTimeFilter: (v: MapTimeFilter) => void
  filteredLiveTrucks: FoodTruck[]
  listedOnlySidebarTrucks: FoodTruck[]
  filteredMapPinEvents: MapEventMarker[]
  listedInSidebarCount: number
  anyLiveReporting: boolean
  selectedTruck: FoodTruck | null
  selectedEvent: MapEventMarker | null
  setSelectedTruck: (v: FoodTruck | null) => void
  setSelectedEvent: (v: MapEventMarker | null) => void
  hasAnyTrucksInDb: boolean
}) {
  const filtersActive =
    searchQuery.trim() !== "" || selectedCuisine !== "all" || showOpenOnly || mapTimeFilter !== "now"
  const listTotallyEmpty =
    filteredLiveTrucks.length === 0 &&
    filteredMapPinEvents.length === 0 &&
    listedOnlySidebarTrucks.length === 0

  return (
    <div className="flex h-full min-h-0 flex-col">
      {/* Search & Filters */}
      <div className="shrink-0 p-4 border-b space-y-4">
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

        <div className="flex flex-wrap gap-2">
          {MAP_TIME_FILTERS.map(({ id, label }) => (
            <Button
              key={id}
              type="button"
              size="sm"
              variant={mapTimeFilter === id ? "default" : "outline"}
              className="h-8 text-xs"
              onClick={() => setMapTimeFilter(id)}
            >
              {label}
            </Button>
          ))}
        </div>

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
            title={anyLiveReporting ? undefined : "No trucks open right now"}
            onClick={() => anyLiveReporting && setShowOpenOnly(!showOpenOnly)}
            className="whitespace-nowrap"
          >
            Open only
          </Button>
        </div>
      </div>

      {/* Results Count */}
      <div className="shrink-0 px-4 py-3 border-b bg-muted/50 space-y-1">
        <p className="text-sm text-muted-foreground">
          <span className="font-medium text-foreground">{filteredLiveTrucks.length}</span> truck
          {filteredLiveTrucks.length === 1 ? "" : "s"} on the map for{" "}
          <span className="font-medium text-foreground">
            {MAP_TIME_FILTERS.find((f) => f.id === mapTimeFilter)?.label ?? mapTimeFilter}
          </span>
          {filteredMapPinEvents.length > 0 ? (
            <>
              {" "}
              ·{" "}
              <span className="font-medium text-foreground">{filteredMapPinEvents.length}</span> event
              {filteredMapPinEvents.length === 1 ? "" : "s"} happening now
            </>
          ) : null}
          .
        </p>
        <p className="text-xs text-muted-foreground leading-snug">
          <span className="font-medium text-foreground">{listedInSidebarCount}</span> listed truck
          {listedInSidebarCount === 1 ? "" : "s"} in this sidebar (includes directory vendors).
        </p>
        {!anyLiveReporting ? (
          <p className="text-xs text-muted-foreground leading-snug">
            Green pins appear when vendors mark themselves serving. Upcoming events stay on the{" "}
            <Link href="/events" className="text-primary underline">
              events page
            </Link>
            .
          </p>
        ) : null}
      </div>

      <ScrollArea className="min-h-0 flex-1 overflow-hidden">
        <div className="p-4 space-y-6">
          {/* 1 — Open now (live pins) */}
          <div className="space-y-2">
            <h3 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Open now</h3>
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
                      View profile
                    </Link>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground rounded-lg border border-dashed border-border/80 bg-muted/30 px-3 py-3">
                No trucks serving right now.
              </p>
            )}
          </div>

          {/* 2 — Happening Now */}
          {filteredMapPinEvents.length > 0 ? (
            <div className="space-y-2">
              <h3 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Happening Now</h3>
              <p className="text-[11px] text-muted-foreground leading-snug">
                Matches orange map pins (public events in progress).
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

          {/* 3 — All listed trucks (directory; no map pin until live) */}
          {!showOpenOnly && listedOnlySidebarTrucks.length > 0 ? (
            <div className="space-y-2">
              <h3 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">All listed trucks</h3>
              <p className="text-[11px] text-muted-foreground leading-snug">
                Explore trucks — no green pin until they check in as serving.
              </p>
              <div className="space-y-3">
                {listedOnlySidebarTrucks.map((truck) => (
                  <div key={truck.id} className="space-y-2">
                    <TruckCard truck={truck} isSelected={false} />
                    <Button asChild className="w-full" size="sm" variant="default">
                      <Link href={`/trucks/${truck.slug}`}>View profile</Link>
                    </Button>
                  </div>
                ))}
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
    </div>
  )
}

function EventMapCard({ event, onClose }: { event: MapEventMarker; onClose: () => void }) {
  const href =
    event.slug && String(event.slug).trim() !== "" ? `/events/${encodeURIComponent(String(event.slug).trim())}` : "/events"
  return (
    <div className="relative bg-card rounded-xl shadow-xl p-4 border border-amber-600/45">
      <Button variant="ghost" size="icon" className="absolute top-2 right-2 h-8 w-8" onClick={onClose}>
        <X className="h-4 w-4" />
      </Button>
      <div className="pr-8">
        <div className="flex items-center gap-2 mb-1">
          <span className="h-2.5 w-2.5 rounded-full shrink-0 bg-amber-600" />
          <h3 className="font-semibold text-foreground">{event.title}</h3>
        </div>
        <p className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wide">Happening now</p>
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
              <p className="text-[11px] font-medium mt-0.5">
                {isLivePin ? (
                  <span className="text-green-700 dark:text-green-400">Open now</span>
                ) : (
                  <span className="text-muted-foreground">Listed vendor · Not currently checked in</span>
                )}
              </p>
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
                <Link href={`/trucks/${truck.slug}`}>View profile</Link>
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
  listedOnlySidebarTrucks,
  filteredMapPinEvents,
  showOpenOnly,
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
  listedOnlySidebarTrucks: FoodTruck[]
  filteredMapPinEvents: MapEventMarker[]
  showOpenOnly: boolean
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
        <h3 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Open now</h3>
        {filteredLiveTrucks.length > 0 ? (
          <div className="space-y-3">
            {filteredLiveTrucks.map((truck) => (
              <div key={truck.id} className="space-y-2">
                <button
                  type="button"
                  className="w-full text-left"
                  onClick={() => setSelectedTruck(truck)}
                >
                  <TruckCard truck={truck} isSelected={selectedTruck?.id === truck.id} />
                </button>
                <Button asChild className="w-full" size="sm" variant="outline">
                  <Link href={`/trucks/${truck.slug}`}>View profile</Link>
                </Button>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-sm text-muted-foreground border border-dashed rounded-lg p-3 bg-muted/30">
            No trucks serving right now.
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

      {!showOpenOnly && listedOnlySidebarTrucks.length > 0 ? (
        <div className="space-y-2">
          <h3 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">All listed trucks</h3>
          <p className="text-[11px] text-muted-foreground">No green pin until they check in as serving.</p>
          <div className="space-y-3">
            {listedOnlySidebarTrucks.map((truck) => (
              <div key={truck.id} className="space-y-2">
                <TruckCard truck={truck} isSelected={false} />
                <Button asChild className="w-full" size="sm" variant="default">
                  <Link href={`/trucks/${truck.slug}`}>View profile</Link>
                </Button>
              </div>
            ))}
          </div>
        </div>
      ) : null}

      <Link href="/events" className="block text-xs text-primary font-medium">
        Events calendar →
      </Link>
    </div>
  )
}
