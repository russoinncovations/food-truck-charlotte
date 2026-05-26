export const VENDOR_REMINDER_RESEND_GAP_MS = 300

/** Sequential gap so bulk sends stay under typical Resend limits (~4/s with margin + network latency). */
export async function pauseBetweenVendorReminderSends(): Promise<void> {
  await new Promise((r) => setTimeout(r, VENDOR_REMINDER_RESEND_GAP_MS))
}

export type VendorReminderSendFailureReport = {
  email: string
  message: string
  truckId: string
  truckName: string
}

/**
 * Encodes failure rows for a redirect query param. Truncates from the end if the string would exceed the limit.
 */
export function failuresForReminderRedirectQuery(
  errors: VendorReminderSendFailureReport[],
  maxEncodedChars = 10_000
): { encoded: string; truncated: boolean } {
  let n = errors.length
  while (n > 0) {
    const encoded = encodeURIComponent(JSON.stringify(errors.slice(0, n)))
    if (encoded.length <= maxEncodedChars) {
      return { encoded, truncated: n < errors.length }
    }
    n -= 1
  }
  return { encoded: encodeURIComponent("[]"), truncated: errors.length > 0 }
}
