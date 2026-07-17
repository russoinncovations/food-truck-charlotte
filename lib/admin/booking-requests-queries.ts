"use server"

import { revalidatePath } from "next/cache"
import { verifyAdminKey } from "@/lib/admin/verify-admin-key"
import { createAdminSupabaseClient } from "@/lib/supabase/admin"

/**
 * Admin-only hard delete of a booking request.
 * Deletes dependent truck_opportunities first so FK constraints cannot block removal.
 */
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
  if (!admin) {
    return {
      ok: false,
      error: "SUPABASE_SERVICE_ROLE_KEY is required to delete booking requests",
    }
  }

  const { error: oppError } = await admin
    .from("truck_opportunities")
    .delete()
    .eq("booking_request_id", id)

  if (oppError) {
    console.error("[admin] delete truck_opportunities for booking:", oppError)
    return {
      ok: false,
      error: `Could not delete related vendor opportunities: ${oppError.message}`,
    }
  }

  const { data: deletedRows, error } = await admin
    .from("booking_requests")
    .delete()
    .eq("id", id)
    .select("id")

  if (error) {
    console.error("[admin] delete booking_requests:", error)
    return { ok: false, error: error.message }
  }

  if (!deletedRows?.length) {
    return {
      ok: false,
      error: "Booking request not found or already deleted",
    }
  }

  revalidatePath("/admin/bookings")
  revalidatePath(`/admin/bookings/${id}`)

  return { ok: true }
}
