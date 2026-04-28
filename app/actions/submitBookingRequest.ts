"use server"

import { redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import { BOOKING_REQUEST_TYPE } from "@/lib/booking/booking-request-constants"
import { completeBookingRequest, type BookingRequestTypeValue } from "@/lib/booking/complete-booking-request"

export type BookingRequestResult = {
  success: boolean
  error?: string
}

function isUuid(v: string): boolean {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(v)
}

export async function submitBookingRequest(
  _prevState: BookingRequestResult | null,
  formData: FormData
): Promise<BookingRequestResult> {
  const supabase = await createClient()

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

  const cuisines = formData.getAll("cuisines") as string[]
  const dietaryRequirements = formData.getAll("dietaryRequirements") as string[]

  const requestTypeRaw = (formData.get("requestType") as string | null)?.trim() ?? ""
  const truckIdRaw = (formData.get("truckId") as string | null)?.trim() ?? ""
  const vendorTypeRaw = (formData.get("vendorType") as string | null)?.trim() ?? ""

  if (
    requestTypeRaw !== BOOKING_REQUEST_TYPE.SPECIFIC_VENDOR &&
    requestTypeRaw !== BOOKING_REQUEST_TYPE.CUISINE_MATCH &&
    requestTypeRaw !== BOOKING_REQUEST_TYPE.OPEN_REQUEST
  ) {
    return {
      success: false,
      error: "Please choose how you’d like to request trucks (specific vendor, cuisine, or open).",
    }
  }
  const requestType = requestTypeRaw as BookingRequestTypeValue

  if (!eventType || !eventDate || !startTime || !endTime || !guestCount) {
    return {
      success: false,
      error: "Please fill in all event details (type, date, time, guest count).",
    }
  }

  if (!streetAddress || !city || !zipCode) {
    return {
      success: false,
      error: "Please fill in the event location (address, city, zip code).",
    }
  }

  if (!contactName || !contactEmail || !contactPhone) {
    return {
      success: false,
      error: "Please fill in all contact information (name, email, phone).",
    }
  }

  let truck_id: string | null = null
  let preferred_trucks: string | null = null

  if (requestType === BOOKING_REQUEST_TYPE.SPECIFIC_VENDOR) {
    if (!truckIdRaw || !isUuid(truckIdRaw)) {
      return {
        success: false,
        error: "Please select a food truck from the list.",
      }
    }
    const { data: trow, error: terr } = await supabase
      .from("trucks")
      .select("id, name")
      .eq("id", truckIdRaw)
      .eq("show_in_directory", true)
      .maybeSingle()

    if (terr || !trow) {
      return {
        success: false,
        error: "That truck is not available for requests. Pick another or choose a different request type.",
      }
    }
    truck_id = truckIdRaw
    preferred_trucks = (trow.name as string) ?? null
  }

  if (requestType === BOOKING_REQUEST_TYPE.CUISINE_MATCH) {
    if (!cuisines || cuisines.length === 0) {
      return {
        success: false,
        error: "Please select at least one cuisine for a cuisine-based request.",
      }
    }
  }

  const allowedVendorTypes = new Set(["truck", "cart", "tent", "any"])
  const vendor_type =
    vendorTypeRaw && allowedVendorTypes.has(vendorTypeRaw) ? vendorTypeRaw : null

  const insertData: Parameters<typeof completeBookingRequest>[1] = {
    event_type: eventType,
    event_date: eventDate,
    start_time: startTime,
    end_time: endTime,
    guest_count: parseInt(guestCount, 10),
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
    request_type: requestType,
    truck_id,
    vendor_type:
      requestType === BOOKING_REQUEST_TYPE.CUISINE_MATCH ||
      requestType === BOOKING_REQUEST_TYPE.OPEN_REQUEST
        ? vendor_type
        : null,
    preferred_trucks,
  }

  const result = await completeBookingRequest(supabase, insertData)

  if (!result.ok) {
    return {
      success: false,
      error: `Database error: ${result.error}`,
    }
  }

  redirect("/book-a-truck/success")
}
