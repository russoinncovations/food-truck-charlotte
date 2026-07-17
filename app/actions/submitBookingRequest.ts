"use server"

import { redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import { BOOKING_REQUEST_TYPE } from "@/lib/booking/booking-request-constants"
import { completeBookingRequest, type BookingRequestTypeValue } from "@/lib/booking/complete-booking-request"
import { validatePublicBookingRequestInput } from "@/lib/booking/validate-public-booking-request"

export type BookingRequestResult = {
  success: boolean
  error?: string
  /** Form field name to highlight / focus when validation fails. */
  field?: string
}

function isUuid(v: string): boolean {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(v)
}

function str(formData: FormData, key: string): string {
  const v = formData.get(key)
  return typeof v === "string" ? v.trim() : ""
}

export async function submitBookingRequest(
  _prevState: BookingRequestResult | null,
  formData: FormData
): Promise<BookingRequestResult> {
  const supabase = await createClient()

  const eventType = str(formData, "eventType")
  const eventDate = str(formData, "eventDate")
  const startTime = str(formData, "startTime")
  const endTime = str(formData, "endTime")
  const guestCount = str(formData, "guestCount")
  const trucksNeeded = str(formData, "trucksNeeded")
  const venueName = str(formData, "venueName")
  const streetAddress = str(formData, "streetAddress")
  const city = str(formData, "city")
  const state = str(formData, "state")
  const zipCode = str(formData, "zipCode")
  const contactName = str(formData, "contactName")
  const contactEmail = str(formData, "contactEmail")
  const contactPhone = str(formData, "contactPhone")
  const organization = str(formData, "organization")
  const budgetRange = str(formData, "budgetRange")
  const additionalNotes = str(formData, "additionalNotes")

  const cuisines = formData.getAll("cuisines").map(String).filter(Boolean)
  const dietaryRequirements = formData.getAll("dietaryRequirements").map(String).filter(Boolean)

  const requestTypeRaw = str(formData, "requestType")
  const truckIdRaw = str(formData, "truckId")
  const vendorTypeRaw = str(formData, "vendorType")

  const validation = validatePublicBookingRequestInput({
    requestType: requestTypeRaw,
    truckId: truckIdRaw,
    eventType,
    eventDate,
    startTime,
    endTime,
    guestCount,
    trucksNeeded,
    streetAddress,
    city,
    zipCode,
    contactName,
    contactEmail,
    contactPhone,
    cuisines,
  })

  if (!validation.ok) {
    return {
      success: false,
      error: validation.error,
      field: validation.field,
    }
  }

  const requestType = requestTypeRaw as BookingRequestTypeValue
  const trucksNeededNum = parseInt(trucksNeeded, 10)
  const guestCountNum = parseInt(guestCount, 10)

  let truck_id: string | null = null
  let preferred_trucks: string | null = null

  if (requestType === BOOKING_REQUEST_TYPE.SPECIFIC_VENDOR) {
    if (!truckIdRaw || !isUuid(truckIdRaw)) {
      return {
        success: false,
        error: "Please select a food truck from the list.",
        field: "truckId",
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
        field: "truckId",
      }
    }
    truck_id = truckIdRaw
    preferred_trucks = (trow.name as string) ?? null
  }

  const allowedVendorTypes = new Set(["truck", "cart", "tent", "any"])
  const vendor_type =
    vendorTypeRaw && allowedVendorTypes.has(vendorTypeRaw) ? vendorTypeRaw : null

  const insertData: Parameters<typeof completeBookingRequest>[1] = {
    event_type: eventType,
    event_date: eventDate,
    start_time: startTime,
    end_time: endTime,
    guest_count: guestCountNum,
    truck_count: trucksNeededNum,
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
