import { INTERNAL_TEST_BOOKING_MARKER } from "@/lib/booking/create-internal-test-booking"
import { isInternalDemoVendorTruck } from "@/lib/trucks/internal-demo-vendor"
import { normalizeVendorEmailKey } from "@/lib/trucks/canonical-vendor-email"

export type BookingRequestEmbed = {
  status?: string | null
  additional_notes?: string | null
  contact_email?: string | null
  contact_name?: string | null
  event_date?: string | null
}

export function isInternalTestBookingRequest(br: BookingRequestEmbed | null | undefined): boolean {
  if (!br) return false
  const notes = String(br.additional_notes ?? "").toUpperCase()
  if (notes.includes(INTERNAL_TEST_BOOKING_MARKER)) return true
  const email = String(br.contact_email ?? "").toLowerCase()
  if (email.includes("internal-test") && email.endsWith("@foodtruckclt.com")) return true
  const name = String(br.contact_name ?? "").toUpperCase()
  if (name.includes(INTERNAL_TEST_BOOKING_MARKER)) return true
  return false
}

/**
 * Internal test bookings are visible only on the internal demo vendor dashboard.
 * Production vendors never see them; demo vendor sees all non-terminal active bookings.
 */
export function shouldShowBookingOnVendorDashboard(
  br: BookingRequestEmbed | null | undefined,
  truck: { name?: string | null; email?: string | null }
): boolean {
  const internalTest = isInternalTestBookingRequest(br)
  const demoTruck = isInternalDemoVendorTruck(truck)
  if (internalTest && !demoTruck) return false
  return true
}

export function parseBookingEmbed(raw: unknown): BookingRequestEmbed | null {
  const br = Array.isArray(raw) ? raw[0] : raw
  if (!br || typeof br !== "object") return null
  return br as BookingRequestEmbed
}

export function authEmailMatchesTruck(
  authEmail: string | null | undefined,
  truckEmail: string | null | undefined
): boolean {
  const a = normalizeVendorEmailKey(authEmail)
  const t = normalizeVendorEmailKey(truckEmail)
  if (!a || !t) return false
  return a === t
}
