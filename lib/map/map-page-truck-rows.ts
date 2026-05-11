import type { SupabaseClient } from "@supabase/supabase-js"
import { MAP_DISPLAY_TRUCK_SELECT, getPublicMapLiveTruckRows } from "@/lib/map/load-map-display-trucks"
import type { ServingTruckRow } from "@/lib/map/serving-row-to-food-truck"

/**
 * Public map truck pins: live `serving_today` check-ins only (no directory fallback pins).
 */
export async function getMapPageTruckPinRows(supabase: SupabaseClient): Promise<ServingTruckRow[]> {
  return getPublicMapLiveTruckRows(supabase)
}

/**
 * Sidebar “Explore trucks”: public directory listings not currently checked in as serving.
 * Does not appear as map pins.
 */
export async function getMapSidebarExploreTruckRows(supabase: SupabaseClient): Promise<ServingTruckRow[]> {
  const { data, error } = await supabase
    .from("trucks")
    .select(MAP_DISPLAY_TRUCK_SELECT)
    .eq("show_in_directory", true)
    .eq("status", "active")
    .eq("is_active", true)
    .order("name")
    .limit(120)

  if (error) {
    console.error("[map] getMapSidebarExploreTruckRows:", error)
    return []
  }

  return ((data ?? []) as ServingTruckRow[])
    .filter((t) => !t.serving_today)
    .map((t) => ({
      ...t,
      mapDisplaySource: "listed" as const,
      serving_today: false,
    }))
}
