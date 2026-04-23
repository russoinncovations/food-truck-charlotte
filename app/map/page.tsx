import { Suspense } from "react"
import { Metadata } from "next"
import { MapExplorer, type ServingTruckRow } from "@/components/map-explorer"
import { Skeleton } from "@/components/ui/skeleton"
import { createClient } from "@/lib/supabase/server"

export const metadata: Metadata = {
  title: "Find Food Trucks Near You | FoodTruck CLT",
  description: "Interactive map showing real-time food truck locations across Charlotte, NC. Filter by cuisine, distance, and availability.",
}

export default async function MapPage() {
  const supabase = await createClient()

  const todayDow = new Date().getDay().toString()
  const todayTime = `${String(new Date().getHours()).padStart(2, "0")}:${String(new Date().getMinutes()).padStart(2, "0")}`

  const { data: trucks } = await supabase
    .from("trucks")
    .select("id, name, slug, cuisine, latitude, longitude, serving_today, today_location, today_specials")
    .eq("serving_today", true)

  const { data: scheduledTrucks } = await supabase
    .from("truck_schedule")
    .select("truck_id, location_name, latitude, longitude, start_time, end_time")
    .eq("day_of_week", todayDow)

  const servingList = (trucks ?? []) as ServingTruckRow[]
  const servingIds = new Set(servingList.map((t) => t.id))

  const scheduleRows = scheduledTrucks ?? []
  const scheduleByTruckId = new Map<
    string,
    { location_name: string | null; latitude: unknown; longitude: unknown }
  >()
  for (const row of scheduleRows) {
    const tid = row.truck_id as string
    if (!tid || servingIds.has(tid) || scheduleByTruckId.has(tid)) continue
    scheduleByTruckId.set(tid, {
      location_name: row.location_name,
      latitude: row.latitude,
      longitude: row.longitude,
    })
  }

  const extraIds = [...scheduleByTruckId.keys()]
  let merged: ServingTruckRow[] = [...servingList]

  if (extraIds.length > 0) {
    const { data: extraTrucks } = await supabase
      .from("trucks")
      .select("id, name, slug, cuisine, latitude, longitude, serving_today, today_location, today_specials")
      .in("id", extraIds)

    for (const t of (extraTrucks ?? []) as ServingTruckRow[]) {
      const sch = scheduleByTruckId.get(t.id)
      if (!sch) continue
      merged.push({
        ...t,
        latitude: sch.latitude != null ? (sch.latitude as number | string) : t.latitude,
        longitude: sch.longitude != null ? (sch.longitude as number | string) : t.longitude,
        today_location: sch.location_name ?? t.today_location,
      })
    }
  }

  return (
    <Suspense fallback={<MapSkeleton />}>
      <MapExplorer trucks={merged} />
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
