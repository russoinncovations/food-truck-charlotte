/**
 * Canonical vendor notification email for FoodTruckCLT operational mail (booking leads,
 * schedule reminders, vendor login linkage). Single source: `trucks.email`.
 *
 * Not used for notifications:
 * - `trucks.booking_email` — optional public/catering contact on profile pages
 * - `vendor_applications.email` — historical application snapshot
 * - `truck_opportunities.notification_email` — audit snapshot at send time (immutable after delivery)
 */

export type TruckEmailFields = {
  email?: string | null
  booking_email?: string | null
}

const EMAIL_FORMAT = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

/** Trim only — preserves original casing for display. */
export function trimVendorEmail(raw: string | null | undefined): string {
  return (raw ?? "").trim()
}

/** Trim + lowercase for comparisons and deduplication. */
export function normalizeVendorEmailKey(raw: string | null | undefined): string {
  return trimVendorEmail(raw).toLowerCase()
}

export function isPlausibleVendorEmail(email: string | null | undefined): boolean {
  const t = trimVendorEmail(email)
  if (t.length < 5) return false
  return EMAIL_FORMAT.test(t)
}

/**
 * Email address used for vendor dashboard login, booking notifications, and reminders.
 * Always reads `trucks.email` — never booking_email or application data.
 */
export function resolveCanonicalVendorNotificationEmail(
  truck: TruckEmailFields | null | undefined
): string | null {
  const email = trimVendorEmail(truck?.email)
  if (!email) return null
  return email
}

/** Normalized address passed to Resend (trim + lowercase). Does not alter truck records. */
export function normalizeVendorEmailForSend(raw: string | null | undefined): string | null {
  const key = normalizeVendorEmailKey(raw)
  if (!key || !isPlausibleVendorEmail(key)) return null
  return key
}

export function emailsMatchForVendor(
  a: string | null | undefined,
  b: string | null | undefined
): boolean {
  const ka = normalizeVendorEmailKey(a)
  const kb = normalizeVendorEmailKey(b)
  if (!ka || !kb) return false
  return ka === kb
}

/** True when opportunity notification_email is a historical send audit (do not overwrite). */
export function isHistoricalNotificationEmailRecord(opts: {
  notification_status?: string | null
  notification_sent_at?: string | null
  resend_email_id?: string | null
  delivered_at?: string | null
  bounced_at?: string | null
  complained_at?: string | null
}): boolean {
  if (opts.notification_sent_at) return true
  if (opts.resend_email_id) return true
  if (opts.delivered_at || opts.bounced_at || opts.complained_at) return true
  const s = (opts.notification_status ?? "").toLowerCase()
  return s === "sent" || s === "delivered" || s === "bounced" || s === "complained"
}

export type VendorEmailConsistencyWarning =
  | "missing_canonical_email"
  | "malformed_canonical_email"
  | "notification_email_mismatch"
  | "application_email_mismatch"
  | "duplicate_truck_email"
  | "booking_email_differs"

export type VendorEmailConsistencyCheck = {
  canonicalEmail: string | null
  canonicalEmailNormalized: string | null
  warnings: VendorEmailConsistencyWarning[]
  warningMessages: string[]
}

export function checkVendorEmailConsistency(opts: {
  truckEmail?: string | null
  bookingEmail?: string | null
  applicationEmail?: string | null
  notificationEmail?: string | null
  notificationIsHistorical?: boolean
  duplicateCanonicalEmail?: boolean
}): VendorEmailConsistencyCheck {
  const canonical = resolveCanonicalVendorNotificationEmail({ email: opts.truckEmail })
  const canonicalKey = canonical ? normalizeVendorEmailKey(canonical) : null
  const warnings: VendorEmailConsistencyWarning[] = []
  const warningMessages: string[] = []

  if (!canonical) {
    warnings.push("missing_canonical_email")
    warningMessages.push("No vendor email on the active truck profile (trucks.email).")
  } else if (!isPlausibleVendorEmail(canonical)) {
    warnings.push("malformed_canonical_email")
    warningMessages.push(`Truck profile email looks invalid: ${canonical}`)
  }

  if (opts.duplicateCanonicalEmail) {
    warnings.push("duplicate_truck_email")
    warningMessages.push("Another active truck record shares this email address.")
  }

  if (
    opts.applicationEmail &&
    canonical &&
    !emailsMatchForVendor(opts.applicationEmail, canonical)
  ) {
    warnings.push("application_email_mismatch")
    warningMessages.push(
      `Vendor application email (${trimVendorEmail(opts.applicationEmail)}) differs from active truck profile (${canonical}).`
    )
  }

  if (
    opts.bookingEmail &&
    canonical &&
    isPlausibleVendorEmail(opts.bookingEmail) &&
    !emailsMatchForVendor(opts.bookingEmail, canonical)
  ) {
    warnings.push("booking_email_differs")
    warningMessages.push(
      `Public booking contact (booking_email) differs from notification email (trucks.email). Notifications use trucks.email only.`
    )
  }

  if (
    opts.notificationEmail &&
    canonical &&
    !emailsMatchForVendor(opts.notificationEmail, canonical)
  ) {
    if (opts.notificationIsHistorical) {
      warnings.push("notification_email_mismatch")
      warningMessages.push(
        `Email sent for this opportunity (${trimVendorEmail(opts.notificationEmail)}) differs from current truck profile (${canonical}). Historical send record preserved.`
      )
    } else {
      warnings.push("notification_email_mismatch")
      warningMessages.push(
        `Stored notification email (${trimVendorEmail(opts.notificationEmail)}) differs from current truck profile (${canonical}). Future sends will use the truck profile.`
      )
    }
  }

  return {
    canonicalEmail: canonical,
    canonicalEmailNormalized: canonicalKey,
    warnings,
    warningMessages,
  }
}
