import type { SupabaseClient } from "@supabase/supabase-js"
import { publicUpcomingEventsBase } from "@/lib/events/public-events"
import { isValidTruckMapCoordinates } from "@/lib/location/truck-map-coords"
import { toNumericCoord } from "@/lib/location/numeric-coord"

export type MapEventMarker = {
  id: string
  title: string
  slug: string | null
  date: string
  startTime: string | null
  endTime: string | null
  lat: number
  lng: number
  locationLabel: string
}

type EventMapRow = {
  id: string
  title: string
  slug: string | null
  date: string
  start_time: string | null
  end_time: string | null
  location_name: string | null
  address: string | null
  latitude: string | number | null
  longitude: string | number | null
  is_public: boolean | null
}

export function formatMapEventDateTime(
  dateStr: string,
  start: string | null,
  end: string | null
): string {
  const [y, m, d] = dateStr.split("-").map(Number)
  if (!y || !m || !d) return dateStr
  const day = new Date(y, m - 1, d)
  if (Number.isNaN(day.getTime())) return dateStr
  const dayPart = day.toLocaleDateString("en-US", {
    weekday: "short",
    month: "short",
    day: "numeric",
    year: "numeric",
  })
  const fmtT = (t: string) => t.slice(0, 5)
  if (start && end) return `${dayPart} · ${fmtT(start)} – ${fmtT(end)}`
  if (start) return `${dayPart} · ${fmtT(start)}`
  return dayPart
}

/**
 * Public map: approved/upcoming public events that already have **stored** `latitude` / `longitude`
 * (geocoded at submit or by admin). No Nominatim on read — keeps homepage / /map fast.
 */
export async function fetchMapEventMarkers(supabase: SupabaseClient): Promise<MapEventMarker[]> {
  const { data, error } = await publicUpcomingEventsBase(
    supabase,
    "id, title, slug, date, start_time, end_time, location_name, address, latitude, longitude, is_public"
  )
    .eq("is_public", true)
    .order("date", { ascending: true })
    .limit(40)

  if (error) {
    console.error("[map] fetchMapEventMarkers:", error)
    return []
  }

  const rows = (data ?? []) as EventMapRow[]
  const out: MapEventMarker[] = []

  for (const row of rows) {
    const lat0 = toNumericCoord(row.latitude)
    const lng0 = toNumericCoord(row.longitude)
    if (lat0 == null || lng0 == null) continue
    if (!isValidTruckMapCoordinates(lat0, lng0)) continue

    const locationLabel = [row.location_name, row.address].filter(Boolean).join(" · ") || "Charlotte area"
    out.push({
      id: row.id,
      title: row.title,
      slug: row.slug,
      date: row.date,
      startTime: row.start_time,
      endTime: row.end_time,
      lat: lat0,
      lng: lng0,
      locationLabel,
    })
  }

  return out
}
