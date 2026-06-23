"use server"

import { revalidatePath } from "next/cache"
import { isBookingActiveForVendorOpportunities } from "@/lib/booking/booking-request-status"
import { parseBookingEmbed, shouldShowBookingOnVendorDashboard } from "@/lib/dashboard/vendor-booking-opportunity-visibility"
import { resolveVendorTruckForDashboard } from "@/lib/dashboard/vendor-booking-opportunities"
import { createClient } from "@/lib/supabase/server"

export type OpportunityActionResult = {
  success: boolean
  error?: string
}

export async function updateTruckOpportunityStatus(
  formData: FormData
): Promise<OpportunityActionResult> {
  const opportunityId = formData.get("opportunityId") as string | null
  const rawStatus = formData.get("status") as string | null
  const status =
    rawStatus === "pass"
      ? "not_available"
      : rawStatus === "not_available" || rawStatus === "interested"
        ? rawStatus
        : null
  if (!opportunityId || !status) {
    return { success: false, error: "Invalid request" }
  }

  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user?.email) {
    return { success: false, error: "Unauthorized" }
  }

  const { truck } = await resolveVendorTruckForDashboard(supabase, user.email)

  if (!truck?.id) {
    return { success: false, error: "No truck profile" }
  }

  const { data: existing, error: readErr } = await supabase
    .from("truck_opportunities")
    .select("id, status, booking_requests(*)")
    .eq("id", opportunityId)
    .eq("truck_id", truck.id)
    .maybeSingle()

  if (readErr || !existing) {
    return { success: false, error: readErr?.message ?? "Opportunity not found" }
  }

  const curOppStatus = String((existing as { status?: string }).status ?? "").toLowerCase()
  if (curOppStatus !== "pending") {
    return { success: false, error: "This opportunity was already updated" }
  }

  const brRow = parseBookingEmbed((existing as { booking_requests?: unknown }).booking_requests)
  const bookingStatus = brRow?.status != null ? String(brRow.status) : ""

  if (!isBookingActiveForVendorOpportunities(bookingStatus)) {
    return { success: false, error: "This booking request is closed — responses are no longer accepted." }
  }

  if (!shouldShowBookingOnVendorDashboard(brRow, truck)) {
    return { success: false, error: "This opportunity is not available for your truck." }
  }

  const { data: updated, error: updateError } = await supabase
    .from("truck_opportunities")
    .update({
      status,
      responded_at: new Date().toISOString(),
    })
    .eq("id", opportunityId)
    .eq("truck_id", truck.id)
    .eq("status", "pending")
    .select("id")
    .maybeSingle()

  if (updateError) {
    return { success: false, error: updateError.message }
  }
  if (!updated) {
    return { success: false, error: "Opportunity not found or already updated" }
  }

  revalidatePath("/dashboard")
  revalidatePath("/dashboard/events")
  return { success: true }
}
