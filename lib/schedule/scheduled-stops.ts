import { parseTimeToMinutes } from "@/lib/map/get-display-trucks"

export type ScheduledStopStatus = "scheduled" | "canceled" | "completed"

export type TruckScheduledStopRow = {
  id: string
  truck_id: string
  stop_date: string
  start_time: string
  end_time: string
  location_name: string
  address: string | null
  latitude: number | null
  longitude: number | null
  is_public: boolean
  notes: string | null
  menu_note: string | null
  status: ScheduledStopStatus
  created_at?: string | null
  updated_at?: string | null
}

export type MapTimeFilter = "now" | "today" | "tomorrow" | "week"

const EASTERN_TZ = "America/New_York"

export function easternDateStringFromDate(d: Date = new Date()): string {
  return d.toLocaleDateString("en-CA", { timeZone: EASTERN_TZ })
}

export function addDaysToDateString(dateStr: string, days: number): string {
  const [y, m, day] = dateStr.split("-").map(Number)
  const utc = new Date(Date.UTC(y, m - 1, day + days))
  return utc.toISOString().slice(0, 10)
}

export function easternNowMinutes(): number {
  const s = new Date().toLocaleString("en-US", { timeZone: EASTERN_TZ })
  const d = new Date(s)
  return d.getHours() * 60 + d.getMinutes()
}

export function isStopActiveNow(
  stopDate: string,
  startTime: string | null | undefined,
  endTime: string | null | undefined,
  nowDate = easternDateStringFromDate(),
  nowMinutes = easternNowMinutes()
): boolean {
  if (stopDate !== nowDate) return false
  const startM = parseTimeToMinutes(startTime)
  if (startM == null) return false
  const endM = parseTimeToMinutes(endTime)
  const endEffective = endM == null ? startM + 4 * 60 : endM <= startM ? endM + 24 * 60 : endM
  return startM <= nowMinutes && endEffective > nowMinutes
}

export function mapTimeFilterRange(filter: MapTimeFilter, today = easternDateStringFromDate()): {
  from: string
  to: string
} {
  switch (filter) {
    case "now":
    case "today":
      return { from: today, to: today }
    case "tomorrow":
      return { from: addDaysToDateString(today, 1), to: addDaysToDateString(today, 1) }
    case "week":
      return { from: today, to: addDaysToDateString(today, 6) }
  }
}

export function stopMatchesMapTimeFilter(
  stopDate: string,
  startTime: string | null | undefined,
  endTime: string | null | undefined,
  filter: MapTimeFilter,
  today = easternDateStringFromDate()
): boolean {
  const { from, to } = mapTimeFilterRange(filter, today)
  if (stopDate < from || stopDate > to) return false
  if (filter === "now") {
    return isStopActiveNow(stopDate, startTime, endTime, today)
  }
  return true
}

export function formatStopTime(t: string | null | undefined): string {
  if (!t) return "—"
  return String(t).slice(0, 5)
}

export function formatStopDate(dateStr: string): string {
  const [y, m, d] = dateStr.split("-").map(Number)
  const dt = new Date(y, m - 1, d)
  return dt.toLocaleDateString("en-US", {
    weekday: "short",
    month: "short",
    day: "numeric",
    timeZone: EASTERN_TZ,
  })
}
