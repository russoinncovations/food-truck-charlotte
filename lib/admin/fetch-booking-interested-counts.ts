import { createAdminSupabaseClient } from "@/lib/supabase/admin"
import { createClient } from "@/lib/supabase/server"

/**
 * Count of vendors who marked I'm interested per booking (for admin list).
 */
export async function fetchInterestedVendorCountByBookingId(
  bookingIds: string[]
): Promise<Map<string, number>> {
  const map = new Map<string, number>()
  const ids = [...new Set(bookingIds.map((id) => id.trim()).filter(Boolean))]
  if (ids.length === 0) return map

  const admin = createAdminSupabaseClient()
  const db = admin ?? (await createClient())

  const { data, error } = await db
    .from("truck_opportunities")
    .select("booking_request_id, status")
    .in("booking_request_id", ids)
    .eq("status", "interested")

  if (error) {
    console.error("[admin] interested counts:", error)
    return map
  }

  for (const row of data ?? []) {
    const bid = row.booking_request_id as string | null
    if (!bid) continue
    map.set(bid, (map.get(bid) ?? 0) + 1)
  }
  return map
}
