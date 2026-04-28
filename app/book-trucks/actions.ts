"use server"

import { createClient } from "@/lib/supabase/server"
import type { BookingFormData } from "@/lib/booking-types"
import { BOOKING_REQUEST_TYPE } from "@/lib/booking/booking-request-constants"
import { completeBookingRequest, type BookingRequestTypeValue } from "@/lib/booking/complete-booking-request"

export interface BookingResult {
  success: boolean
  bookingId?: string
  error?: string
}

function isUuid(v: string): boolean {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(v)
}

export async function submitBookingRequest(data: BookingFormData): Promise<BookingResult> {
  try {
    const supabase = await createClient()

    const rt = data.request_type
    if (
      rt !== BOOKING_REQUEST_TYPE.SPECIFIC_VENDOR &&
      rt !== BOOKING_REQUEST_TYPE.CUISINE_MATCH &&
      rt !== BOOKING_REQUEST_TYPE.OPEN_REQUEST
    ) {
      return { success: false, error: "Invalid request type." }
    }
    const requestType = rt as BookingRequestTypeValue

    let truck_id: string | null = null
    let preferred_trucks: string | null = null

    if (requestType === BOOKING_REQUEST_TYPE.SPECIFIC_VENDOR) {
      const tid = (data.truck_id ?? "").trim()
      if (!tid || !isUuid(tid)) {
        return { success: false, error: "Please select a food truck." }
      }
      const { data: trow, error: terr } = await supabase
        .from("trucks")
        .select("id, name")
        .eq("id", tid)
        .eq("show_in_directory", true)
        .maybeSingle()

      if (terr || !trow) {
        return {
          success: false,
          error: "That truck is not available for requests. Choose another or a different request type.",
        }
      }
      truck_id = tid
      preferred_trucks = (trow.name as string) ?? null
    }

    if (
      requestType === BOOKING_REQUEST_TYPE.CUISINE_MATCH &&
      (!data.cuisine_preferences || data.cuisine_preferences.length === 0)
    ) {
      return {
        success: false,
        error: "Select at least one cuisine for a cuisine-based request.",
      }
    }

    const allowedVendorTypes = new Set(["truck", "cart", "tent", "any"])
    const vt = (data.vendor_type ?? "").trim()
    const vendor_type =
      requestType === BOOKING_REQUEST_TYPE.CUISINE_MATCH ||
      requestType === BOOKING_REQUEST_TYPE.OPEN_REQUEST
        ? vt && allowedVendorTypes.has(vt)
          ? vt
          : null
        : null

    const insertData = {
      event_type: data.event_type,
      event_date: data.event_date,
      start_time: data.event_start_time,
      end_time: data.event_end_time,
      guest_count: data.expected_guests,
      venue_name: data.venue_name || null,
      street_address: data.venue_address,
      city: data.venue_city || "Charlotte",
      state: data.venue_state || "NC",
      zip_code: data.venue_zip || "",
      cuisines: data.cuisine_preferences.length > 0 ? data.cuisine_preferences : null,
      dietary_requirements: data.dietary_requirements.length > 0 ? data.dietary_requirements : null,
      budget_range: data.budget_range || null,
      contact_name: data.contact_name,
      contact_email: data.contact_email,
      contact_phone: data.contact_phone || "",
      organization: data.organization_name || null,
      additional_notes: data.additional_notes || null,
      how_heard_about_us: data.how_heard_about_us || null,
      status: "new",
      request_type: requestType,
      truck_id,
      vendor_type,
      preferred_trucks,
    }

    const result = await completeBookingRequest(supabase, insertData)

    if (!result.ok) {
      return { success: false, error: result.error }
    }

    return { success: true, bookingId: result.id }
  } catch (err) {
    console.error("[v0] Unexpected booking error:", err)
    return {
      success: false,
      error: "Something went wrong. Please try again or contact us directly.",
    }
  }
}
