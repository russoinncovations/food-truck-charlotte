"use server"

import { createClient } from "@/lib/supabase/server"
import type { BookingFormData } from "@/lib/booking-types"

export interface BookingResult {
  success: boolean
  bookingId?: string
  error?: string
}

export async function submitBookingRequest(data: BookingFormData): Promise<BookingResult> {
  try {
    const supabase = await createClient()
    
    const { data: booking, error } = await supabase
      .from("booking_requests")
      .insert({
        contact_name: data.contact_name,
        contact_email: data.contact_email,
        contact_phone: data.contact_phone || null,
        organization_name: data.organization_name || null,
        event_type: data.event_type,
        event_date: data.event_date,
        event_start_time: data.event_start_time || null,
        event_end_time: data.event_end_time || null,
        venue_name: data.venue_name || null,
        venue_address: data.venue_address,
        venue_city: data.venue_city || "Charlotte",
        venue_state: data.venue_state || "NC",
        venue_zip: data.venue_zip || null,
        expected_guests: data.expected_guests,
        budget_range: data.budget_range || null,
        cuisine_preferences: data.cuisine_preferences.length > 0 ? data.cuisine_preferences : null,
        specific_trucks: data.specific_trucks.length > 0 ? data.specific_trucks : null,
        dietary_requirements: data.dietary_requirements.length > 0 ? data.dietary_requirements : null,
        additional_notes: data.additional_notes || null,
        how_heard_about_us: data.how_heard_about_us || null,
        status: "new",
      })
      .select("id")
      .single()

    if (error) {
      console.error("[v0] Booking submission error:", error)
      return { success: false, error: error.message }
    }

    return { success: true, bookingId: booking.id }
  } catch (err) {
    console.error("[v0] Unexpected booking error:", err)
    return { 
      success: false, 
      error: "Something went wrong. Please try again or contact us directly." 
    }
  }
}
