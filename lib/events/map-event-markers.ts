import type { SupabaseClient } from "@supabase/supabase-js"
import { easternDateStringToday, publicUpcomingEventsBase } from "@/lib/events/public-events"
import { isValidTruckMapCoordinates } from "@/lib/location/truck-map-coords"
import { toNumericCoord } from "@/lib/location/numeric-coord"

/** Event pin timing relative to “now” in America/New_York (not vendor live check-in). */
export type EventMapPinPhase = "upcoming" | "in_progress"

/** Public event on the map: `upcoming_event` vs in-window `live` (not vendor check-in). */
export type MapEventPinStatus = "upcoming_event" | "live"

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
  pinPhase: EventMapPinPhase
  mapPinStatus: MapEventPinStatus
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

function parseTimeToDayMinutes(t: string | null): number | null {
  if (!t || !String(t).trim()) return null
  const part = String(t).trim().slice(0, 8)
  const hhmm = part.length >= 5 ? part.slice(0, 5) : part
  const [hs, ms] = hhmm.split(":")
  const h = parseInt(hs ?? "", 10)
  const m = parseInt(ms ?? "", 10)
  if (!Number.isFinite(h) || !Number.isFinite(m)) return null
  return h * 60 + m
}

/** Eastern “now” wall-clock minutes since midnight + calendar date YYYY-MM-DD. */
function easternNowParts(now: Date): { dateStr: string; minutes: number } {
  const dateStr = now.toLocaleDateString("en-CA", { timeZone: "America/New_York" })
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone: "America/New_York",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).formatToParts(now)
  const hour = parseInt(parts.find((p) => p.type === "hour")?.value ?? "0", 10)
  const minute = parseInt(parts.find((p) => p.type === "minute")?.value ?? "0", 10)
  return { dateStr, minutes: hour * 60 + minute }
}

/**
 * Upcoming = future calendar day, or same day before start time.
 * In progress = same day within [start, end] (end optional → through end of day).
 * Returns null if the event day/time has clearly ended (same-day past end) — omit from map.
 */
export function getEventMapPinPhase(
  dateStr: string,
  startTime: string | null,
  endTime: string | null,
  now: Date = new Date()
): EventMapPinPhase | null {
  const today = easternDateStringToday()
  const { minutes: nowMin } = easternNowParts(now)

  if (dateStr > today) return "upcoming"
  if (dateStr < today) return null

  const startMin = parseTimeToDayMinutes(startTime)
  const endMin = parseTimeToDayMinutes(endTime)

  if (startMin == null) {
    if (endMin != null && nowMin > endMin) return null
    return "in_progress"
  }

  if (nowMin < startMin) return "upcoming"
  if (endMin != null && nowMin > endMin) return null
  return "in_progress"
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

  const rows = (data ?? []) as unknown as EventMapRow[]
  const out: MapEventMarker[] = []

  for (const row of rows) {
    const lat0 = toNumericCoord(row.latitude)
    const lng0 = toNumericCoord(row.longitude)
    if (lat0 == null || lng0 == null) continue
    if (!isValidTruckMapCoordinates(lat0, lng0)) continue

    const locationLabel = [row.location_name, row.address].filter(Boolean).join(" · ") || "Charlotte area"
    const pinPhase = getEventMapPinPhase(row.date, row.start_time, row.end_time)
    if (pinPhase == null) continue
    const mapPinStatus: MapEventPinStatus = pinPhase === "upcoming" ? "upcoming_event" : "live"

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
      pinPhase,
      mapPinStatus,
    })
  }

  return out
}
