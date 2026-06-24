import type { SupabaseClient } from "@supabase/supabase-js"
import { EVENT_TYPES } from "@/lib/booking-types"
import { isBookingActiveForVendorOpportunities } from "@/lib/booking/booking-request-status"
import type { DashboardOpportunity } from "@/components/dashboard-event-opportunities"
import {
  authEmailMatchesTruck,
  parseBookingEmbed,
  shouldShowBookingOnVendorDashboard,
} from "@/lib/dashboard/vendor-booking-opportunity-visibility"
import { isInternalTestTruck } from "@/lib/trucks/internal-test-recipients"

export type VendorDashboardTruck = {
  id: string
  name: string | null
  slug: string | null
  email: string | null
  cuisine: string | null
  cuisine_types: string[] | null
  serving_today: boolean | null
  serving_started_at: string | null
  today_location: string | null
  street_address: string | null
  latitude: number | null
  longitude: number | null
  updated_at: string | null
}

export type TruckOpportunityRow = {
  id: string
  status: string
  booking_request_id: string | null
  truck_id?: string | null
  created_at?: string
  responded_at?: string | null
  booking_requests: unknown
}

export type VendorOpportunityExclusionReason =
  | "booking_not_embedded"
  | "booking_terminal_status"
  | "internal_test_hidden"
  | "not_pending_status"

export type VendorOpportunityAuditRow = {
  opportunityId: string
  opportunityStatus: string
  bookingStatus: string | null
  includedInActiveList: boolean
  exclusionReasons: VendorOpportunityExclusionReason[]
}

const TRUCK_SELECT =
  "id, name, slug, email, cuisine, cuisine_types, serving_today, serving_started_at, today_location, street_address, latitude, longitude, updated_at"

/**
 * Resolves the vendor's truck using RLS (case-insensitive email match in policy).
 * Do not use `.eq('email', user.email)` — Postgres equality is case-sensitive and
 * diverges from RLS `lower(trim(...))` matching.
 */
export async function resolveVendorTruckForDashboard(
  supabase: SupabaseClient,
  authEmail: string | null | undefined
): Promise<{
  truck: VendorDashboardTruck | null
  authEmail: string
  resolutionNote: string | null
}> {
  const email = (authEmail ?? "").trim()
  if (!email) {
    return { truck: null, authEmail: "", resolutionNote: "No authenticated email" }
  }

  const { data, error } = await supabase.from("trucks").select(TRUCK_SELECT).limit(5)

  if (error) {
    return { truck: null, authEmail: email, resolutionNote: error.message }
  }

  const rows = (data ?? []) as VendorDashboardTruck[]
  const matching = rows.filter((t) => authEmailMatchesTruck(email, t.email))

  if (matching.length === 0) {
    return {
      truck: null,
      authEmail: email,
      resolutionNote:
        rows.length === 0
          ? "No truck row visible for this login (check trucks.email matches auth email; RLS uses case-insensitive match)."
          : "Visible truck row(s) exist but none match auth email after normalization.",
    }
  }

  return {
    truck: matching[0],
    authEmail: email,
    resolutionNote: matching.length > 1 ? "Multiple trucks matched — using first." : null,
  }
}

export function sortOpportunitiesNewestFirst<T extends { created_at?: string }>(rows: T[]): T[] {
  return [...rows].sort(
    (a, b) => new Date(b.created_at ?? 0).getTime() - new Date(a.created_at ?? 0).getTime()
  )
}

export const VENDOR_DASHBOARD_RECENT_RESPONSE_STATUSES = new Set([
  "interested",
  "not_available",
  "pass",
])

/** Matches “Requests to Confirm” on /dashboard. */
export function opportunityVisibleInRequestsToConfirm(
  oppStatus: string | null | undefined,
  br: ReturnType<typeof parseBookingEmbed>,
  truck: { name?: string | null; email?: string | null }
): boolean {
  if (String(oppStatus ?? "").toLowerCase() !== "pending") return false
  if (!br) return false
  if (!isBookingActiveForVendorOpportunities(br.status)) return false
  if (!shouldShowBookingOnVendorDashboard(br, truck)) return false
  return true
}

/** Matches “Your recent responses” on /dashboard. */
export function opportunityVisibleInRecentResponses(
  oppStatus: string | null | undefined,
  br: ReturnType<typeof parseBookingEmbed>,
  truck: { name?: string | null; email?: string | null }
): boolean {
  const status = String(oppStatus ?? "").toLowerCase()
  if (!VENDOR_DASHBOARD_RECENT_RESPONSE_STATUSES.has(status)) return false
  return shouldShowBookingOnVendorDashboard(br, truck)
}

function auditPendingOpportunity(
  opp: TruckOpportunityRow,
  truck: VendorDashboardTruck
): VendorOpportunityAuditRow {
  const br = parseBookingEmbed(opp.booking_requests)
  const bookingStatus = br?.status ?? null
  const reasons: VendorOpportunityExclusionReason[] = []

  if (String(opp.status).toLowerCase() !== "pending") {
    reasons.push("not_pending_status")
  }
  if (!br) {
    reasons.push("booking_not_embedded")
  } else {
    if (!isBookingActiveForVendorOpportunities(bookingStatus)) {
      reasons.push("booking_terminal_status")
    }
    if (!shouldShowBookingOnVendorDashboard(br, truck)) {
      reasons.push("internal_test_hidden")
    }
  }

  const includedInActiveList = opportunityVisibleInRequestsToConfirm(opp.status, br, truck)

  return {
    opportunityId: opp.id,
    opportunityStatus: String(opp.status),
    bookingStatus,
    includedInActiveList,
    exclusionReasons: includedInActiveList ? [] : reasons,
  }
}

export function filterActivePendingOpportunities(
  rows: TruckOpportunityRow[],
  truck: VendorDashboardTruck
): TruckOpportunityRow[] {
  return sortOpportunitiesNewestFirst(rows).filter((opp) => {
    const br = parseBookingEmbed(opp.booking_requests)
    return opportunityVisibleInRequestsToConfirm(opp.status, br, truck)
  })
}

export async function fetchVendorPendingOpportunities(
  supabase: SupabaseClient,
  truck: VendorDashboardTruck
): Promise<TruckOpportunityRow[]> {
  const { data, error } = await supabase
    .from("truck_opportunities")
    .select("*, booking_requests(*)")
    .eq("truck_id", truck.id)
    .ilike("status", "pending")
    .order("created_at", { ascending: false })
    .limit(200)

  if (error) {
    console.error("[dashboard] pending opportunities:", error)
    return []
  }

  return filterActivePendingOpportunities((data ?? []) as TruckOpportunityRow[], truck)
}

export async function fetchVendorHistoryOpportunities(
  supabase: SupabaseClient,
  truck: VendorDashboardTruck
): Promise<TruckOpportunityRow[]> {
  const { data, error } = await supabase
    .from("truck_opportunities")
    .select("*, booking_requests(*)")
    .eq("truck_id", truck.id)
    .in("status", ["interested", "not_available", "pass"])
    .order("responded_at", { ascending: false, nullsFirst: false })
    .order("created_at", { ascending: false })
    .limit(25)

  if (error) {
    console.error("[dashboard] history opportunities:", error)
    return []
  }

  return sortOpportunitiesNewestFirst((data ?? []) as TruckOpportunityRow[]).filter((opp) => {
    const br = parseBookingEmbed(opp.booking_requests)
    return opportunityVisibleInRecentResponses(opp.status, br, truck)
  })
}

export async function fetchVendorOpportunityDiagnostics(
  supabase: SupabaseClient,
  truck: VendorDashboardTruck,
  authEmail: string
): Promise<{
  authEmail: string
  truckId: string
  truckEmail: string | null
  isInternalDemoTruck: boolean
  rawPendingCount: number
  activePendingCount: number
  pendingOpportunityIds: string[]
  audits: VendorOpportunityAuditRow[]
  resolutionNote: string | null
}> {
  const { data: rawPending, error } = await supabase
    .from("truck_opportunities")
    .select("*, booking_requests(*)")
    .eq("truck_id", truck.id)
    .ilike("status", "pending")
    .order("created_at", { ascending: false })
    .limit(200)

  if (error) {
    console.error("[dashboard] opportunity diagnostics:", error)
  }

  const rows = (rawPending ?? []) as TruckOpportunityRow[]
  const active = filterActivePendingOpportunities(rows, truck)

  return {
    authEmail,
    truckId: truck.id,
    truckEmail: truck.email,
    isInternalDemoTruck: isInternalTestTruck(truck),
    rawPendingCount: rows.length,
    activePendingCount: active.length,
    pendingOpportunityIds: active.map((r) => r.id),
    audits: rows.map((r) => auditPendingOpportunity(r, truck)),
    resolutionNote: authEmailMatchesTruck(authEmail, truck.email)
      ? null
      : "Auth email does not match trucks.email after normalization.",
  }
}

export function mapRowsToDashboardOpportunities(sorted: TruckOpportunityRow[]): DashboardOpportunity[] {
  return sorted.map((opp) => {
    const br = parseBookingEmbed(opp.booking_requests)
    const row = br as
      | {
          event_type: string | null
          event_date: string | null
          city: string | null
          guest_count: number | null
          contact_email: string | null
          venue_name: string | null
          start_time: string | null
          end_time: string | null
          street_address: string | null
          state: string | null
          zip_code: string | null
          additional_notes: string | null
          request_type: string | null
          truck_id: string | null
          cuisines: string[] | null
          vendor_type: string | null
          status?: string | null
        }
      | null
      | undefined
    const eventTypeLabel =
      row != null
        ? (EVENT_TYPES.find((t) => t.value === row.event_type)?.label ?? row.event_type ?? "Event")
        : "Event"
    const eventDisplayName =
      row != null && row.venue_name != null && String(row.venue_name).trim() !== ""
        ? String(row.venue_name).trim()
        : eventTypeLabel
    return {
      id: opp.id,
      status: String(opp.status),
      booking: row
        ? {
            event_type: row.event_type,
            event_date: row.event_date,
            city: row.city,
            guest_count: row.guest_count,
            contact_email: row.contact_email,
            venue_name: row.venue_name,
            event_display_name: eventDisplayName,
            start_time: row.start_time,
            end_time: row.end_time,
            street_address: row.street_address,
            state: row.state,
            zip_code: row.zip_code,
            additional_notes: row.additional_notes,
            request_type: row.request_type,
            booking_truck_id: row.truck_id,
            cuisines: row.cuisines,
            vendor_type: row.vendor_type,
          }
        : null,
    }
  })
}
