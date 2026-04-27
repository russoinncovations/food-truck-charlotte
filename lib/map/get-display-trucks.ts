import type { ServingTruckRow } from "@/lib/map/serving-row-to-food-truck"

export function parseTimeToMinutes(t: string | null | undefined): number | null {
  if (t == null || String(t).trim() === "") return null
  const parts = String(t).split(":")
  const h = Number(parts[0])
  const m = Number(parts[1])
  if (!Number.isFinite(h) || !Number.isFinite(m)) return null
  return h * 60 + m
}

/**
 * Priority: live → upcoming (schedule window) → listed directory trucks (no schedule today).
 */
export function getDisplayTrucks(
  liveTrucks: ServingTruckRow[],
  upcomingTrucks: ServingTruckRow[],
  listedDirectoryTrucks: ServingTruckRow[] = [],
): ServingTruckRow[] {
  if (liveTrucks.length > 0) {
    return liveTrucks.map((t) => ({
      ...t,
      mapDisplaySource: "live" as const,
    }))
  }
  if (upcomingTrucks.length > 0) {
    return [...upcomingTrucks]
      .map((t) => ({
        ...t,
        mapDisplaySource: "upcoming" as const,
      }))
      .sort((a, b) => {
        const as = parseTimeToMinutes(a.scheduledStartTime) ?? 99_999
        const bs = parseTimeToMinutes(b.scheduledStartTime) ?? 99_999
        return as - bs
      })
  }
  return listedDirectoryTrucks.map((t) => ({
    ...t,
    serving_today: false,
    mapDisplaySource: "listed" as const,
  }))
}
