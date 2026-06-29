import { VENDOR_OPPORTUNITY_RESPONSE_STATUSES } from "@/lib/booking/opportunity-delivery-reliability"
import { bookingOpportunityExpiresAt } from "@/lib/booking/opportunity-expiration"

export type OpportunityBackfillRow = {
  id: string
  status: string
  expires_at: string | null
  event_date: string | null
  start_time?: string | null
  end_time?: string | null
}

export type OpportunityBackfillPatch = {
  expires_at?: string
  status?: typeof VENDOR_OPPORTUNITY_RESPONSE_STATUSES.EXPIRED
}

const NON_PENDING_STATUSES = new Set([
  VENDOR_OPPORTUNITY_RESPONSE_STATUSES.INTERESTED,
  VENDOR_OPPORTUNITY_RESPONSE_STATUSES.UNAVAILABLE,
  VENDOR_OPPORTUNITY_RESPONSE_STATUSES.CONTACTED,
  VENDOR_OPPORTUNITY_RESPONSE_STATUSES.EXPIRED,
  "pass",
  "fulfilled",
  "closed",
  "cancelled",
  "completed",
])

/**
 * Idempotent backfill plan for historical rows with null expires_at.
 * Never changes non-pending opportunity status; only fills expires_at and marks pending rows expired when past due.
 */
export function planOpportunityExpirationBackfill(
  row: OpportunityBackfillRow,
  now = new Date()
): OpportunityBackfillPatch | null {
  const patch: OpportunityBackfillPatch = {}
  const status = String(row.status ?? "").trim().toLowerCase()

  if (!row.expires_at?.trim() && row.event_date?.trim()) {
    const computed = bookingOpportunityExpiresAt(row.event_date, row.end_time, row.start_time)
    if (computed) patch.expires_at = computed
  }

  const effectiveExpiresAt = row.expires_at?.trim() || patch.expires_at
  if (
    status === VENDOR_OPPORTUNITY_RESPONSE_STATUSES.PENDING &&
    effectiveExpiresAt &&
    new Date(effectiveExpiresAt).getTime() <= now.getTime()
  ) {
    patch.status = VENDOR_OPPORTUNITY_RESPONSE_STATUSES.EXPIRED
  }

  if (Object.keys(patch).length === 0) return null
  return patch
}

export function isNonPendingHistoricalOpportunityStatus(status: string | null | undefined): boolean {
  const s = String(status ?? "").trim().toLowerCase()
  return NON_PENDING_STATUSES.has(s)
}
