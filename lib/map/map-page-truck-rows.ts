import type { SupabaseClient } from "@supabase/supabase-js"
import { getPublicMapLiveTruckRows } from "@/lib/map/load-map-display-trucks"
import type { ServingTruckRow } from "@/lib/map/serving-row-to-food-truck"

/**
 * Public map truck pins: live `serving_today` check-ins only (no directory fallback pins).
 */
export async function getMapPageTruckPinRows(supabase: SupabaseClient): Promise<ServingTruckRow[]> {
  return getPublicMapLiveTruckRows(supabase)
}
