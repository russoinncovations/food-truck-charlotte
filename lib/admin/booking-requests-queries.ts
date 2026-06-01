"use server"

import { verifyAdminKey } from "@/lib/admin/verify-admin-key"
import { createClient } from "@/lib/supabase/server"
import { createAdminSupabaseClient } from "@/lib/supabase/admin"

export async function deleteBookingRequest(
  bookingId: string,
  adminKey: string
): Promise<{ ok: boolean; error?: string }> {
  if (!verifyAdminKey(adminKey)) {
    return { ok: false, error: "Unauthorized" }
  }

  const id = (bookingId ?? "").trim()
  if (!id) {
    return { ok: false, error: "Invalid booking id" }
  }

  const admin = createAdminSupabaseClient()
  const supabase = admin ?? (await createClient())

  const { error } = await supabase.from("booking_requests").delete().eq("id", id)

  if (error) {
    console.error("[admin] delete booking_requests:", error)
    return { ok: false, error: error.message }
  }

  return { ok: true }
}
