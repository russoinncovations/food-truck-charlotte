import type { SupabaseClient } from "@supabase/supabase-js"
import { getDisplayTrucks, parseTimeToMinutes } from "@/lib/map/get-display-trucks"
import type { ServingTruckRow } from "@/lib/map/serving-row-to-food-truck"

/** Columns needed for map display rows (live / schedule / directory). */
export const MAP_DISPLAY_TRUCK_SELECT =
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
  const { data: truckRows } = await supabase.from("trucks").select(MAP_DISPLAY_TRUCK_SELECT).in("id", ids)
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
      scheduledStartTime: c.start_time,
      scheduledEndTime: c.end_time,
    })
  }
  return out
}

/** Raw layers before `getDisplayTrucks` merge (same queries as /map). */
export async function getMapTruckDisplayLayers(supabase: SupabaseClient): Promise<{
  liveTrucks: ServingTruckRow[]
  upcomingTrucks: ServingTruckRow[]
  listedDirectoryTrucks: ServingTruckRow[]
}> {
  const { data: liveData } = await supabase
    .from("trucks")
    .select(MAP_DISPLAY_TRUCK_SELECT)
    .eq("serving_today", true)
  const liveTrucks = (liveData ?? []) as ServingTruckRow[]

  const upcomingTrucks = liveTrucks.length === 0 ? await buildUpcomingFromSchedule(supabase) : []

  const { data: listedData } = await supabase
    .from("trucks")
    .select(MAP_DISPLAY_TRUCK_SELECT)
    .eq("show_in_directory", true)
    .order("name")

  const listedDirectoryTrucks = (listedData ?? []) as ServingTruckRow[]

  return { liveTrucks, upcomingTrucks, listedDirectoryTrucks }
}

/** Public map (/ and /map): live trucks only — directory and scheduled rows stay off the map. */
export async function getPublicMapLiveTruckRows(supabase: SupabaseClient): Promise<ServingTruckRow[]> {
  const { data: liveData } = await supabase
    .from("trucks")
    .select(MAP_DISPLAY_TRUCK_SELECT)
    .eq("serving_today", true)
  return ((liveData ?? []) as ServingTruckRow[]).map((t) => ({
    ...t,
    mapDisplaySource: "live" as const,
  }))
}

/**
 * Same truck display priority as /map: live → upcoming (12h window) → directory listings.
 */
export async function loadMapDisplayTruckRows(supabase: SupabaseClient): Promise<ServingTruckRow[]> {
  const { liveTrucks, upcomingTrucks, listedDirectoryTrucks } = await getMapTruckDisplayLayers(supabase)
  return getDisplayTrucks(liveTrucks, upcomingTrucks, listedDirectoryTrucks)
}
