import type { SupabaseClient } from "@supabase/supabase-js"
import { isValidTruckMapCoordinates } from "@/lib/location/truck-map-coords"
import { toNumericCoord } from "@/lib/location/numeric-coord"
import { MAP_DISPLAY_TRUCK_SELECT, getPublicMapLiveTruckRows } from "@/lib/map/load-map-display-trucks"
import type { ServingTruckRow } from "@/lib/map/serving-row-to-food-truck"

/**
 * Pins for /map (and homepage preview): prefer live `serving_today` trucks; when none,
 * show directory trucks that already have coordinates (neutral “listed” pins).
 */
export async function getMapPageTruckPinRows(
  supabase: SupabaseClient
): Promise<{ rows: ServingTruckRow[]; usingListedFallback: boolean }> {
  const live = await getPublicMapLiveTruckRows(supabase)
  if (live.length > 0) {
    return { rows: live, usingListedFallback: false }
  }

  const { data, error } = await supabase
    .from("trucks")
    .select(MAP_DISPLAY_TRUCK_SELECT)
    .eq("show_in_directory", true)
    .eq("status", "active")
    .eq("is_active", true)
    .order("name")
    .limit(60)

  if (error) {
    console.error("[map] listed fallback truck query:", error)
    return { rows: [], usingListedFallback: true }
  }

  const listed: ServingTruckRow[] = []
  for (const raw of data ?? []) {
    const t = raw as ServingTruckRow
    const lat = toNumericCoord(t.latitude)
    const lng = toNumericCoord(t.longitude)
    if (lat == null || lng == null) continue
    if (!isValidTruckMapCoordinates(lat, lng)) continue
    listed.push({
      ...t,
      latitude: lat,
      longitude: lng,
      mapDisplaySource: "listed",
    })
  }

  return { rows: listed.slice(0, 40), usingListedFallback: true }
}
