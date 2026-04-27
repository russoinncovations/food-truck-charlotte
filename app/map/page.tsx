import { Suspense } from "react"
import { Metadata } from "next"
import { MapExplorer } from "@/components/map-explorer"
import { Skeleton } from "@/components/ui/skeleton"
import type { SupabaseClient } from "@supabase/supabase-js"
import { createClient } from "@/lib/supabase/server"
import { fetchMapEventMarkers } from "@/lib/events/map-event-markers"
import { getDisplayTrucks, parseTimeToMinutes } from "@/lib/map/get-display-trucks"
import type { ServingTruckRow } from "@/lib/map/serving-row-to-food-truck"

export const metadata: Metadata = {
  title: "Find Food Trucks Near You | FoodTruck CLT",
  description: "Interactive map showing real-time food truck locations across Charlotte, NC. Filter by cuisine, distance, and availability.",
}

const TRUCK_SELECT =
  "id, name, slug, cuisine, latitude, longitude, serving_today, today_location, street_address, today_specials"

function easternNowMinutesAndDow(): { dow: string; nowM: number } {
  const s = new Date().toLocaleString("en-US", { timeZone: "America/New_York" })
  const d = new Date(s)
  return {
    dow: String(d.getDay()),
    nowM: d.getHours() * 60 + d.getMinutes(),
  }
}

async function buildUpcomingFromSchedule(supabase: SupabaseClient): Promise<ServingTruckRow[]> {
  const { dow, nowM } = easternNowMinutesAndDow()
  const windowEnd = nowM + 12 * 60

  const { data: scheduleRows } = await supabase
    .from("truck_schedule")
    .select("truck_id, location_name, latitude, longitude, start_time, end_time, day_of_week")
    .eq("day_of_week", dow)

  type Cand = {
    truck_id: string
    location_name: string | null
    latitude: unknown
    longitude: unknown
    start_time: string | null
    end_time: string | null
    startM: number
    endM: number | null
  }

  const candidates: Cand[] = []

  for (const row of scheduleRows ?? []) {
    const sm = parseTimeToMinutes(row.start_time as string | null)
    if (sm == null) continue
    const em = parseTimeToMinutes(row.end_time as string | null)
    const endEffective = em == null ? sm + 4 * 60 : em
    const inProgress = sm <= nowM && endEffective > nowM
    const upcomingSoon = sm > nowM && sm <= windowEnd
    if (!inProgress && !upcomingSoon) continue
    candidates.push({
      truck_id: row.truck_id as string,
      location_name: row.location_name as string | null,
      latitude: row.latitude,
      longitude: row.longitude,
      start_time: row.start_time as string | null,
      end_time: row.end_time as string | null,
      startM: sm,
      endM: em,
    })
  }

  candidates.sort((a, b) => a.startM - b.startM)
  const seen = new Set<string>()
  const deduped = candidates.filter((c) => {
    if (!c.truck_id || seen.has(c.truck_id)) return false
    seen.add(c.truck_id)
    return true
  })

  if (deduped.length === 0) return []

  const ids = deduped.map((c) => c.truck_id)
  const { data: truckRows } = await supabase.from("trucks").select(TRUCK_SELECT).in("id", ids)
  const byId = new Map((truckRows ?? []).map((t) => [(t as ServingTruckRow).id, t as ServingTruckRow]))

  const out: ServingTruckRow[] = []
  for (const c of deduped) {
    const t = byId.get(c.truck_id)
    if (!t) continue
    const lat = c.latitude != null && c.latitude !== "" ? c.latitude : t.latitude
    const lng = c.longitude != null && c.longitude !== "" ? c.longitude : t.longitude
    out.push({
      ...t,
      serving_today: false,
      latitude: lat as number | string,
      longitude: lng as number | string,
      today_location: c.location_name ?? t.today_location,
      mapDisplaySource: "upcoming",
      scheduledStartTime: c.start_time,
      scheduledEndTime: c.end_time,
    })
  }
  return out
}

export default async function MapPage() {
  const supabase = await createClient()

  const { data: liveData } = await supabase.from("trucks").select(TRUCK_SELECT).eq("serving_today", true)
  const liveTrucks = (liveData ?? []) as ServingTruckRow[]

  const upcomingTrucks = liveTrucks.length === 0 ? await buildUpcomingFromSchedule(supabase) : []

  const { data: listedData } = await supabase
    .from("trucks")
    .select(TRUCK_SELECT)
    .eq("show_in_directory", true)
    .order("name")

  const listedPool = (listedData ?? []) as ServingTruckRow[]

  const displayTrucks = getDisplayTrucks(liveTrucks, upcomingTrucks, listedPool)

  const { count: truckTableCount } = await supabase.from("trucks").select("id", { count: "exact", head: true })
  const hasAnyTrucksInDb = (truckTableCount ?? 0) > 0

  const listedFallbackActive =
    liveTrucks.length === 0 && upcomingTrucks.length === 0 && displayTrucks.length > 0

  let mapEvents: Awaited<ReturnType<typeof fetchMapEventMarkers>> = []
  try {
    mapEvents = await fetchMapEventMarkers(supabase)
  } catch (error) {
    console.error("[map] fetchMapEventMarkers failed", error)
  }

  return (
    <Suspense fallback={<MapSkeleton />}>
      <MapExplorer
        trucks={displayTrucks}
        mapEvents={mapEvents}
        listedFallbackActive={listedFallbackActive}
        hasAnyTrucksInDb={hasAnyTrucksInDb}
      />
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
