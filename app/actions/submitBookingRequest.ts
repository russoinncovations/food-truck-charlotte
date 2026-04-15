"use server"

import { redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"

export type BookingRequestResult = {
  success: boolean
  error?: string
}

export async function submitBookingRequest(
  _prevState: BookingRequestResult | null,
  formData: FormData
): Promise<BookingRequestResult> {
  const supabase = await createClient()

  // Extract form data
  const eventType = formData.get("eventType") as string
  const eventDate = formData.get("eventDate") as string
  const startTime = formData.get("startTime") as string
  const endTime = formData.get("endTime") as string
  const guestCount = formData.get("guestCount") as string
  const venueName = formData.get("venueName") as string
  const streetAddress = formData.get("streetAddress") as string
  const city = formData.get("city") as string
  const state = formData.get("state") as string
  const zipCode = formData.get("zipCode") as string
  const contactName = formData.get("contactName") as string
  const contactEmail = formData.get("contactEmail") as string
  const contactPhone = formData.get("contactPhone") as string
  const organization = formData.get("organization") as string
  const budgetRange = formData.get("budgetRange") as string
  const additionalNotes = formData.get("additionalNotes") as string

  // Get arrays from checkboxes
  const cuisines = formData.getAll("cuisines") as string[]
  const dietaryRequirements = formData.getAll("dietaryRequirements") as string[]

  // Log what we're about to insert
  console.log("[v0] Attempting booking request insert:", {
    event_type: eventType,
    event_date: eventDate,
    contact_name: contactName,
    contact_email: contactEmail,
  })

  // Validate required fields
  if (!eventType || !eventDate || !startTime || !endTime || !guestCount) {
    console.log("[v0] Validation failed - missing event details")
    return {
      success: false,
      error: "Please fill in all event details (type, date, time, guest count).",
    }
  }

  if (!streetAddress || !city || !zipCode) {
    console.log("[v0] Validation failed - missing location details")
    return {
      success: false,
      error: "Please fill in the event location (address, city, zip code).",
    }
  }

  if (!contactName || !contactEmail || !contactPhone) {
    console.log("[v0] Validation failed - missing contact details")
    return {
      success: false,
      error: "Please fill in all contact information (name, email, phone).",
    }
  }

  // Insert into database
  const insertData = {
    event_type: eventType,
    event_date: eventDate,
    start_time: startTime,
    end_time: endTime,
    guest_count: parseInt(guestCount),
    venue_name: venueName || null,
    street_address: streetAddress,
    city,
    state: state || "NC",
    zip_code: zipCode,
    cuisines: cuisines.length > 0 ? cuisines : null,
    dietary_requirements: dietaryRequirements.length > 0 ? dietaryRequirements : null,
    budget_range: budgetRange || null,
    contact_name: contactName,
    contact_email: contactEmail,
    contact_phone: contactPhone,
    organization: organization || null,
    additional_notes: additionalNotes || null,
    status: "new",
  }

  console.log("[v0] Insert data:", JSON.stringify(insertData, null, 2))

  const { data, error } = await supabase
    .from("booking_requests")
    .insert(insertData)
    .select()
    .single()

  if (error) {
    console.error("[v0] Supabase insert error:", {
      message: error.message,
      code: error.code,
      details: error.details,
      hint: error.hint,
    })
    return {
      success: false,
      error: `Database error: ${error.message}. Code: ${error.code}`,
    }
  }

  console.log("[v0] Insert successful, row id:", data?.id)

  // Only redirect on confirmed success
  redirect("/book-a-truck/success")
}
