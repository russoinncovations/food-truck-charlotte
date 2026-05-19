import type { SupabaseClient } from "@supabase/supabase-js"
import { PUBLIC_LISTED_TRUCK_EQ } from "@/lib/trucks/public-listed-truck-query"

/**
 * Trucks eligible for public directory totals / stats:
 * show_in_directory + active listing flags (aligned with vendor approvals).
 */
export async function countPublicDirectoryTrucks(supabase: SupabaseClient): Promise<number> {
  const { count, error } = await supabase
    .from("trucks")
    .select("id", { count: "exact", head: true })
    .eq("show_in_directory", PUBLIC_LISTED_TRUCK_EQ.show_in_directory)
    .eq("status", PUBLIC_LISTED_TRUCK_EQ.status)
    .eq("is_active", PUBLIC_LISTED_TRUCK_EQ.is_active)

  if (error) {
    console.error("[countPublicDirectoryTrucks]", error)
    return 0
  }
  return count ?? 0
}
