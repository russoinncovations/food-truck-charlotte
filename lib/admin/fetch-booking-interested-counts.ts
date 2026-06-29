import { createAdminSupabaseClient } from "@/lib/supabase/admin"
import { createClient } from "@/lib/supabase/server"
import {
  bookingNotificationWasEmailed,
  BOOKING_NOTIFICATION_STATUS,
} from "@/lib/booking/booking-notification-status"
import { isOpportunityActiveAndActionable, type OpportunityBookingTiming } from "@/lib/booking/opportunity-active"
import { opportunityHasVendorResponse } from "@/lib/booking/opportunity-delivery-reliability"

export type BookingOpportunityMetrics = {
  interestedCount: number
  totalOpportunities: number
  /** True if at least one opportunity is not still pending (interested, not available, or legacy pass). */
  hasVendorResponse: boolean
  /** No Resend send attempted for any opportunity on this booking. */
  hasNoNotificationSent: boolean
  /** At least one email delivered and no vendor has responded yet. */
  hasDeliveredNoResponse: boolean
  /** At least one bounced or failed notification. */
  hasBouncedOrFailed: boolean
  /** At least one active pending opportunity with delivered email and no response. */
  hasActiveDeliveredNoResponse: boolean
  /** At least one opportunity flagged missing vendor email. */
  hasMissingVendorEmail: boolean
  /** All opportunities are dashboard-only (no email send attempted). */
  isDashboardOnly: boolean
  /** True when all opportunities are still pending and at least one is active. */
  hasActiveNoVendorResponse: boolean
}

function isRespondedOpportunityStatus(status: string): boolean {
  return opportunityHasVendorResponse(status)
}

type OppRow = {
  booking_request_id: string | null
  status: string | null
  notification_status: string | null
  expires_at?: string | null
  booking_requests?: OpportunityBookingTiming | OpportunityBookingTiming[] | null
}

function bookingTimingFromRow(row: OppRow): OpportunityBookingTiming | null {
  const raw = row.booking_requests
  const br = Array.isArray(raw) ? raw[0] : raw
  if (!br || typeof br !== "object") return null
  return br
}

function emptyMetrics(): BookingOpportunityMetrics {
  return {
    interestedCount: 0,
    totalOpportunities: 0,
    hasVendorResponse: false,
    hasNoNotificationSent: false,
    hasDeliveredNoResponse: false,
    hasBouncedOrFailed: false,
    hasActiveDeliveredNoResponse: false,
    hasMissingVendorEmail: false,
    isDashboardOnly: false,
    hasActiveNoVendorResponse: false,
  }
}

export function computeMetricsFromRows(
  rows: OppRow[]
): Omit<BookingOpportunityMetrics, "interestedCount" | "totalOpportunities"> {
  let hasVendorResponse = false
  let anyEmailed = false
  let anyDelivered = false
  let anyActiveDelivered = false
  let anyBouncedOrFailed = false
  let anyMissingEmail = false
  let allDashboardOnly = rows.length > 0
  let anyActive = false
  let allActivePending = rows.length > 0

  for (const row of rows) {
    const st = String(row.status ?? "")
    if (isRespondedOpportunityStatus(st)) hasVendorResponse = true
    const booking = bookingTimingFromRow(row)
    const active = isOpportunityActiveAndActionable({
      status: row.status,
      expires_at: row.expires_at,
      booking,
    })
    if (active) anyActive = true
    if (active && st.toLowerCase() !== "pending") allActivePending = false

    const ns = (row.notification_status ?? "").toLowerCase()
    if (bookingNotificationWasEmailed(ns)) anyEmailed = true
    if (ns === BOOKING_NOTIFICATION_STATUS.DELIVERED) anyDelivered = true
    if (active && ns === BOOKING_NOTIFICATION_STATUS.DELIVERED) anyActiveDelivered = true
    if (ns === BOOKING_NOTIFICATION_STATUS.BOUNCED || ns === BOOKING_NOTIFICATION_STATUS.FAILED) {
      anyBouncedOrFailed = true
    }
    if (ns === BOOKING_NOTIFICATION_STATUS.NOT_ELIGIBLE_NO_EMAIL) anyMissingEmail = true
    if (ns !== BOOKING_NOTIFICATION_STATUS.DASHBOARD_ONLY) allDashboardOnly = false
  }

  return {
    hasVendorResponse,
    hasNoNotificationSent: rows.length > 0 && !anyEmailed,
    hasDeliveredNoResponse: anyDelivered && !hasVendorResponse,
    hasActiveDeliveredNoResponse: anyActiveDelivered && !hasVendorResponse,
    hasBouncedOrFailed: anyBouncedOrFailed,
    hasMissingVendorEmail: anyMissingEmail,
    isDashboardOnly: rows.length > 0 && allDashboardOnly,
    hasActiveNoVendorResponse: anyActive && allActivePending && !hasVendorResponse,
  }
}

/**
 * Per-booking opportunity stats for admin list filters and columns.
 */
export async function fetchBookingOpportunityMetricsByBookingId(
  bookingIds: string[]
): Promise<Map<string, BookingOpportunityMetrics>> {
  const out = new Map<string, BookingOpportunityMetrics>()
  const ids = [...new Set(bookingIds.map((id) => id.trim()).filter(Boolean))]
  if (ids.length === 0) return out

  const admin = createAdminSupabaseClient()
  const db = admin ?? (await createClient())

  const { data, error } = await db
    .from("truck_opportunities")
    .select(
      "booking_request_id, status, notification_status, expires_at, booking_requests(event_date, start_time, end_time, status)"
    )
    .in("booking_request_id", ids)

  if (error) {
    console.error("[admin] opportunity metrics:", error)
    return out
  }

  const byBooking = new Map<string, OppRow[]>()
  for (const bid of ids) byBooking.set(bid, [])

  for (const row of (data ?? []) as OppRow[]) {
    const bid = row.booking_request_id
    if (!bid) continue
    const list = byBooking.get(bid) ?? []
    list.push(row)
    byBooking.set(bid, list)
  }

  for (const bid of ids) {
    const rows = byBooking.get(bid) ?? []
    const interested = rows.filter((r) => String(r.status ?? "").toLowerCase() === "interested").length
    const derived = computeMetricsFromRows(rows)
    out.set(bid, {
      interestedCount: interested,
      totalOpportunities: rows.length,
      ...derived,
    })
  }

  return out
}

/**
 * Count of vendors who marked I'm interested per booking (for admin list).
 * @deprecated Prefer fetchBookingOpportunityMetricsByBookingId — kept for narrow imports if needed.
 */
export async function fetchInterestedVendorCountByBookingId(
  bookingIds: string[]
): Promise<Map<string, number>> {
  const metrics = await fetchBookingOpportunityMetricsByBookingId(bookingIds)
  return new Map([...metrics.entries()].map(([id, m]) => [id, m.interestedCount]))
}

export { emptyMetrics as defaultBookingOpportunityMetrics }
