import type { SupabaseClient } from "@supabase/supabase-js"
import { isBookingActiveForVendorOpportunities } from "@/lib/booking/booking-request-status"

/**
 * Count of pending truck_opportunities whose linked booking is still active for vendors.
 * Matches the “Requests to confirm” active list on /dashboard.
 */
export async function countVendorActivePendingBookingOpportunities(
  supabase: SupabaseClient,
  truckId: string
): Promise<number> {
  const { data, error } = await supabase
    .from("truck_opportunities")
    .select("id, booking_requests(status)")
    .eq("truck_id", truckId)
    .eq("status", "pending")
    .limit(80)

  if (error) {
    console.error("[dashboard] pending opportunities count:", error)
    return 0
  }

  let n = 0
  for (const row of data ?? []) {
    const embed = (row as { booking_requests?: unknown }).booking_requests
    const br = Array.isArray(embed) ? embed[0] : embed
    const st =
      br && typeof br === "object" && "status" in br
        ? String((br as { status?: string }).status ?? "")
        : ""
    if (isBookingActiveForVendorOpportunities(st)) n += 1
  }
  return n
}
