import { isBookingActiveForVendorOpportunities } from "@/lib/booking/booking-request-status"
import { BOOKING_NOTIFICATION_STATUS } from "@/lib/booking/booking-notification-status"
import {
  type BookingRequestEmbed,
  isInternalTestBookingRequest,
  shouldShowBookingOnVendorDashboard,
} from "@/lib/dashboard/vendor-booking-opportunity-visibility"
import { opportunityVisibleInRequestsToConfirm } from "@/lib/dashboard/vendor-booking-opportunities"
import { isInternalTestTruck } from "@/lib/trucks/internal-test-recipients"
import {
  isPlausibleVendorEmail,
  normalizeVendorEmailKey,
  trimVendorEmail,
} from "@/lib/trucks/canonical-vendor-email"

export type ReconciliationCategory =
  | "visible_healthy"
  | "identity_email_mismatch"
  | "rls_policy"
  | "deleted_inactive_malformed_truck"
  | "terminal_booking_status"
  | "internal_test_exception"
  | "needs_manual_review"

export type NotificationTrackingKind =
  | "tracked_delivery"
  | "dashboard_only"
  | "historical_untracked"
  | "not_eligible_no_email"
  | "failed_or_bounced"

export type TruckRecordForVisibility = {
  id?: string | null
  name?: string | null
  email?: string | null
  is_active?: boolean | null
  status?: string | null
}

export type PendingOpportunityVisibilityResult = {
  visibleInRequestsToConfirm: boolean
  expectedSection: "requests_to_confirm" | "none"
  exclusionReasons: string[]
  category: ReconciliationCategory
  notificationTrackingKind: NotificationTrackingKind
  /** True when vendor login email (trucks.email) would match RLS truck owner policy. */
  rlsLoginViable: boolean
  truckEmailNormalized: string | null
}

export function classifyNotificationTrackingKind(opts: {
  notification_status?: string | null
  notification_sent_at?: string | null
  resend_email_id?: string | null
  delivered_at?: string | null
}): NotificationTrackingKind {
  const s = (opts.notification_status ?? "").toLowerCase()
  if (s === BOOKING_NOTIFICATION_STATUS.NOT_ELIGIBLE_NO_EMAIL) return "not_eligible_no_email"
  if (s === BOOKING_NOTIFICATION_STATUS.DASHBOARD_ONLY) return "dashboard_only"
  if (
    s === BOOKING_NOTIFICATION_STATUS.SENT ||
    s === BOOKING_NOTIFICATION_STATUS.DELIVERED ||
    s === BOOKING_NOTIFICATION_STATUS.QUEUED
  ) {
    return "tracked_delivery"
  }
  if (s === BOOKING_NOTIFICATION_STATUS.BOUNCED || s === BOOKING_NOTIFICATION_STATUS.FAILED) {
    return "failed_or_bounced"
  }
  if (opts.notification_sent_at || opts.resend_email_id || opts.delivered_at) {
    return "tracked_delivery"
  }
  return "historical_untracked"
}

function isPendingOpportunityStatus(status: string | null | undefined): boolean {
  return String(status ?? "").trim().toLowerCase() === "pending"
}

function isActiveListedTruck(truck: TruckRecordForVisibility | null | undefined): boolean {
  if (!truck?.id) return false
  if (truck.is_active === false) return false
  const st = String(truck.status ?? "").trim().toLowerCase()
  if (st && st !== "active") return false
  return true
}

/**
 * Vendor dashboard visibility for pending opportunities — same rules as /dashboard
 * “Requests to Confirm”. Notification status does not affect visibility.
 */
export function evaluatePendingOpportunityDashboardVisibility(opts: {
  opportunityStatus: string | null | undefined
  bookingRequest: BookingRequestEmbed | null | undefined
  truck: TruckRecordForVisibility | null | undefined
  notificationStatus?: string | null
  notification_sent_at?: string | null
  resend_email_id?: string | null
  delivered_at?: string | null
}): PendingOpportunityVisibilityResult {
  const br = opts.bookingRequest ?? null
  const truck = opts.truck ?? null
  const exclusionReasons: string[] = []

  const notificationTrackingKind = classifyNotificationTrackingKind({
    notification_status: opts.notificationStatus,
    notification_sent_at: opts.notification_sent_at,
    resend_email_id: opts.resend_email_id,
    delivered_at: opts.delivered_at,
  })

  const truckEmailNormalized = truck?.email ? normalizeVendorEmailKey(truck.email) : null
  const rlsLoginViable = Boolean(truckEmailNormalized && isPlausibleVendorEmail(truckEmailNormalized))

  if (!isPendingOpportunityStatus(opts.opportunityStatus)) {
    exclusionReasons.push(
      `Opportunity status is "${opts.opportunityStatus ?? "—"}", not pending (case-insensitive).`
    )
  }

  if (!truck?.id) {
    exclusionReasons.push("Truck record missing or truck_id is invalid.")
  } else if (!isActiveListedTruck(truck)) {
    exclusionReasons.push(
      `Truck is inactive or not active status (is_active=${String(truck.is_active)}, status=${truck.status ?? "—"}).`
    )
  }

  if (!br) {
    exclusionReasons.push("Linked booking_request missing — vendor embed would be empty (possible RLS/data gap).")
  } else if (!isBookingActiveForVendorOpportunities(br.status)) {
    exclusionReasons.push(`Booking status "${br.status ?? "—"}" is terminal for vendors.`)
  }

  const internalBooking = isInternalTestBookingRequest(br)
  const internalTruck = truck ? isInternalTestTruck(truck) : false
  if (internalBooking && truck && !internalTruck) {
    exclusionReasons.push("INTERNAL TEST booking hidden from non-internal test trucks.")
  }
  if (!internalBooking && truck && internalTruck) {
    exclusionReasons.push("Production booking on internal test truck — review routing.")
  }

  if (truck && !trimVendorEmail(truck.email)) {
    exclusionReasons.push("Trucks.email is empty — vendor cannot log in to retrieve opportunities.")
  } else if (truck && trimVendorEmail(truck.email) && !isPlausibleVendorEmail(truck.email)) {
    exclusionReasons.push(`Trucks.email "${trimVendorEmail(truck.email)}" is not a plausible login address.`)
  }

  const visibleInRequestsToConfirm =
    !!truck &&
    isActiveListedTruck(truck) &&
    opportunityVisibleInRequestsToConfirm(opts.opportunityStatus, br, truck)

  if (!visibleInRequestsToConfirm && br && truck && isActiveListedTruck(truck)) {
    if (!shouldShowBookingOnVendorDashboard(br, truck)) {
      /* already in exclusionReasons */
    } else if (!isBookingActiveForVendorOpportunities(br.status)) {
      /* already noted */
    } else if (!isPendingOpportunityStatus(opts.opportunityStatus)) {
      /* already noted */
    } else if (!br) {
      exclusionReasons.push("Booking embed failed visibility checks.")
    }
  }

  const category = categorizePendingOpportunityVisibility({
    visibleInRequestsToConfirm,
    truck,
    br,
    rlsLoginViable,
    internalBooking,
    internalTruck,
    exclusionReasons,
  })

  if (
    !visibleInRequestsToConfirm &&
    truck?.id &&
    isActiveListedTruck(truck) &&
    rlsLoginViable &&
    br &&
    isBookingActiveForVendorOpportunities(br.status) &&
    shouldShowBookingOnVendorDashboard(br, truck) &&
    isPendingOpportunityStatus(opts.opportunityStatus) &&
    category === "needs_manual_review"
  ) {
    exclusionReasons.push(
      "May exceed dashboard pending fetch limit (newest 200) — visible in count if within window."
    )
  }

  return {
    visibleInRequestsToConfirm,
    expectedSection: visibleInRequestsToConfirm ? "requests_to_confirm" : "none",
    exclusionReasons: visibleInRequestsToConfirm ? [] : [...new Set(exclusionReasons)],
    category,
    notificationTrackingKind,
    rlsLoginViable,
    truckEmailNormalized,
  }
}

function categorizePendingOpportunityVisibility(opts: {
  visibleInRequestsToConfirm: boolean
  truck: TruckRecordForVisibility | null | undefined
  br: BookingRequestEmbed | null
  rlsLoginViable: boolean
  internalBooking: boolean
  internalTruck: boolean
  exclusionReasons: string[]
}): ReconciliationCategory {
  if (opts.visibleInRequestsToConfirm && opts.rlsLoginViable && opts.truck?.id) {
    return "visible_healthy"
  }

  if (opts.internalBooking && opts.truck && !opts.internalTruck) {
    return "internal_test_exception"
  }
  if (opts.internalBooking && opts.internalTruck && !opts.visibleInRequestsToConfirm) {
    return "internal_test_exception"
  }
  if (!opts.internalBooking && opts.internalTruck) {
    return "internal_test_exception"
  }

  if (!opts.truck?.id || !isActiveListedTruck(opts.truck)) {
    return "deleted_inactive_malformed_truck"
  }

  if (opts.br && !isBookingActiveForVendorOpportunities(opts.br.status)) {
    return "terminal_booking_status"
  }

  if (!opts.rlsLoginViable || opts.exclusionReasons.some((r) => r.includes("Trucks.email"))) {
    return "identity_email_mismatch"
  }

  if (
    opts.exclusionReasons.some(
      (r) => r.includes("embed") || r.includes("RLS") || r.includes("booking_request missing")
    )
  ) {
    return "rls_policy"
  }

  return "needs_manual_review"
}

export type SafeReconciliationFix =
  | {
      type: "normalize_opportunity_status"
      opportunityId: string
      before: string
      after: "pending"
    }

/** Deterministic fixes that do not touch notification audit fields. */
export function proposeSafeReconciliationFixes(opts: {
  opportunityId: string
  opportunityStatus: string | null | undefined
  visibility: PendingOpportunityVisibilityResult
}): SafeReconciliationFix[] {
  const fixes: SafeReconciliationFix[] = []
  const raw = String(opts.opportunityStatus ?? "")
  if (
    raw !== "pending" &&
    raw.trim().toLowerCase() === "pending" &&
    !opts.visibility.visibleInRequestsToConfirm
  ) {
    fixes.push({
      type: "normalize_opportunity_status",
      opportunityId: opts.opportunityId,
      before: raw,
      after: "pending",
    })
  }
  return fixes
}
