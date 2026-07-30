"use server"

import { redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import { BOOKING_REQUEST_TYPE } from "@/lib/booking/booking-request-constants"
import { completeBookingRequest, type BookingRequestTypeValue } from "@/lib/booking/complete-booking-request"
import { buildPublicBookingRequestInsertRow } from "@/lib/booking/build-public-booking-request-row"
import { validatePublicBookingRequestInput } from "@/lib/booking/validate-public-booking-request"
import { parseVendorNeedValue } from "@/lib/booking/vendor-need"

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
  const vendorNeedRaw = str(formData, "vendorNeed")

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
    vendorNeed: vendorNeedRaw,
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
  const vendorNeed =
    requestType === BOOKING_REQUEST_TYPE.SPECIFIC_VENDOR
      ? null
      : parseVendorNeedValue(vendorNeedRaw)
  if (requestType !== BOOKING_REQUEST_TYPE.SPECIFIC_VENDOR && !vendorNeed) {
    return {
      success: false,
      error: "Please choose what type of food truck or vendor you need.",
      field: "vendorNeed",
    }
  }

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

  // Production booking_requests has no truck_count column — persist trucks needed in notes only.
  const insertData = buildPublicBookingRequestInsertRow({
    eventType,
    eventDate,
    startTime,
    endTime,
    guestCount: guestCountNum,
    trucksNeeded: trucksNeededNum,
    venueName: venueName || null,
    streetAddress,
    city,
    state: state || "NC",
    zipCode,
    cuisines: cuisines.length > 0 ? cuisines : null,
    dietaryRequirements: dietaryRequirements.length > 0 ? dietaryRequirements : null,
    budgetRange: budgetRange || null,
    contactName,
    contactEmail,
    contactPhone,
    organization: organization || null,
    additionalNotes: additionalNotes || null,
    requestType,
    truckId: truck_id,
    vendorType:
      requestType === BOOKING_REQUEST_TYPE.CUISINE_MATCH ||
      requestType === BOOKING_REQUEST_TYPE.OPEN_REQUEST
        ? vendor_type
        : null,
    preferredTrucks: preferred_trucks,
    vendorNeed,
  })

  const result = await completeBookingRequest(supabase, insertData, { vendorNeed })

  if (!result.ok) {
    return {
      success: false,
      error: `Database error: ${result.error}`,
    }
  }

  redirect("/book-a-truck/success")
}
