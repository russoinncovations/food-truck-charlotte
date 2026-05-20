import { createAdminSupabaseClient } from "@/lib/supabase/admin"
import { createClient } from "@/lib/supabase/server"

export type BookingOpportunityMetrics = {
  interestedCount: number
  totalOpportunities: number
  /** True if at least one opportunity is not still pending (interested, not available, or legacy pass). */
  hasVendorResponse: boolean
}

function isRespondedOpportunityStatus(status: string): boolean {
  const s = status.toLowerCase()
  return s === "interested" || s === "not_available" || s === "pass"
}

/**
 * Per-booking opportunity stats for admin list filters and columns.
 */
export async function fetchBookingOpportunityMetricsByBookingId(
  bookingIds: string[]
): Promise<Map<string, BookingOpportunityMetrics>> {
  const out = new Map<string, BookingOpportunityMetrics>()
  const ids = [...new Set(bookingIds.map((id) => id.trim()).filter(Boolean))]
  if (ids.length === 0) return out

  const admin = createAdminSupabaseClient()
  const db = admin ?? (await createClient())

  const { data, error } = await db
    .from("truck_opportunities")
    .select("booking_request_id, status")
    .in("booking_request_id", ids)

  if (error) {
    console.error("[admin] opportunity metrics:", error)
    return out
  }

  const agg = new Map<string, { total: number; interested: number; responded: boolean }>()
  for (const bid of ids) {
    agg.set(bid, { total: 0, interested: 0, responded: false })
  }

  for (const row of data ?? []) {
    const bid = row.booking_request_id as string | null
    if (!bid) continue
    const cur = agg.get(bid) ?? { total: 0, interested: 0, responded: false }
    cur.total += 1
    const st = String(row.status ?? "")
    if (st.toLowerCase() === "interested") cur.interested += 1
    if (isRespondedOpportunityStatus(st)) cur.responded = true
    agg.set(bid, cur)
  }

  for (const bid of ids) {
    const a = agg.get(bid) ?? { total: 0, interested: 0, responded: false }
    out.set(bid, {
      interestedCount: a.interested,
      totalOpportunities: a.total,
      hasVendorResponse: a.responded,
    })
  }
  return out
}

/**
 * Count of vendors who marked I'm interested per booking (for admin list).
 * @deprecated Prefer fetchBookingOpportunityMetricsByBookingId — kept for narrow imports if needed.
 */
export async function fetchInterestedVendorCountByBookingId(
  bookingIds: string[]
): Promise<Map<string, number>> {
  const metrics = await fetchBookingOpportunityMetricsByBookingId(bookingIds)
  return new Map([...metrics.entries()].map(([id, m]) => [id, m.interestedCount]))
}
