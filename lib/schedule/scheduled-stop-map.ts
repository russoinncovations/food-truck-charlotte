import type { SupabaseClient } from "@supabase/supabase-js"
import { MAP_DISPLAY_TRUCK_SELECT } from "@/lib/map/load-map-display-trucks"
import type { ServingTruckRow } from "@/lib/map/serving-row-to-food-truck"
import { PUBLIC_LISTED_TRUCK_EQ } from "@/lib/trucks/public-listed-truck-query"
import {
  addDaysToDateString,
  easternDateStringFromDate,
  type TruckScheduledStopRow,
} from "@/lib/schedule/scheduled-stops"

const STOP_SELECT =
  "id, truck_id, stop_date, start_time, end_time, location_name, address, latitude, longitude, is_public, notes, menu_note, status"

/**
 * Public scheduled stops through end of week (Eastern) for map pin merge.
 * Manual Go Live rows are merged separately and override schedule per truck.
 */
export async function loadPublicScheduledStopPinRows(
  supabase: SupabaseClient
): Promise<ServingTruckRow[]> {
  const today = easternDateStringFromDate()
  const weekEnd = addDaysToDateString(today, 6)

  const { data: stops, error } = await supabase
    .from("truck_scheduled_stops")
    .select(STOP_SELECT)
    .eq("status", "scheduled")
    .eq("is_public", true)
    .gte("stop_date", today)
    .lte("stop_date", weekEnd)
    .order("stop_date", { ascending: true })
    .order("start_time", { ascending: true })

  if (error) {
    console.error("[scheduled-stops] loadPublicScheduledStopPinRows:", error.message)
    return []
  }

  const rows = (stops ?? []) as TruckScheduledStopRow[]
  if (rows.length === 0) return []

  const truckIds = [...new Set(rows.map((s) => s.truck_id))]
  const { data: truckRows, error: truckErr } = await supabase
    .from("trucks")
    .select(MAP_DISPLAY_TRUCK_SELECT)
    .in("id", truckIds)
    .eq("show_in_directory", PUBLIC_LISTED_TRUCK_EQ.show_in_directory)
    .eq("is_active", PUBLIC_LISTED_TRUCK_EQ.is_active)
    .eq("status", PUBLIC_LISTED_TRUCK_EQ.status)

  if (truckErr) {
    console.error("[scheduled-stops] trucks join:", truckErr.message)
    return []
  }

  const byTruckId = new Map((truckRows ?? []).map((t) => [(t as ServingTruckRow).id, t as ServingTruckRow]))

  const out: ServingTruckRow[] = []
  const seenTruckDate = new Set<string>()

  for (const stop of rows) {
    const truck = byTruckId.get(stop.truck_id)
    if (!truck) continue

    const dedupeKey = `${stop.truck_id}:${stop.stop_date}:${String(stop.start_time).slice(0, 5)}`
    if (seenTruckDate.has(dedupeKey)) continue
    seenTruckDate.add(dedupeKey)

    const lat = stop.latitude ?? truck.latitude
    const lng = stop.longitude ?? truck.longitude

    out.push({
      ...truck,
      serving_today: false,
      latitude: lat,
      longitude: lng,
      today_location: stop.location_name,
      street_address: stop.is_public ? stop.address ?? truck.street_address : null,
      mapDisplaySource: "scheduled",
      scheduledStartTime: stop.start_time,
      scheduledEndTime: stop.end_time,
      scheduledStopId: stop.id,
      scheduledStopDate: stop.stop_date,
      scheduledMenuNote: stop.menu_note,
      scheduledIsPublic: stop.is_public,
    })
  }

  return out
}

/** Manual Go Live wins over scheduled pin for the same truck. */
export function mergeLiveAndScheduledMapPins(
  liveRows: ServingTruckRow[],
  scheduledRows: ServingTruckRow[]
): ServingTruckRow[] {
  const liveTruckIds = new Set(liveRows.map((r) => r.id))
  const scheduledOnly = scheduledRows.filter((r) => !liveTruckIds.has(r.id))
  return [...liveRows, ...scheduledOnly]
}

export async function fetchUpcomingPublicStopsForTruck(
  supabase: SupabaseClient,
  truckId: string,
  limit = 8
): Promise<TruckScheduledStopRow[]> {
  const today = easternDateStringFromDate()

  const { data, error } = await supabase
    .from("truck_scheduled_stops")
    .select(STOP_SELECT)
    .eq("truck_id", truckId)
    .eq("status", "scheduled")
    .eq("is_public", true)
    .gte("stop_date", today)
    .order("stop_date", { ascending: true })
    .order("start_time", { ascending: true })
    .limit(limit)

  if (error) {
    console.error("[scheduled-stops] fetchUpcomingPublicStopsForTruck:", error.message)
    return []
  }

  return (data ?? []) as TruckScheduledStopRow[]
}

export async function fetchAllUpcomingStopsForAdmin(
  supabase: SupabaseClient,
  daysAhead = 14
): Promise<(TruckScheduledStopRow & { truck_name: string | null; truck_slug: string | null })[]> {
  const today = easternDateStringFromDate()
  const end = addDaysToDateString(today, daysAhead)

  const { data, error } = await supabase
    .from("truck_scheduled_stops")
    .select(STOP_SELECT)
    .gte("stop_date", today)
    .lte("stop_date", end)
    .order("stop_date", { ascending: true })
    .order("start_time", { ascending: true })

  if (error) {
    console.error("[scheduled-stops] admin fetch:", error.message)
    return []
  }

  const stops = (data ?? []) as TruckScheduledStopRow[]
  if (stops.length === 0) return []

  const truckIds = [...new Set(stops.map((s) => s.truck_id))]
  const { data: trucks } = await supabase.from("trucks").select("id, name, slug").in("id", truckIds)
  const byId = new Map((trucks ?? []).map((t) => [String(t.id), t as { name: string | null; slug: string | null }]))

  return stops.map((stop) => {
    const truck = byId.get(stop.truck_id)
    return {
      ...stop,
      truck_name: truck?.name ?? null,
      truck_slug: truck?.slug ?? null,
    }
  })
}
