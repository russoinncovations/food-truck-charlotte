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
} from "lucide-react"
import { cuisineCategories, type FoodTruck } from "@/lib/data"

export type ServingTruckRow = {
  id: string
  name: string
  slug: string | null
  cuisine: string | string[] | null
  latitude: number | string | null
  longitude: number | string | null
  serving_today: boolean | null
  today_location: string | null
  today_specials: string | null
}

function mapRowsToMapTrucks(rows: ServingTruckRow[]): FoodTruck[] {
  return rows.map((truck) => {
    const lat = Number(truck.latitude)
    const lng = Number(truck.longitude)
    const cuisine = Array.isArray(truck.cuisine)
      ? truck.cuisine
      : truck.cuisine
        ? [truck.cuisine]
        : []
    const fallbackSlug = truck.name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/(^-|-$)/g, "") || truck.id
    const slug =
      truck.slug && String(truck.slug).trim() !== "" ? String(truck.slug).trim() : fallbackSlug

    return {
      id: truck.id,
      name: truck.name,
      slug,
      cuisine,
      description: "",
      image: "/images/truck-tacos.jpg",
      rating: 0,
      reviewCount: 0,
      priceRange: "$",
      isOpen: Boolean(truck.serving_today),
      isFeatured: false,
      location:
        Number.isFinite(lat) && Number.isFinite(lng)
          ? {
              lat,
              lng,
              address: truck.today_location ?? "",
            }
          : undefined,
      schedule: [],
      menu: [],
      socialLinks: {},
    }
  })
}

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

export function MapExplorer({ trucks }: { trucks: ServingTruckRow[] }) {
  const [searchQuery, setSearchQuery] = useState("")
  const [selectedCuisine, setSelectedCuisine] = useState("all")
  const [showOpenOnly, setShowOpenOnly] = useState(false)
  const [selectedTruck, setSelectedTruck] = useState<FoodTruck | null>(null)
  const [viewMode, setViewMode] = useState<"map" | "list">("map")
  const [isSidebarOpen, setIsSidebarOpen] = useState(true)

  const mapTrucks = useMemo(() => mapRowsToMapTrucks(trucks), [trucks])

  const filteredTrucks = useMemo(() => {
    return mapTrucks.filter((truck) => {
      const matchesSearch =
        searchQuery === "" ||
        truck.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        truck.cuisine.some((c) =>
          c.toLowerCase().includes(searchQuery.toLowerCase())
        )
      const matchesCuisine =
        selectedCuisine === "all" ||
        truck.cuisine.some(
          (c) => c.toLowerCase() === selectedCuisine.toLowerCase()
        )
      const matchesOpen = !showOpenOnly || truck.isOpen
      return matchesSearch && matchesCuisine && matchesOpen
    })
  }, [mapTrucks, searchQuery, selectedCuisine, showOpenOnly])

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
          <Badge variant="secondary" className="gap-1">
            <span className="relative flex h-2 w-2">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-green-500 opacity-75" />
              <span className="relative inline-flex h-2 w-2 rounded-full bg-green-500" />
            </span>
            {mapTrucks.filter((t) => t.isOpen).length} trucks open
          </Badge>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setIsSidebarOpen(!isSidebarOpen)}
          >
            {isSidebarOpen ? "Hide List" : "Show List"}
          </Button>
        </div>
      </header>

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
            selectedTruck={selectedTruck}
            setSelectedTruck={setSelectedTruck}
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
              selectedTruck={selectedTruck}
              setSelectedTruck={setSelectedTruck}
            />
          </SheetContent>
        </Sheet>

        {/* Map or List View */}
        <main className="flex-1 relative">
          {viewMode === "map" || isLg ? (
            <MapView
              trucks={filteredTrucks}
              selectedTruck={selectedTruck}
              onSelectTruck={setSelectedTruck}
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
                onClose={() => setSelectedTruck(null)}
                compact
              />
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
  selectedTruck,
  setSelectedTruck,
}: {
  searchQuery: string
  setSearchQuery: (v: string) => void
  selectedCuisine: string
  setSelectedCuisine: (v: string) => void
  showOpenOnly: boolean
  setShowOpenOnly: (v: boolean) => void
  filteredTrucks: FoodTruck[]
  selectedTruck: FoodTruck | null
  setSelectedTruck: (v: FoodTruck | null) => void
}) {
  return (
    <>
      {/* Search & Filters */}
      <div className="p-4 border-b space-y-4">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            type="text"
            placeholder="Search trucks or cuisines..."
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
            onClick={() => setShowOpenOnly(!showOpenOnly)}
            className="whitespace-nowrap"
          >
            Open Now
          </Button>
        </div>
      </div>

      {/* Results Count */}
      <div className="px-4 py-3 border-b bg-muted/50">
        <p className="text-sm text-muted-foreground">
          <span className="font-medium text-foreground">{filteredTrucks.length}</span> trucks found
        </p>
      </div>

      {/* Truck List */}
      <ScrollArea className="flex-1">
        <div className="p-4 space-y-3">
          {filteredTrucks.map((truck) => (
            <Link
              key={truck.id}
              href={`/trucks/${truck.slug}`}
              className="block cursor-pointer rounded-xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
            >
              <TruckCard
                truck={truck}
                isSelected={selectedTruck?.id === truck.id}
              />
            </Link>
          ))}
          {filteredTrucks.length === 0 && (
            <div className="text-center py-12">
              <Truck className="h-12 w-12 mx-auto text-muted-foreground/50 mb-4" />
              <p className="text-muted-foreground">No trucks found</p>
              <p className="text-sm text-muted-foreground">Try adjusting your filters</p>
            </div>
          )}
        </div>
      </ScrollArea>
    </>
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

          {locationLine && (
            <div className="mt-2 pt-2 border-t">
              <div className="flex items-start gap-1.5 text-sm">
                <MapPin className="h-3.5 w-3.5 text-primary shrink-0 mt-0.5" />
                <div className="min-w-0">
                  <p className="text-xs font-medium text-muted-foreground">Current location</p>
                  <p className="text-sm text-foreground break-words leading-snug">{locationLine}</p>
                </div>
              </div>
            </div>
          )}

          {/* Next Location */}
          {nextStop && (
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
            <div className="flex gap-2 mt-3">
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
