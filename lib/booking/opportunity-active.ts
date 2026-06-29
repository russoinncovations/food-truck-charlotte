import { isBookingActiveForVendorOpportunities } from "@/lib/booking/booking-request-status"
import { bookingOpportunityExpiresAt } from "@/lib/booking/opportunity-expiration"

export type OpportunityBookingTiming = {
  event_date?: string | null
  start_time?: string | null
  end_time?: string | null
  status?: string | null
}

export type OpportunityActiveInput = {
  status?: string | null
  expires_at?: string | null
  booking?: OpportunityBookingTiming | null
}

function normalizeBookingTiming(
  booking: OpportunityBookingTiming | Record<string, unknown> | null | undefined
): OpportunityBookingTiming | null {
  if (!booking || typeof booking !== "object") return null
  const r = booking as Record<string, unknown>
  return {
    event_date: (r.event_date as string | null | undefined) ?? null,
    start_time: ((r.start_time ?? r.event_start_time) as string | null | undefined) ?? null,
    end_time: ((r.end_time ?? r.event_end_time) as string | null | undefined) ?? null,
    status: (r.status as string | null | undefined) ?? null,
  }
}

/** Stored expires_at when present; otherwise derived from parent booking event timing (America/New_York). */
export function resolveEffectiveOpportunityExpiresAt(input: OpportunityActiveInput): string | null {
  if (input.expires_at?.trim()) return input.expires_at.trim()
  const booking = normalizeBookingTiming(input.booking)
  if (!booking?.event_date?.trim()) return null
  return bookingOpportunityExpiresAt(booking.event_date, booking.end_time, booking.start_time)
}

export function isOpportunityEffectivelyExpired(input: OpportunityActiveInput, now = new Date()): boolean {
  const effective = resolveEffectiveOpportunityExpiresAt(input)
  if (!effective) return false
  const expiresMs = new Date(effective).getTime()
  if (Number.isNaN(expiresMs)) return false
  return expiresMs <= now.getTime()
}

/**
 * Single rule for “still active and actionable” vendor opportunities:
 * pending status, not past effective expiry, and parent booking not in a terminal vendor status.
 */
export function isOpportunityActiveAndActionable(input: OpportunityActiveInput, now = new Date()): boolean {
  const status = String(input.status ?? "").trim().toLowerCase()
  if (status !== "pending") return false
  if (isOpportunityEffectivelyExpired(input, now)) return false
  const booking = normalizeBookingTiming(input.booking)
  if (booking?.status && !isBookingActiveForVendorOpportunities(booking.status)) return false
  return true
}
