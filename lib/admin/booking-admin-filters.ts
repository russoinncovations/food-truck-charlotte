/** Booking workflow statuses treated as "open pipeline" on the admin dashboard. */
export const ADMIN_BOOKING_PIPELINE_STATUSES = ["new", "contacted", "in_progress", "quoted"] as const

export function isAdminBookingPipelineStatus(status: string): boolean {
  return (ADMIN_BOOKING_PIPELINE_STATUSES as readonly string[]).includes(status)
}

export type AdminBookingsDashboardFilter =
  | "open"
  | "no-vendor-response"
  | "vendor-interest"
  | "needs-follow-up"
  | "no-notification-sent"
  | "delivered-no-response"
  | "bounced-failed"
  | "missing-vendor-email"
  | "dashboard-only"

export function parseAdminBookingsDashboardFilter(raw: string | null | undefined): AdminBookingsDashboardFilter | null {
  const v = (raw ?? "").trim()
  const allowed: AdminBookingsDashboardFilter[] = [
    "open",
    "no-vendor-response",
    "vendor-interest",
    "needs-follow-up",
    "no-notification-sent",
    "delivered-no-response",
    "bounced-failed",
    "missing-vendor-email",
    "dashboard-only",
  ]
  if (allowed.includes(v as AdminBookingsDashboardFilter)) {
    return v as AdminBookingsDashboardFilter
  }
  return null
}

export const ADMIN_BOOKINGS_DASHBOARD_FILTER_LABEL: Record<AdminBookingsDashboardFilter, { title: string }> = {
  open: { title: "Open booking requests" },
  "no-vendor-response": { title: "Requests with no vendor responses" },
  "vendor-interest": { title: "Requests with vendor interest" },
  "needs-follow-up": { title: "Needs admin follow-up" },
  "no-notification-sent": { title: "No vendor notification email sent" },
  "delivered-no-response": { title: "Delivered but no vendor response" },
  "bounced-failed": { title: "Bounced or failed vendor notifications" },
  "missing-vendor-email": { title: "Missing vendor email on file" },
  "dashboard-only": { title: "Dashboard-only opportunities" },
}
