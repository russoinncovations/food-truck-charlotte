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
 * Sidebar: all public active directory trucks, sorted open/check-in first, then by name.
 * Used for the map sidebar only (pins remain live-only from {@link getMapPageTruckPinRows}).
 */
export async function getMapSidebarAllListedTruckRows(supabase: SupabaseClient): Promise<ServingTruckRow[]> {
  const { data, error } = await supabase
    .from("trucks")
    .select(MAP_DISPLAY_TRUCK_SELECT)
    .eq("show_in_directory", true)
    .eq("status", "active")
    .eq("is_active", true)

  if (error) {
    console.error("[map] getMapSidebarAllListedTruckRows:", error)
    return []
  }

  return ((data ?? []) as ServingTruckRow[])
    .map((t) => ({
      ...t,
      // Strict boolean — avoid accidental "live" from truthy non-booleans in row data.
      mapDisplaySource: (t.serving_today === true ? "live" : "listed") as "live" | "listed",
    }))
    .sort((a, b) => {
      const sa = a.serving_today ? 0 : 1
      const sb = b.serving_today ? 0 : 1
      if (sa !== sb) return sa - sb
      return (a.name ?? "").localeCompare(b.name ?? "", undefined, { sensitivity: "base" })
    })
}
