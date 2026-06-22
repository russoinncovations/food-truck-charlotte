/** Preferred vendor booking sender when verified in Resend (set via env). */
export const VENDOR_BOOKING_FROM_PREFERRED = "Nicole at FoodTruckCLT <hello@foodtruckclt.com>"

const LEGACY_FALLBACK_FROM = "Food Truck CLT <noreply@foodtruckclt.com>"

function formatVendorFromAddress(raw: string): string {
  const trimmed = raw.trim()
  if (trimmed.includes("<") && trimmed.includes("@")) return trimmed
  if (trimmed.includes("@")) return `Nicole at FoodTruckCLT <${trimmed}>`
  return trimmed
}

/**
 * From address for vendor booking lead emails.
 * 1. FOODTRUCKCLT_VENDOR_FROM_EMAIL (e.g. hello@ when verified)
 * 2. RESEND_FROM_EMAIL (existing verified sender)
 * 3. Legacy noreply fallback
 */
export function resolveVendorBookingFromEmail(): string {
  const vendorFrom = process.env.FOODTRUCKCLT_VENDOR_FROM_EMAIL?.trim()
  if (vendorFrom) return formatVendorFromAddress(vendorFrom)

  const resendFrom = process.env.RESEND_FROM_EMAIL?.trim()
  if (resendFrom) return resendFrom

  return LEGACY_FALLBACK_FROM
}
