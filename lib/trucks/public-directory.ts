import type { SupabaseClient } from "@supabase/supabase-js"

/**
 * Trucks eligible for public directory totals / stats:
 * show_in_directory + active listing flags (aligned with vendor approvals).
 */
export async function countPublicDirectoryTrucks(supabase: SupabaseClient): Promise<number> {
  const { count, error } = await supabase
    .from("trucks")
    .select("id", { count: "exact", head: true })
    .eq("show_in_directory", true)
    .eq("status", "active")
    .eq("is_active", true)

  if (error) {
    console.error("[countPublicDirectoryTrucks]", error)
    return 0
  }
  return count ?? 0
}
