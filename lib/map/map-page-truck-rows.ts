import type { SupabaseClient } from "@supabase/supabase-js"
import { MAP_DISPLAY_TRUCK_SELECT, getPublicMapLiveTruckRows } from "@/lib/map/load-map-display-trucks"
import {
  loadPublicScheduledStopPinRows,
  mergeLiveAndScheduledMapPins,
} from "@/lib/schedule/scheduled-stop-map"
import { PUBLIC_LISTED_TRUCK_EQ } from "@/lib/trucks/public-listed-truck-query"
import type { ServingTruckRow } from "@/lib/map/serving-row-to-food-truck"

/**
 * Public map truck pins: manual Go Live + scheduled stops (Go Live overrides schedule per truck).
 */
export async function getMapPageTruckPinRows(supabase: SupabaseClient): Promise<ServingTruckRow[]> {
  const [liveRows, scheduledRows] = await Promise.all([
    getPublicMapLiveTruckRows(supabase),
    loadPublicScheduledStopPinRows(supabase),
  ])
  return mergeLiveAndScheduledMapPins(liveRows, scheduledRows)
}

/**
 * Sidebar: all public active directory trucks, sorted open/check-in first, then by name.
 * Used for the map sidebar only (pins remain live-only from {@link getMapPageTruckPinRows}).
 */
export async function getMapSidebarAllListedTruckRows(supabase: SupabaseClient): Promise<ServingTruckRow[]> {
  const { data, error } = await supabase
    .from("trucks")
    .select(MAP_DISPLAY_TRUCK_SELECT)
    .eq("show_in_directory", PUBLIC_LISTED_TRUCK_EQ.show_in_directory)
    .eq("status", PUBLIC_LISTED_TRUCK_EQ.status)
    .eq("is_active", PUBLIC_LISTED_TRUCK_EQ.is_active)

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
