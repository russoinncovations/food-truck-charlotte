"use server"

import { revalidatePath } from "next/cache"
import { createAdminSupabaseClient } from "@/lib/supabase/admin"
import { verifyAdminKey } from "@/lib/admin/verify-admin-key"
import { normalizeBookingRowForAdmin } from "@/lib/admin/normalize-booking-row"
import type { BookingInsertRow } from "@/lib/booking/complete-booking-request"
import { sendBookingNotificationForOpportunity } from "@/lib/email/booking-opportunity-notification"
import {
  isHistoricalNotificationEmailRecord,
  normalizeVendorEmailForSend,
  resolveCanonicalVendorNotificationEmail,
} from "@/lib/trucks/canonical-vendor-email"

function bookingRowFromRequest(row: Record<string, unknown>): BookingInsertRow {
  const normalized = normalizeBookingRowForAdmin(row)
  return {
    event_type: normalized.event_type,
    event_date: normalized.event_date,
    start_time: normalized.event_start_time ?? "",
    end_time: normalized.event_end_time ?? "",
    guest_count: normalized.expected_guests,
    venue_name: normalized.venue_name ?? null,
    street_address: normalized.venue_address,
    city: normalized.venue_city,
    state: normalized.venue_state,
    zip_code: normalized.venue_zip ?? "",
    cuisines: normalized.cuisine_preferences?.length ? normalized.cuisine_preferences : null,
    dietary_requirements: normalized.dietary_requirements?.length ? normalized.dietary_requirements : null,
    budget_range: normalized.budget_range ?? null,
    contact_name: normalized.contact_name,
    contact_email: normalized.contact_email,
    contact_phone: normalized.contact_phone ?? "",
    organization: normalized.organization_name ?? null,
    additional_notes: normalized.additional_notes ?? null,
    status: normalized.status,
    request_type: normalized.request_type ?? "open_request",
    truck_id: normalized.truck_id ?? null,
    vendor_type: normalized.vendor_type ?? null,
    preferred_trucks: normalized.preferred_trucks ?? null,
    how_heard_about_us: normalized.how_heard_about_us ?? null,
  }
}

export async function sendBookingNotificationNow(formData: FormData): Promise<{ ok: boolean; error?: string }> {
  if (!verifyAdminKey(formData.get("adminKey") as string | null)) {
    return { ok: false, error: "Unauthorized" }
  }

  const opportunityId = String(formData.get("opportunityId") ?? "").trim()
  const bookingId = String(formData.get("bookingId") ?? "").trim()
  if (!opportunityId || !bookingId) {
    return { ok: false, error: "Missing opportunity or booking id" }
  }

  const admin = createAdminSupabaseClient()
  if (!admin) {
    return { ok: false, error: "SUPABASE_SERVICE_ROLE_KEY is required" }
  }

  const { data: opp, error: oppErr } = await admin
    .from("truck_opportunities")
    .select("id, truck_id, booking_request_id")
    .eq("id", opportunityId)
    .maybeSingle()

  if (oppErr || !opp) {
    return { ok: false, error: oppErr?.message ?? "Opportunity not found" }
  }
  if (String(opp.booking_request_id) !== bookingId) {
    return { ok: false, error: "Opportunity does not belong to this booking" }
  }

  const { data: bookingRow, error: bookingErr } = await admin
    .from("booking_requests")
    .select("*")
    .eq("id", bookingId)
    .maybeSingle()

  if (bookingErr || !bookingRow) {
    return { ok: false, error: bookingErr?.message ?? "Booking not found" }
  }

  const { data: truck, error: truckErr } = await admin
    .from("trucks")
    .select("id, name, email")
    .eq("id", opp.truck_id)
    .maybeSingle()

  if (truckErr || !truck) {
    return { ok: false, error: truckErr?.message ?? "Truck not found" }
  }

  const result = await sendBookingNotificationForOpportunity(
    admin,
    bookingRowFromRequest(bookingRow as Record<string, unknown>),
    { id: String(opp.id), truck_id: String(opp.truck_id) },
    {
      id: String(truck.id),
      name: String(truck.name ?? "").trim() || "your truck",
      email: resolveCanonicalVendorNotificationEmail(truck),
    },
    bookingId
  )

  revalidatePath(`/admin/bookings/${bookingId}`)
  revalidatePath("/admin/bookings")

  if (!result.ok) {
    return { ok: false, error: result.error }
  }
  return { ok: true }
}

/**
 * Aligns an unsent opportunity with trucks.email for future sends.
 * Does not send email and never overwrites historical delivery records.
 */
export async function syncOpportunityNotificationEmailFromTruck(
  formData: FormData
): Promise<{ ok: boolean; error?: string; canonicalEmail?: string }> {
  if (!verifyAdminKey(formData.get("adminKey") as string | null)) {
    return { ok: false, error: "Unauthorized" }
  }

  const opportunityId = String(formData.get("opportunityId") ?? "").trim()
  const bookingId = String(formData.get("bookingId") ?? "").trim()
  if (!opportunityId || !bookingId) {
    return { ok: false, error: "Missing opportunity or booking id" }
  }

  const admin = createAdminSupabaseClient()
  if (!admin) {
    return { ok: false, error: "SUPABASE_SERVICE_ROLE_KEY is required" }
  }

  const { data: opp, error: oppErr } = await admin
    .from("truck_opportunities")
    .select(
      "id, truck_id, booking_request_id, notification_status, notification_email, notification_sent_at, resend_email_id, delivered_at, bounced_at, complained_at"
    )
    .eq("id", opportunityId)
    .maybeSingle()

  if (oppErr || !opp) {
    return { ok: false, error: oppErr?.message ?? "Opportunity not found" }
  }
  if (String(opp.booking_request_id) !== bookingId) {
    return { ok: false, error: "Opportunity does not belong to this booking" }
  }

  if (
    isHistoricalNotificationEmailRecord({
      notification_status: opp.notification_status as string | null,
      notification_sent_at: opp.notification_sent_at as string | null,
      resend_email_id: opp.resend_email_id as string | null,
      delivered_at: opp.delivered_at as string | null,
      bounced_at: opp.bounced_at as string | null,
      complained_at: opp.complained_at as string | null,
    })
  ) {
    return {
      ok: false,
      error: "This opportunity has a delivery audit record; notification email cannot be changed.",
    }
  }

  const { data: truck, error: truckErr } = await admin
    .from("trucks")
    .select("id, email")
    .eq("id", opp.truck_id)
    .maybeSingle()

  if (truckErr || !truck) {
    return { ok: false, error: truckErr?.message ?? "Truck not found" }
  }

  const canonical = normalizeVendorEmailForSend(resolveCanonicalVendorNotificationEmail(truck))
  if (!canonical) {
    return { ok: false, error: "Active truck profile has no valid email on trucks.email" }
  }

  const { error: updateErr } = await admin
    .from("truck_opportunities")
    .update({
      notification_email: null,
      notification_error: null,
    })
    .eq("id", opportunityId)

  if (updateErr) {
    return { ok: false, error: updateErr.message }
  }

  revalidatePath(`/admin/bookings/${bookingId}`)
  revalidatePath("/admin/bookings")

  return { ok: true, canonicalEmail: canonical }
}
