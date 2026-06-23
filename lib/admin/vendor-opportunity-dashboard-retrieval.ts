import { isBookingActiveForVendorOpportunities } from "@/lib/booking/booking-request-status"
import { BOOKING_NOTIFICATION_STATUS } from "@/lib/booking/booking-notification-status"
import {
  type BookingRequestEmbed,
  shouldShowBookingOnVendorDashboard,
} from "@/lib/dashboard/vendor-booking-opportunity-visibility"

export type VendorDashboardRetrievalResult = {
  retrievable: boolean
  reasons: string[]
}

const EXPLICIT_NON_VENDOR_DASHBOARD_STATUSES = new Set([
  BOOKING_NOTIFICATION_STATUS.DASHBOARD_ONLY,
  BOOKING_NOTIFICATION_STATUS.NOT_ELIGIBLE_NO_EMAIL,
])

/**
 * Regression guard: a delivered email notification should mean the vendor dashboard
 * active-pending query would include this opportunity (unless explicitly dashboard-only).
 */
export function evaluateVendorDashboardRetrieval(opts: {
  opportunityStatus: string | null | undefined
  bookingRequest: BookingRequestEmbed | null | undefined
  truck: { name?: string | null; email?: string | null }
  notificationStatus?: string | null
}): VendorDashboardRetrievalResult {
  const reasons: string[] = []
  const notificationStatus = (opts.notificationStatus ?? "").toLowerCase()

  if (EXPLICIT_NON_VENDOR_DASHBOARD_STATUSES.has(notificationStatus as typeof BOOKING_NOTIFICATION_STATUS.DASHBOARD_ONLY)) {
    return { retrievable: true, reasons: [] }
  }

  const oppStatus = String(opts.opportunityStatus ?? "").toLowerCase()
  if (oppStatus !== "pending") {
    reasons.push(`Opportunity status is "${opts.opportunityStatus ?? "—"}", not pending.`)
  }

  const br = opts.bookingRequest
  if (!br) {
    reasons.push("Linked booking request is missing (vendor embed would be empty).")
  } else {
    if (!isBookingActiveForVendorOpportunities(br.status)) {
      reasons.push(`Booking status "${br.status ?? "—"}" is terminal for vendors.`)
    }
    if (!shouldShowBookingOnVendorDashboard(br, opts.truck)) {
      reasons.push("Internal test booking hidden from this truck's dashboard.")
    }
  }

  if (!opts.truck.email?.trim()) {
    reasons.push("Truck profile has no trucks.email — vendor cannot log in to see opportunities.")
  }

  return { retrievable: reasons.length === 0, reasons }
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
