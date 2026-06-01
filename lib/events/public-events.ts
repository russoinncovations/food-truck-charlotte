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

/**
 * Public event detail — same rules as `/events` list:
 * `active = true`, `date` not before today (Eastern), slug match,
 * and `listing_status` is null or `approved`.
 */
export async function fetchPublicEventBySlug<T extends string = "*">(
  supabase: SupabaseClient,
  slug: string,
  selectColumns: T = "*" as T
): Promise<Record<string, unknown> | null> {
  const trimmed = slug.trim()
  if (!trimmed) return null

  const { data, error } = await publicUpcomingEventsBase(supabase, selectColumns)
    .eq("slug", trimmed)
    .maybeSingle()

  if (error) {
    console.error("[public-events] fetchPublicEventBySlug:", error)
    return null
  }

  return (data as Record<string, unknown> | null) ?? null
}

/** Row shape for vendor dashboard “public events” (same filters as `/events`). */
export type VendorDashboardPublicEventRow = {
  id: string
  title: string
  slug: string | null
  location_name: string | null
  address: string | null
  date: string
  description: string | null
  start_time: string | null
  end_time: string | null
}

const VENDOR_DASHBOARD_PUBLIC_EVENT_COLUMNS =
  "id, title, slug, location_name, address, date, description, start_time, end_time"

/**
 * Upcoming public events for vendor dashboards — mirrors `/events` filtering (active, date, listing_status).
 */
export async function fetchPublicUpcomingEventsForVendorDashboard(
  supabase: SupabaseClient,
  options?: { limit?: number }
): Promise<VendorDashboardPublicEventRow[]> {
  const limit = options?.limit ?? 30
  const { data, error } = await publicUpcomingEventsBase(supabase, VENDOR_DASHBOARD_PUBLIC_EVENT_COLUMNS)
    .order("date", { ascending: true })
    .limit(limit)

  if (error) {
    console.error("[vendor-dashboard] fetchPublicUpcomingEventsForVendorDashboard:", error)
    return []
  }

  return (data ?? []) as VendorDashboardPublicEventRow[]
}
