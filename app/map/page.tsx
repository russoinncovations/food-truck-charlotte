import { Suspense } from "react"
import { Metadata } from "next"
import { MapExplorer } from "@/components/map-explorer"
import { Skeleton } from "@/components/ui/skeleton"

export const metadata: Metadata = {
  title: "Find Food Trucks Near You | FoodTruck CLT",
  description: "Interactive map showing real-time food truck locations across Charlotte, NC. Filter by cuisine, distance, and availability.",
}

export default function MapPage() {
  return (
    <Suspense fallback={<MapSkeleton />}>
      <MapExplorer />
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
