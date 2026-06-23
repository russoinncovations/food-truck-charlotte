import { isBookingActiveForVendorOpportunities } from "@/lib/booking/booking-request-status"
import { BOOKING_NOTIFICATION_STATUS } from "@/lib/booking/booking-notification-status"
import {
  type BookingRequestEmbed,
  shouldShowBookingOnVendorDashboard,
} from "@/lib/dashboard/vendor-booking-opportunity-visibility"
import {
  opportunityVisibleInRecentResponses,
  opportunityVisibleInRequestsToConfirm,
  VENDOR_DASHBOARD_RECENT_RESPONSE_STATUSES,
} from "@/lib/dashboard/vendor-booking-opportunities"

export type VendorDashboardSection = "requests_to_confirm" | "recent_responses" | "none"

export type VendorDashboardRetrievalResult = {
  retrievable: boolean
  reasons: string[]
  section: VendorDashboardSection
  visibilityLabel: string | null
}

const EXPLICIT_NON_VENDOR_DASHBOARD_STATUSES = new Set([
  BOOKING_NOTIFICATION_STATUS.DASHBOARD_ONLY,
  BOOKING_NOTIFICATION_STATUS.NOT_ELIGIBLE_NO_EMAIL,
])

function sectionForOpportunityStatus(oppStatus: string): VendorDashboardSection {
  if (oppStatus === "pending") return "requests_to_confirm"
  if (VENDOR_DASHBOARD_RECENT_RESPONSE_STATUSES.has(oppStatus)) return "recent_responses"
  return "none"
}

function buildNotVisibleReasons(opts: {
  opportunityStatus: string | null | undefined
  bookingRequest: BookingRequestEmbed | null | undefined
  truck: { name?: string | null; email?: string | null }
}): string[] {
  const reasons: string[] = []
  const oppStatus = String(opts.opportunityStatus ?? "").toLowerCase()
  const br = opts.bookingRequest ?? null
  const expectedSection = sectionForOpportunityStatus(oppStatus)

  if (!opts.truck.email?.trim()) {
    reasons.push("Truck profile has no trucks.email — vendor cannot log in to see opportunities.")
  }

  if (!br) {
    reasons.push("Linked booking request is missing (vendor embed would be empty).")
  } else if (!shouldShowBookingOnVendorDashboard(br, opts.truck)) {
    reasons.push("Internal test booking hidden from this truck's dashboard.")
  }

  if (expectedSection === "requests_to_confirm") {
    if (br && !isBookingActiveForVendorOpportunities(br.status)) {
      reasons.push(`Booking status "${br.status ?? "—"}" is terminal for vendors.`)
    }
    reasons.push("Not visible in Requests to Confirm.")
  } else if (expectedSection === "recent_responses") {
    reasons.push("Not visible in Recent responses.")
  } else {
    reasons.push(`Opportunity status "${opts.opportunityStatus ?? "—"}" has no vendor dashboard section.`)
  }

  return reasons
}

/**
 * Regression guard: a delivered notification should mean the opportunity appears in the
 * vendor dashboard section that matches its current status (unless explicitly dashboard-only
 * or the booking is no longer actionable for vendors).
 */
export function evaluateVendorDashboardRetrieval(opts: {
  opportunityStatus: string | null | undefined
  bookingRequest: BookingRequestEmbed | null | undefined
  truck: { name?: string | null; email?: string | null }
  notificationStatus?: string | null
}): VendorDashboardRetrievalResult {
  const notificationStatus = (opts.notificationStatus ?? "").toLowerCase()

  if (
    EXPLICIT_NON_VENDOR_DASHBOARD_STATUSES.has(
      notificationStatus as typeof BOOKING_NOTIFICATION_STATUS.DASHBOARD_ONLY
    )
  ) {
    return { retrievable: true, reasons: [], section: "none", visibilityLabel: null }
  }

  const br = opts.bookingRequest ?? null
  const oppStatus = String(opts.opportunityStatus ?? "").toLowerCase()

  if (br && !isBookingActiveForVendorOpportunities(br.status)) {
    return { retrievable: true, reasons: [], section: "none", visibilityLabel: null }
  }

  const loginBlockers: string[] = []
  if (!opts.truck.email?.trim()) {
    loginBlockers.push("Truck profile has no trucks.email — vendor cannot log in to see opportunities.")
  }

  if (opportunityVisibleInRequestsToConfirm(oppStatus, br, opts.truck)) {
    return {
      retrievable: loginBlockers.length === 0,
      reasons: loginBlockers,
      section: "requests_to_confirm",
      visibilityLabel: loginBlockers.length === 0 ? "Visible in Requests to Confirm" : null,
    }
  }

  if (opportunityVisibleInRecentResponses(opts.opportunityStatus, br, opts.truck)) {
    return {
      retrievable: loginBlockers.length === 0,
      reasons: loginBlockers,
      section: "recent_responses",
      visibilityLabel: loginBlockers.length === 0 ? "Visible in Recent responses" : null,
    }
  }

  return {
    retrievable: false,
    reasons: buildNotVisibleReasons(opts),
    section: sectionForOpportunityStatus(oppStatus),
    visibilityLabel: null,
  }
}

export function vendorDashboardRetrievalWarning(
  notificationStatus: string | null | undefined,
  retrieval: VendorDashboardRetrievalResult
): string | null {
  const s = (notificationStatus ?? "").toLowerCase()
  if (s !== BOOKING_NOTIFICATION_STATUS.DELIVERED) return null
  if (retrieval.retrievable) return null
  return `Delivered but not visible on vendor dashboard: ${retrieval.reasons.join(" ")}`
}

/** Neutral admin label when delivery succeeded and the opportunity is on the expected dashboard section. */
export function vendorDashboardVisibilityLabel(
  notificationStatus: string | null | undefined,
  retrieval: VendorDashboardRetrievalResult
): string | null {
  const s = (notificationStatus ?? "").toLowerCase()
  if (s !== BOOKING_NOTIFICATION_STATUS.DELIVERED) return null
  if (!retrieval.retrievable) return null
  return retrieval.visibilityLabel
}
