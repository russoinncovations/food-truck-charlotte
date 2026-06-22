/** Per-opportunity booking notification lifecycle (stored on truck_opportunities.notification_status). */
export const BOOKING_NOTIFICATION_STATUS = {
  DASHBOARD_ONLY: "dashboard_only",
  QUEUED: "queued",
  SENT: "sent",
  DELIVERED: "delivered",
  BOUNCED: "bounced",
  FAILED: "failed",
  COMPLAINED: "complained",
  NOT_ELIGIBLE_NO_EMAIL: "not_eligible_no_email",
} as const

export type BookingNotificationStatus =
  (typeof BOOKING_NOTIFICATION_STATUS)[keyof typeof BOOKING_NOTIFICATION_STATUS]

export const BOOKING_NOTIFICATION_STATUS_LABEL: Record<BookingNotificationStatus, string> = {
  dashboard_only: "Dashboard only",
  queued: "Queued",
  sent: "Email sent",
  delivered: "Delivered",
  bounced: "Bounced",
  failed: "Failed",
  complained: "Complained",
  not_eligible_no_email: "Missing vendor email",
}

/** True when Resend accepted a send for this opportunity. */
export function bookingNotificationWasEmailed(status: string | null | undefined): boolean {
  const s = (status ?? "").toLowerCase()
  return (
    s === BOOKING_NOTIFICATION_STATUS.SENT ||
    s === BOOKING_NOTIFICATION_STATUS.DELIVERED ||
    s === BOOKING_NOTIFICATION_STATUS.BOUNCED ||
    s === BOOKING_NOTIFICATION_STATUS.COMPLAINED
  )
}

export function bookingNotificationNeedsOutreach(status: string | null | undefined): boolean {
  const s = (status ?? "").toLowerCase()
  return (
    s === BOOKING_NOTIFICATION_STATUS.NOT_ELIGIBLE_NO_EMAIL ||
    s === BOOKING_NOTIFICATION_STATUS.BOUNCED ||
    s === BOOKING_NOTIFICATION_STATUS.FAILED ||
    s === BOOKING_NOTIFICATION_STATUS.DASHBOARD_ONLY
  )
}

export function bookingNotificationDeliveryLabel(status: string | null | undefined): string {
  const s = (status ?? "").toLowerCase()
  if (!s) return "Unknown"
  return BOOKING_NOTIFICATION_STATUS_LABEL[s as BookingNotificationStatus] ?? status
}

/** Webhook event types that advance delivery state on truck_opportunities. */
export const BOOKING_RESEND_DELIVERY_EVENTS: Record<string, BookingNotificationStatus> = {
  "email.delivered": BOOKING_NOTIFICATION_STATUS.DELIVERED,
  "email.bounced": BOOKING_NOTIFICATION_STATUS.BOUNCED,
  "email.failed": BOOKING_NOTIFICATION_STATUS.FAILED,
  "email.complained": BOOKING_NOTIFICATION_STATUS.COMPLAINED,
}
