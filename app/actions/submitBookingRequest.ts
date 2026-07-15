"use server"

import { redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import { BOOKING_REQUEST_TYPE } from "@/lib/booking/booking-request-constants"
import { completeBookingRequest, type BookingRequestTypeValue } from "@/lib/booking/complete-booking-request"
import { validatePublicBookingRequestInput } from "@/lib/booking/validate-public-booking-request"

export type BookingRequestResult = {
  success: boolean
  error?: string
}

function isUuid(v: string): boolean {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(v)
}

function appendOptionalNote(base: string | null, label: string, value: string | null): string | null {
  const trimmed = (value ?? "").trim()
  if (!trimmed) return base
  const line = `${label}: ${trimmed}`
  return base?.trim() ? `${base.trim()}\n\n${line}` : line
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
  const trucksNeeded = formData.get("trucksNeeded") as string
  const venueName = formData.get("venueName") as string
  const streetAddress = formData.get("streetAddress") as string
  const city = formData.get("city") as string
  const state = formData.get("state") as string
  const zipCode = formData.get("zipCode") as string
  const contactName = formData.get("contactName") as string
  const contactEmail = formData.get("contactEmail") as string
  const contactPhone = formData.get("contactPhone") as string
  const budgetRange = formData.get("budgetRange") as string
  const additionalNotes = formData.get("additionalNotes") as string
  const powerAvailability = formData.get("powerAvailability") as string
  const parkingNotes = formData.get("parkingNotes") as string

  const cuisines = formData.getAll("cuisines") as string[]

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

  const validation = validatePublicBookingRequestInput({
    requestType,
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
    if (validation.error === "Missing required event details") {
      return {
        success: false,
        error: "Please fill in all required event details (type, date, times, guest count, trucks needed).",
      }
    }
    if (validation.error === "Invalid trucks needed") {
      return {
        success: false,
        error: "Please enter how many food trucks you need (at least 1).",
      }
    }
    if (validation.error === "Missing location") {
      return {
        success: false,
        error: "Please fill in the event location (address, city, zip code).",
      }
    }
    if (validation.error === "Missing contact info") {
      return {
        success: false,
        error: "Please fill in all contact information (name, email, phone).",
      }
    }
    if (validation.error === "Missing cuisines") {
      return {
        success: false,
        error: "Please select at least one cuisine preference.",
      }
    }
  }

  const trucksNeededNum = parseInt(trucksNeeded, 10)

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

  const allowedVendorTypes = new Set(["truck", "cart", "tent", "any"])
  const vendor_type =
    vendorTypeRaw && allowedVendorTypes.has(vendorTypeRaw) ? vendorTypeRaw : null

  let mergedNotes = additionalNotes?.trim() || null
  mergedNotes = appendOptionalNote(mergedNotes, "Power availability", powerAvailability)
  mergedNotes = appendOptionalNote(mergedNotes, "Parking / setup notes", parkingNotes)

  const insertData: Parameters<typeof completeBookingRequest>[1] = {
    event_type: eventType,
    event_date: eventDate,
    start_time: startTime,
    end_time: endTime,
    guest_count: parseInt(guestCount, 10),
    truck_count: trucksNeededNum,
    venue_name: venueName || null,
    street_address: streetAddress,
    city,
    state: state || "NC",
    zip_code: zipCode,
    cuisines: cuisines.length > 0 ? cuisines : null,
    dietary_requirements: null,
    budget_range: budgetRange || null,
    contact_name: contactName,
    contact_email: contactEmail,
    contact_phone: contactPhone,
    organization: null,
    additional_notes: mergedNotes,
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

  const locationLabel = [city?.trim(), state?.trim() || "NC"].filter(Boolean).join(", ")
  const params = new URLSearchParams({
    id: result.id,
    date: eventDate,
    location: locationLabel,
  })
  redirect(`/book-a-truck/success?${params.toString()}`)
}
