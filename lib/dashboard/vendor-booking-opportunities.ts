import type { SupabaseClient } from "@supabase/supabase-js"
import { EVENT_TYPES } from "@/lib/booking-types"
import {
  isOpportunityActiveAndActionable,
  isOpportunityEffectivelyExpired,
} from "@/lib/booking/opportunity-active"
import { isBookingActiveForVendorOpportunities } from "@/lib/booking/booking-request-status"
import type { DashboardOpportunity } from "@/components/dashboard-event-opportunities"
import {
  authEmailMatchesTruck,
  parseBookingEmbed,
  shouldShowBookingOnVendorDashboard,
} from "@/lib/dashboard/vendor-booking-opportunity-visibility"
import { isInternalTestTruck } from "@/lib/trucks/internal-test-recipients"
import { normalizeVendorEmailKey } from "@/lib/trucks/canonical-vendor-email"

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
  expires_at?: string | null
  booking_requests: unknown
}

export type VendorOpportunityExclusionReason =
  | "booking_not_embedded"
  | "booking_terminal_status"
  | "opportunity_expired"
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
 * Picks the truck row that matches the authenticated email after trim + lowercase.
 * Exported for focused tests — used by resolveVendorTruckForDashboard after the DB query.
 */
export function pickVendorTruckForAuthEmail(
  rows: VendorDashboardTruck[],
  authEmail: string | null | undefined
): {
  truck: VendorDashboardTruck | null
  resolutionNote: string | null
} {
  const email = (authEmail ?? "").trim()
  if (!email) {
    return { truck: null, resolutionNote: "No authenticated email" }
  }

  const matching = rows.filter((t) => authEmailMatchesTruck(email, t.email))
  if (matching.length === 0) {
    return {
      truck: null,
      resolutionNote:
        rows.length === 0
          ? "No truck row visible for this login (check trucks.email matches auth email; RLS uses case-insensitive match)."
          : "Queried truck row(s) exist but none match auth email after normalization.",
    }
  }

  return {
    truck: matching[0],
    resolutionNote: matching.length > 1 ? "Multiple trucks matched — using first." : null,
  }
}

/**
 * Resolves the vendor's truck by authenticated email (case-insensitive / trimmed).
 * Queries trucks.email directly — does not rely on an arbitrary first-N public listing page.
 * RLS still applies: owners can read their own row; public listed trucks remain readable.
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

  const emailKey = normalizeVendorEmailKey(email)
  /** ilike without wildcards ≈ case-insensitive equality; avoids brittle limit(5) public scans. */
  const { data, error } = await supabase
    .from("trucks")
    .select(TRUCK_SELECT)
    .ilike("email", emailKey)
    .limit(25)

  if (error) {
    return { truck: null, authEmail: email, resolutionNote: error.message }
  }

  const picked = pickVendorTruckForAuthEmail((data ?? []) as VendorDashboardTruck[], email)
  return {
    truck: picked.truck,
    authEmail: email,
    resolutionNote: picked.resolutionNote,
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

const VENDOR_DASHBOARD_PAST_STATUSES = new Set(["expired"])

/** Matches “Requests to Confirm” on /dashboard. */
export function opportunityVisibleInRequestsToConfirm(
  oppStatus: string | null | undefined,
  br: ReturnType<typeof parseBookingEmbed>,
  truck: { name?: string | null; email?: string | null },
  expiresAt?: string | null
): boolean {
  if (!br) return false
  if (
    !isOpportunityActiveAndActionable({
      status: oppStatus,
      expires_at: expiresAt,
      booking: br,
    })
  ) {
    return false
  }
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

/** Past expired opportunities (no vendor response) on /dashboard. */
export function opportunityVisibleInExpiredOpportunities(
  oppStatus: string | null | undefined,
  br: ReturnType<typeof parseBookingEmbed>,
  truck: { name?: string | null; email?: string | null },
  expiresAt?: string | null
): boolean {
  if (!shouldShowBookingOnVendorDashboard(br, truck)) return false
  const status = String(oppStatus ?? "").toLowerCase()
  if (VENDOR_DASHBOARD_PAST_STATUSES.has(status)) return true
  if (
    status === "pending" &&
    isOpportunityEffectivelyExpired({
      status: oppStatus,
      expires_at: expiresAt,
      booking: br,
    })
  ) {
    return true
  }
  return false
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
    if (
      isOpportunityEffectivelyExpired({
        status: opp.status,
        expires_at: opp.expires_at,
        booking: br,
      })
    ) {
      reasons.push("opportunity_expired")
    }
    if (!isBookingActiveForVendorOpportunities(bookingStatus)) {
      reasons.push("booking_terminal_status")
    }
    if (!shouldShowBookingOnVendorDashboard(br, truck)) {
      reasons.push("internal_test_hidden")
    }
  }

  const includedInActiveList = opportunityVisibleInRequestsToConfirm(opp.status, br, truck, opp.expires_at)

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
    return opportunityVisibleInRequestsToConfirm(opp.status, br, truck, opp.expires_at)
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

export async function fetchVendorRecentResponseOpportunities(
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
    console.error("[dashboard] recent response opportunities:", error)
    return []
  }

  return sortOpportunitiesNewestFirst((data ?? []) as TruckOpportunityRow[]).filter((opp) => {
    const br = parseBookingEmbed(opp.booking_requests)
    return opportunityVisibleInRecentResponses(opp.status, br, truck)
  })
}

export async function fetchVendorPastOpportunities(
  supabase: SupabaseClient,
  truck: VendorDashboardTruck
): Promise<TruckOpportunityRow[]> {
  const [expiredRes, pastPendingRes] = await Promise.all([
    supabase
      .from("truck_opportunities")
      .select("*, booking_requests(*)")
      .eq("truck_id", truck.id)
      .ilike("status", "expired")
      .order("created_at", { ascending: false })
      .limit(25),
    supabase
      .from("truck_opportunities")
      .select("*, booking_requests(*)")
      .eq("truck_id", truck.id)
      .ilike("status", "pending")
      .order("created_at", { ascending: false })
      .limit(50),
  ])

  if (expiredRes.error) {
    console.error("[dashboard] expired opportunities:", expiredRes.error)
  }
  if (pastPendingRes.error) {
    console.error("[dashboard] past pending opportunities:", pastPendingRes.error)
  }

  const expiredRows = (expiredRes.data ?? []) as TruckOpportunityRow[]
  const pastPendingRows = ((pastPendingRes.data ?? []) as TruckOpportunityRow[]).filter((opp) => {
    const br = parseBookingEmbed(opp.booking_requests)
    return opportunityVisibleInExpiredOpportunities(opp.status, br, truck, opp.expires_at)
  })

  const merged = sortOpportunitiesNewestFirst([...expiredRows, ...pastPendingRows])
  const seen = new Set<string>()
  const deduped: TruckOpportunityRow[] = []

  for (const opp of merged) {
    if (seen.has(opp.id)) continue
    seen.add(opp.id)
    const br = parseBookingEmbed(opp.booking_requests)
    if (!opportunityVisibleInExpiredOpportunities(opp.status, br, truck, opp.expires_at)) continue
    const status = String(opp.status).toLowerCase()
    deduped.push({
      ...opp,
      status: status === "pending" ? "expired" : opp.status,
    })
    if (deduped.length >= 25) break
  }

  return deduped
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
