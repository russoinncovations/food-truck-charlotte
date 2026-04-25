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

type HeadCount = { count: "exact"; head: true }

/**
 * Supabase requires `.from().select()` before filters like `.eq()`.
 * Public rules: `active = true`, `date` not before today (Eastern), approved listing (or legacy null).
 *
 * @param countMode - pass `{ count: "exact", head: true }` for head-only counts (no row payload).
 */
export function publicUpcomingEventsBase(
  supabase: SupabaseClient,
  selectColumns: string,
  countMode?: HeadCount
) {
  const q = supabase.from("events")
  const withSelect = countMode
    ? q.select(selectColumns, { count: "exact", head: true })
    : q.select(selectColumns)
  return withSelect
    .eq("active", true)
    .gte("date", easternDateStringToday())
    .or(publicUpcomingEventsOrFilter())
}

export async function countUpcomingPublicEvents(supabase: SupabaseClient): Promise<number> {
  const { count, error } = await publicUpcomingEventsBase(supabase, "*", { count: "exact", head: true })
  if (error) {
    return 0
  }
  return count ?? 0
}
