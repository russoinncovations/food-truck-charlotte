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

export function parseAdminBookingsDashboardFilter(raw: string | null | undefined): AdminBookingsDashboardFilter | null {
  const v = (raw ?? "").trim()
  if (
    v === "open" ||
    v === "no-vendor-response" ||
    v === "vendor-interest" ||
    v === "needs-follow-up"
  ) {
    return v
  }
  return null
}

export const ADMIN_BOOKINGS_DASHBOARD_FILTER_LABEL: Record<AdminBookingsDashboardFilter, { title: string }> = {
  open: { title: "Open booking requests" },
  "no-vendor-response": { title: "Requests with no vendor responses" },
  "vendor-interest": { title: "Requests with vendor interest" },
  "needs-follow-up": { title: "Needs admin follow-up" },
}
