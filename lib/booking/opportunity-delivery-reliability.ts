import { BOOKING_NOTIFICATION_STATUS } from "@/lib/booking/booking-notification-status"

export const VENDOR_OPPORTUNITY_RESPONSE_STATUSES = {
  PENDING: "pending",
  INTERESTED: "interested",
  UNAVAILABLE: "not_available",
  CONTACTED: "contacted",
  EXPIRED: "expired",
} as const

export type VendorOpportunityResponseStatus =
  (typeof VENDOR_OPPORTUNITY_RESPONSE_STATUSES)[keyof typeof VENDOR_OPPORTUNITY_RESPONSE_STATUSES]

export type OpportunityDeliverySnapshot = {
  status?: string | null
  notificationStatus?: string | null
  notificationEmail?: string | null
  notificationSentAt?: string | null
  resendEmailId?: string | null
  emailSentAt?: string | null
  providerMessageId?: string | null
  deliveredAt?: string | null
  bouncedAt?: string | null
  complainedAt?: string | null
}

export function isOpportunityEmailAlreadyAttempted(row: OpportunityDeliverySnapshot): boolean {
  const notificationStatus = (row.notificationStatus ?? "").toLowerCase()
  return Boolean(
    row.providerMessageId?.trim() ||
      row.resendEmailId?.trim() ||
      row.emailSentAt ||
      row.notificationSentAt ||
      notificationStatus === BOOKING_NOTIFICATION_STATUS.SENT ||
      notificationStatus === BOOKING_NOTIFICATION_STATUS.DELIVERED ||
      notificationStatus === BOOKING_NOTIFICATION_STATUS.BOUNCED ||
      notificationStatus === BOOKING_NOTIFICATION_STATUS.FAILED ||
      notificationStatus === BOOKING_NOTIFICATION_STATUS.COMPLAINED
  )
}

export function opportunityHasVendorResponse(status: string | null | undefined): boolean {
  const s = (status ?? "").toLowerCase()
  return (
    s === VENDOR_OPPORTUNITY_RESPONSE_STATUSES.INTERESTED ||
    s === VENDOR_OPPORTUNITY_RESPONSE_STATUSES.UNAVAILABLE ||
    s === VENDOR_OPPORTUNITY_RESPONSE_STATUSES.CONTACTED ||
    s === "pass"
  )
}

export function isOpportunityExpired(expiresAt: string | null | undefined, now = new Date()): boolean {
  /** Explicit expires_at only — use isOpportunityEffectivelyExpired from opportunity-active.ts when booking timing is available. */
  if (!expiresAt?.trim()) return false
  const d = new Date(expiresAt)
  if (Number.isNaN(d.getTime())) return false
  return d.getTime() <= now.getTime()
}

export function opportunityDeliveryProblem(row: OpportunityDeliverySnapshot): string | null {
  const s = (row.notificationStatus ?? "").toLowerCase()
  if (!row.notificationEmail?.trim() && s === BOOKING_NOTIFICATION_STATUS.NOT_ELIGIBLE_NO_EMAIL) {
    return "missing_email"
  }
  if (s === BOOKING_NOTIFICATION_STATUS.FAILED) return "send_failed"
  if (s === BOOKING_NOTIFICATION_STATUS.BOUNCED || row.bouncedAt) return "bounced"
  if (s === BOOKING_NOTIFICATION_STATUS.COMPLAINED || row.complainedAt) return "complained"
  return null
}
