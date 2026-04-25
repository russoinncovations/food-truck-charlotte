import type { SupabaseClient } from "@supabase/supabase-js"

/** Calendar date in America/New_York as YYYY-MM-DD — matches public `events.date` (Postgres `date`). */
export function easternDateStringToday(): string {
  return new Date().toLocaleDateString("en-CA", { timeZone: "America/New_York" })
}

/**
 * (listing_status is null OR listing_status = 'approved')
 * Excludes draft, pending, rejected when those labels are set.
 */
export function publicUpcomingEventsOrFilter(): string {
  return "listing_status.is.null,listing_status.eq.approved"
}

/**
 * Start from `supabase.from("events")` then `.select(...)` for rows or count.
 * Public rules: published (`active`), not before today (Eastern), approved listing status only.
 */
export function publicUpcomingEventsBase(supabase: SupabaseClient) {
  return supabase
    .from("events")
    .eq("active", true)
    .gte("date", easternDateStringToday())
    .or(publicUpcomingEventsOrFilter())
}

export async function countUpcomingPublicEvents(supabase: SupabaseClient): Promise<number> {
  const { count, error } = await publicUpcomingEventsBase(supabase).select("*", { count: "exact", head: true })
  if (error) {
    return 0
  }
  return count ?? 0
}
