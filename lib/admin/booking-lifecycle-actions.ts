"use server"

import { revalidatePath } from "next/cache"
import { createAdminSupabaseClient } from "@/lib/supabase/admin"
import { createClient } from "@/lib/supabase/server"

function verifyAdminKey(key: string | null | undefined): boolean {
  const expected = process.env.ADMIN_KEY ?? "7985"
  return (key ?? "").trim() === expected
}

export type BookingLifecycleResult = { ok: true } | { ok: false; error: string }

export async function setBookingRequestLifecycleStatus(formData: FormData): Promise<BookingLifecycleResult> {
  if (!verifyAdminKey(formData.get("adminKey") as string | null)) {
    return { ok: false, error: "Unauthorized" }
  }

  const bookingId = ((formData.get("bookingId") as string | null) ?? "").trim()
  const status = ((formData.get("status") as string | null) ?? "").trim()

  if (!bookingId) {
    return { ok: false, error: "Missing booking id" }
  }

  const allowed = new Set(["fulfilled", "closed", "new"])
  if (!allowed.has(status)) {
    return { ok: false, error: "Invalid status" }
  }

  const admin = createAdminSupabaseClient()
  const db = admin ?? (await createClient())

  const { error } = await db.from("booking_requests").update({ status }).eq("id", bookingId)

  if (error) {
    console.error("[admin] setBookingRequestLifecycleStatus:", error)
    return { ok: false, error: error.message }
  }

  revalidatePath("/admin/bookings")
  revalidatePath(`/admin/bookings/${bookingId}`)
  revalidatePath("/dashboard")
  return { ok: true }
}
