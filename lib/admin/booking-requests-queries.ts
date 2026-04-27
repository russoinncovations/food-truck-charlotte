"use server"

import { createClient } from "@/lib/supabase/server"
import { createAdminSupabaseClient } from "@/lib/supabase/admin"

export async function deleteBookingRequest(
  bookingId: string,
  adminKey: string
): Promise<{ ok: boolean; error?: string }> {
  const expected = process.env.ADMIN_KEY ?? "7985"
  if (adminKey !== expected) {
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
