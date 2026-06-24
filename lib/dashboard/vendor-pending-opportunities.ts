import type { SupabaseClient } from "@supabase/supabase-js"
import {
  filterActivePendingOpportunities,
  type TruckOpportunityRow,
  type VendorDashboardTruck,
} from "@/lib/dashboard/vendor-booking-opportunities"

/**
 * Count of pending truck_opportunities whose linked booking is still active for vendors.
 * Matches the “Requests to confirm” active list on /dashboard.
 */
export async function countVendorActivePendingBookingOpportunities(
  supabase: SupabaseClient,
  truck: VendorDashboardTruck
): Promise<number> {
  const { data, error } = await supabase
    .from("truck_opportunities")
    .select("*, booking_requests(status, additional_notes, contact_email, contact_name)")
    .eq("truck_id", truck.id)
    .ilike("status", "pending")
    .limit(200)

  if (error) {
    console.error("[dashboard] pending opportunities count:", error)
    return 0
  }

  return filterActivePendingOpportunities((data ?? []) as TruckOpportunityRow[], truck).length
}
