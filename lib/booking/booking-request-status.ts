/** Booking statuses that remove the request from vendor dashboards and block vendor responses. */
export const BOOKING_TERMINAL_FOR_VENDORS = new Set([
  "fulfilled",
  "closed",
  "cancelled",
  "completed",
])

export function isBookingActiveForVendorOpportunities(status: string | null | undefined): boolean {
  const s = (status ?? "").trim().toLowerCase()
  if (!s) return true
  return !BOOKING_TERMINAL_FOR_VENDORS.has(s)
}
