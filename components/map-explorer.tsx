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

function truckWord(count: number): "truck" | "trucks" {
  return count === 1 ? "truck" : "trucks"
}

function formatStartsAtLabel(startTime: string): string {
  const [h, m] = startTime.split(":").map(Number)
  if (!Number.isFinite(h) || !Number.isFinite(m)) return startTime
  const target = new Date()
  target.setHours(h, m, 0, 0)
  const diffMin = Math.round((target.getTime() - Date.now()) / 60_000)
  if (diffMin >= 0 && diffMin <= 90) return "Starting soon"
  return `Today at ${target.toLocaleTimeString("en-US", { timeStyle: "short" })}`
}

function formatClockAmPm(startTime: string): string {
  const [h, m] = startTime.split(":").map(Number)
  if (!Number.isFinite(h) || !Number.isFinite(m)) return startTime
  const d = new Date()
  d.setHours(h, m, 0, 0)
  return d.toLocaleTimeString("en-US", { timeStyle: "short" })
}

export function MapExplorer({
  trucks,
  mapEvents,
  listedFallbackActive = false,
  hasAnyTrucksInDb = true,
}: {
  trucks: ServingTruckRow[]
  mapEvents: MapEventMarker[]
  listedFallbackActive?: boolean
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

  const mapTrucks = useMemo(() => mapRowsToMapTrucks(trucks), [trucks])

  const liveCount = useMemo(
    () => mapTrucks.filter((t) => t.mapDisplaySource === "live").length,
    [mapTrucks]
  )
  const anyLiveReporting = liveCount > 0

  const filteredTrucks = useMemo(() => {
    const q = searchQuery.toLowerCase()
    return mapTrucks.filter((truck) => {
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
  }, [mapTrucks, searchQuery, selectedCuisine, showOpenOnly])

  const filteredMapEvents = useMemo(() => {
    if (!searchQuery.trim()) return mapEvents
    const q = searchQuery.toLowerCase()
    return mapEvents.filter((e) => e.title.toLowerCase().includes(q))
  }, [mapEvents, searchQuery])

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
              {liveCount} {liveCount === 1 ? "truck" : "trucks"} live
            </Badge>
          ) : listedFallbackActive ? (
            <Badge variant="secondary" className="max-w-[16rem] text-left font-normal leading-snug text-muted-foreground">
              No live trucks — showing listed trucks
            </Badge>
          ) : mapTrucks.length > 0 ? (
            <Badge variant="secondary" className="max-w-[14rem] text-left font-normal leading-snug text-muted-foreground">
              No trucks live — showing upcoming
            </Badge>
          ) : (
            <Badge variant="secondary" className="max-w-[14rem] text-left font-normal leading-snug text-muted-foreground">
              {mapEvents.length > 0 ? "No trucks on the map — see events" : "No trucks on the map"}
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

      <p className="shrink-0 border-b border-border/80 bg-muted/30 px-4 py-2 text-center text-xs text-muted-foreground">
        {anyLiveReporting
          ? "Live locations are updated by food truck vendors."
          : listedFallbackActive
            ? "No trucks are live right now — showing listed trucks across Charlotte."
            : "No trucks currently reporting live — showing upcoming locations from vendor schedules."}
        {mapEvents.length > 0 ? " Upcoming public events appear as orange pins on the map." : ""}
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
            filteredTrucks={filteredTrucks}
            filteredMapEvents={filteredMapEvents}
            mapEventsCount={mapEvents.length}
            liveCount={liveCount}
            anyLiveReporting={anyLiveReporting}
            selectedTruck={selectedTruck}
            selectedEvent={selectedEvent}
            setSelectedTruck={setSelectedTruckAndClearEvent}
            setSelectedEvent={setSelectedEventAndClearTruck}
            listedFallbackActive={listedFallbackActive}
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
              filteredTrucks={filteredTrucks}
              filteredMapEvents={filteredMapEvents}
              mapEventsCount={mapEvents.length}
              liveCount={liveCount}
              anyLiveReporting={anyLiveReporting}
              selectedTruck={selectedTruck}
              selectedEvent={selectedEvent}
              setSelectedTruck={setSelectedTruckAndClearEvent}
              setSelectedEvent={setSelectedEventAndClearTruck}
              listedFallbackActive={listedFallbackActive}
              hasAnyTrucksInDb={hasAnyTrucksInDb}
            />
          </SheetContent>
        </Sheet>

        {/* Map or List View */}
        <main className="flex-1 relative">
          {viewMode === "map" || isLg ? (
            <MapView
              trucks={filteredTrucks}
              mapEvents={filteredMapEvents}
              selectedTruck={selectedTruck}
              selectedEvent={selectedEvent}
              onSelectTruck={setSelectedTruckAndClearEvent}
              onSelectEvent={setSelectedEventAndClearTruck}
            />
          ) : (
            <div className="lg:hidden h-full overflow-auto p-4">
              <MobileListView
                trucks={filteredTrucks}
                searchQuery={searchQuery}
                setSearchQuery={setSearchQuery}
                selectedCuisine={selectedCuisine}
                setSelectedCuisine={setSelectedCuisine}
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

function SidebarContent({
  searchQuery,
  setSearchQuery,
  selectedCuisine,
  setSelectedCuisine,
  showOpenOnly,
  setShowOpenOnly,
  filteredTrucks,
  filteredMapEvents,
  mapEventsCount,
  liveCount,
  anyLiveReporting,
  selectedTruck,
  selectedEvent,
  setSelectedTruck,
  setSelectedEvent,
  listedFallbackActive,
  hasAnyTrucksInDb,
}: {
  searchQuery: string
  setSearchQuery: (v: string) => void
  selectedCuisine: string
  setSelectedCuisine: (v: string) => void
  showOpenOnly: boolean
  setShowOpenOnly: (v: boolean) => void
  filteredTrucks: FoodTruck[]
  filteredMapEvents: MapEventMarker[]
  mapEventsCount: number
  liveCount: number
  anyLiveReporting: boolean
  selectedTruck: FoodTruck | null
  selectedEvent: MapEventMarker | null
  setSelectedTruck: (v: FoodTruck | null) => void
  setSelectedEvent: (v: MapEventMarker | null) => void
  listedFallbackActive: boolean
  hasAnyTrucksInDb: boolean
}) {
  const noTrucksOnMapNow = liveCount === 0 && mapEventsCount > 0

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
            title={anyLiveReporting ? undefined : "No trucks reporting live right now"}
            onClick={() => anyLiveReporting && setShowOpenOnly(!showOpenOnly)}
            className="whitespace-nowrap"
          >
            Open Now
          </Button>
        </div>
      </div>

      {noTrucksOnMapNow && (
        <div className="px-4 py-3 border-b bg-orange-500/10 text-sm text-foreground">
          <p className="text-muted-foreground">
            {listedFallbackActive
              ? "Listed trucks use muted pins. "
              : "No trucks currently reporting live — showing upcoming locations. "}
            Also on the map:{" "}
            <span className="font-medium text-foreground">{mapEventsCount}</span> public event
            {mapEventsCount === 1 ? "" : "s"} (orange pins).{" "}
            <Link href="/events" className="text-primary underline font-medium">
              Browse all events
            </Link>
          </p>
        </div>
      )}

      {/* Results Count */}
      <div className="px-4 py-3 border-b bg-muted/50 space-y-1">
        {!anyLiveReporting && listedFallbackActive ? (
          <p className="text-sm text-muted-foreground">
            No live trucks — showing{" "}
            <span className="font-medium text-foreground">{filteredTrucks.length}</span> listed{" "}
            {truckWord(filteredTrucks.length)}
            {mapEventsCount > 0 ? (
              <>
                {" "}
                ·{" "}
                <span className="font-medium text-foreground">{filteredMapEvents.length}</span> event
                {filteredMapEvents.length === 1 ? "" : "s"} on the map
              </>
            ) : null}
          </p>
        ) : !anyLiveReporting ? (
          <p className="text-sm text-muted-foreground">
            No trucks currently reporting live — showing upcoming locations
            {filteredTrucks.length > 0 ? (
              <>
                {" "}
                ·{" "}
                <span className="font-medium text-foreground">{filteredTrucks.length}</span> scheduled on the list
              </>
            ) : null}
            {mapEventsCount > 0 ? (
              <>
                {" "}
                ·{" "}
                <span className="font-medium text-foreground">{filteredMapEvents.length}</span> event
                {filteredMapEvents.length === 1 ? "" : "s"} on the map
              </>
            ) : null}
          </p>
        ) : (
          <p className="text-sm text-muted-foreground">
            <span className="font-medium text-foreground">{filteredTrucks.length}</span>{" "}
            {truckWord(filteredTrucks.length)} on the list
            {mapEventsCount > 0 ? (
              <>
                {" "}
                ·{" "}
                <span className="font-medium text-foreground">{filteredMapEvents.length}</span> upcoming event
                {filteredMapEvents.length === 1 ? "" : "s"} on the map
              </>
            ) : null}
          </p>
        )}
      </div>

      <ScrollArea className="flex-1">
        <div className="p-4 space-y-6">
          {filteredMapEvents.length > 0 ? (
            <div className="space-y-2">
              <h3 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                Upcoming on the map
              </h3>
              <div className="space-y-2">
                {filteredMapEvents.map((ev) => (
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
                        <span
                          className="mt-1.5 h-2.5 w-2.5 shrink-0 rounded-full bg-orange-500"
                          aria-hidden
                        />
                        <div className="min-w-0 flex-1">
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
                <p className="text-xs text-muted-foreground pl-1">
                  Tap a pin or card to focus the map. Full listings on the{" "}
                  <Link href="/events" className="text-primary underline">
                    events page
                  </Link>
                  .
                </p>
              </div>
            </div>
          ) : null}

          <div className="space-y-2">
            <h3 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              {listedFallbackActive ? "Listed trucks — schedule not posted yet" : "Food trucks"}
            </h3>
            <div className="space-y-3">
              {filteredTrucks.map((truck) => (
                <div key={truck.id} className="space-y-1">
                  <button
                    type="button"
                    className="w-full text-left rounded-xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                    onClick={() => setSelectedTruck(truck)}
                  >
                    <TruckCard truck={truck} isSelected={selectedTruck?.id === truck.id} />
                  </button>
                  {truck.mapDisplaySource !== "listed" && (
                    <Link
                      href={`/trucks/${truck.slug}`}
                      className="text-xs text-primary pl-1 hover:underline"
                      onClick={(e) => e.stopPropagation()}
                    >
                      View truck profile
                    </Link>
                  )}
                </div>
              ))}
            </div>
          </div>

          {filteredTrucks.length === 0 && filteredMapEvents.length === 0 && (
            <div className="text-center py-8">
              <Truck className="h-10 w-10 mx-auto text-muted-foreground/50 mb-3" />
              {!hasAnyTrucksInDb ? (
                <p className="text-muted-foreground text-sm">Trucks are being added now — check back soon.</p>
              ) : (
                <>
                  <p className="text-muted-foreground text-sm">
                    No trucks currently reporting live — showing upcoming locations
                  </p>
                  <p className="text-sm text-muted-foreground mt-2">
                    Nothing matched your search. Try different keywords or clear filters.
                  </p>
                </>
              )}
            </div>
          )}
        </div>
      </ScrollArea>
    </>
  )
}

function EventMapCard({ event, onClose }: { event: MapEventMarker; onClose: () => void }) {
  const href =
    event.slug && String(event.slug).trim() !== "" ? `/events/${encodeURIComponent(String(event.slug).trim())}` : "/events"
  return (
    <div className="relative bg-card rounded-xl border border-orange-500/40 shadow-xl p-4">
      <Button variant="ghost" size="icon" className="absolute top-2 right-2 h-8 w-8" onClick={onClose}>
        <X className="h-4 w-4" />
      </Button>
      <div className="pr-8">
        <div className="flex items-center gap-2 mb-1">
          <span className="h-2.5 w-2.5 rounded-full bg-orange-500 shrink-0" />
          <h3 className="font-semibold text-foreground">{event.title}</h3>
        </div>
        <p className="text-xs text-muted-foreground flex items-center gap-1 mb-2">
          <Calendar className="h-3.5 w-3.5 shrink-0" />
          {formatMapEventDateTime(event.date, event.startTime, event.endTime)}
        </p>
        <p className="text-sm text-muted-foreground mb-3 flex items-start gap-1.5">
          <MapPin className="h-3.5 w-3.5 shrink-0 mt-0.5" />
          <span>{event.locationLabel}</span>
        </p>
        <Button size="sm" className="w-full" asChild>
          <Link href={href}>{event.slug ? "View event details" : "Browse events"}</Link>
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
  const locationLine =
    truck.location?.address && truck.location.address.trim() !== ""
      ? truck.location.address
      : truck.directoryLocationHint && truck.directoryLocationHint.trim() !== ""
        ? truck.directoryLocationHint
        : null

  return (
    <div
      className={`relative bg-card rounded-xl border transition-all ${
        isSelected ? "border-primary shadow-lg" : "hover:border-primary/50"
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
          {truck.isOpen && (
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

          {truck.mapDisplaySource === "upcoming" && truck.schedule[0] && (
            <Badge variant="outline" className="mt-2 text-[10px] font-normal border-amber-500/40 text-amber-900 dark:text-amber-200">
              {formatStartsAtLabel(truck.schedule[0].startTime)}
            </Badge>
          )}

          {locationLine && (
            <div className="mt-2 pt-2 border-t">
              <div className="flex items-start gap-1.5 text-sm">
                <MapPin className="h-3.5 w-3.5 text-primary shrink-0 mt-0.5" />
                <div className="min-w-0">
                  <p className="text-xs font-medium text-muted-foreground">
                    {truck.mapDisplaySource === "upcoming"
                      ? "Scheduled location"
                      : truck.mapDisplaySource === "listed"
                        ? "Saved location"
                        : "Current location"}
                  </p>
                  <p className="text-sm text-foreground break-words leading-snug">{locationLine}</p>
                </div>
              </div>
            </div>
          )}

          {truck.mapDisplaySource === "upcoming" && truck.schedule[0] && (
            <div className="flex items-center gap-1 text-xs text-muted-foreground mt-2">
              <Clock className="h-3 w-3 shrink-0" />
              <span>Starts at {formatClockAmPm(truck.schedule[0].startTime)}</span>
            </div>
          )}

          {truck.mapDisplaySource === "listed" && (
            <p className="text-xs text-muted-foreground mt-2">Schedule not posted yet</p>
          )}

          {truck.mapDisplaySource === "listed" && !compact && (
            <div className="flex flex-wrap items-center gap-2 mt-3 pt-2 border-t">
              <Button size="sm" className="shrink-0" asChild>
                <Link href={`/trucks/${truck.slug}`}>View profile</Link>
              </Button>
            </div>
          )}

          {/* Next Location (skip for map upcoming rows — schedule block above covers it) */}
          {nextStop && truck.mapDisplaySource !== "upcoming" && (
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
              {truck.mapDisplaySource === "listed" ? (
                <Button size="sm" className="flex-1 min-w-[8rem]" asChild>
                  <Link href={`/trucks/${truck.slug}`}>View profile</Link>
                </Button>
              ) : (
                <>
                  <Button size="sm" className="flex-1" asChild>
                    <Link href={`/trucks/${truck.slug}`}>View Details</Link>
                  </Button>
                  <Button size="sm" variant="outline" className="gap-1">
                    <Navigation className="h-3.5 w-3.5" />
                    Directions
                  </Button>
                </>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

function MobileListView({
  trucks,
  searchQuery,
  setSearchQuery,
  selectedCuisine,
  setSelectedCuisine,
}: {
  trucks: FoodTruck[]
  searchQuery: string
  setSearchQuery: (v: string) => void
  selectedCuisine: string
  setSelectedCuisine: (v: string) => void
}) {
  return (
    <div className="space-y-4">
      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          type="text"
          placeholder="Search trucks..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="pl-9"
        />
      </div>

      {/* Cuisine Filter */}
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

      {/* Results */}
      <div className="space-y-3">
        {trucks.map((truck) => (
          <Link key={truck.id} href={`/trucks/${truck.slug}`}>
            <TruckCard truck={truck} />
          </Link>
        ))}
      </div>
    </div>
  )
}
