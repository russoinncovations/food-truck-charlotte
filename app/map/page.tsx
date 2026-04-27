import { Suspense } from "react"
import { Metadata } from "next"
import { MapExplorer } from "@/components/map-explorer"
import { Skeleton } from "@/components/ui/skeleton"
import { createClient } from "@/lib/supabase/server"
import { fetchMapEventMarkers } from "@/lib/events/map-event-markers"
import { getPublicMapLiveTruckRows } from "@/lib/map/load-map-display-trucks"

export const metadata: Metadata = {
  title: "Find Food Trucks Near You | FoodTruck CLT",
  description: "Interactive map showing real-time food truck locations across Charlotte, NC. Filter by cuisine, distance, and availability.",
}

export default async function MapPage() {
  const supabase = await createClient()

  const displayTrucks = await getPublicMapLiveTruckRows(supabase)

  const { count: truckTableCount } = await supabase.from("trucks").select("id", { count: "exact", head: true })
  const hasAnyTrucksInDb = (truckTableCount ?? 0) > 0

  let mapEvents: Awaited<ReturnType<typeof fetchMapEventMarkers>> = []
  try {
    mapEvents = await fetchMapEventMarkers(supabase)
  } catch (error) {
    console.error("[map] fetchMapEventMarkers failed", error)
  }

  return (
    <Suspense fallback={<MapSkeleton />}>
      <MapExplorer trucks={displayTrucks} mapEvents={mapEvents} hasAnyTrucksInDb={hasAnyTrucksInDb} />
    </Suspense>
  )
}

function MapSkeleton() {
  return (
    <div className="h-screen flex">
      <div className="w-96 border-r p-4 space-y-4 hidden lg:block">
        <Skeleton className="h-10 w-full" />
        <Skeleton className="h-8 w-3/4" />
        <div className="space-y-3 pt-4">
          {[...Array(5)].map((_, i) => (
            <Skeleton key={i} className="h-24 w-full" />
          ))}
        </div>
      </div>
      <div className="flex-1 bg-muted" />
    </div>
  )
}
