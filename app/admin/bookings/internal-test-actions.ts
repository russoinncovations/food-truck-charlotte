"use server"

import { revalidatePath } from "next/cache"
import { createAdminSupabaseClient } from "@/lib/supabase/admin"
import { verifyAdminKey } from "@/lib/admin/verify-admin-key"
import { createInternalTestBookingRequest } from "@/lib/booking/create-internal-test-booking"

export async function createInternalTestBooking(formData: FormData): Promise<{
  ok: boolean
  error?: string
  bookingId?: string
}> {
  if (!verifyAdminKey(formData.get("adminKey") as string | null)) {
    return { ok: false, error: "Unauthorized" }
  }

  const adminDb = createAdminSupabaseClient()
  if (!adminDb) {
    return { ok: false, error: "SUPABASE_SERVICE_ROLE_KEY is required" }
  }

  const mode = String(formData.get("mode") ?? "specific").trim()
  const requestType = mode === "open" ? "open_request" : "specific_vendor"

  const result = await createInternalTestBookingRequest({
    adminDb,
    requestType,
  })

  if (!result.ok) {
    return { ok: false, error: result.error }
  }

  revalidatePath("/admin/bookings")
  revalidatePath(`/admin/bookings/${result.bookingId}`)

  return { ok: true, bookingId: result.bookingId }
}
