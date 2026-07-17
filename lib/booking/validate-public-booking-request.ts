import { BOOKING_REQUEST_TYPE } from "@/lib/booking/booking-request-constants"

export type PublicBookingRequestInput = {
  requestType: string
  truckId: string
  eventType: string
  eventDate: string
  startTime: string
  endTime: string
  guestCount: string
  trucksNeeded: string
  streetAddress: string
  city: string
  zipCode: string
  contactName: string
  contactEmail: string
  contactPhone: string
  cuisines: string[]
}

export type PublicBookingValidationFailure = {
  ok: false
  error: string
  /** Form field `name` / focus target id suffix (field-{name} or element id). */
  field: string
}

export type PublicBookingValidationResult = { ok: true } | PublicBookingValidationFailure

function missing(field: string, label: string): PublicBookingValidationFailure {
  return { ok: false, field, error: `${label} is required.` }
}

export function validatePublicBookingRequestInput(
  input: PublicBookingRequestInput
): PublicBookingValidationResult {
  if (
    input.requestType !== BOOKING_REQUEST_TYPE.SPECIFIC_VENDOR &&
    input.requestType !== BOOKING_REQUEST_TYPE.CUISINE_MATCH &&
    input.requestType !== BOOKING_REQUEST_TYPE.OPEN_REQUEST
  ) {
    return {
      ok: false,
      field: "requestType",
      error: "Please choose what you are looking for (specific vendor, cuisine, or open request).",
    }
  }

  if (!input.eventType?.trim()) return missing("eventType", "Event type")
  if (!input.eventDate?.trim()) return missing("eventDate", "Event date")
  if (!input.startTime?.trim()) return missing("startTime", "Start time")
  if (!input.endTime?.trim()) return missing("endTime", "End time")

  const guestCount = (input.guestCount ?? "").trim()
  if (!guestCount) return missing("guestCount", "Expected guest count")
  const guestCountNum = parseInt(guestCount, 10)
  if (!Number.isFinite(guestCountNum) || guestCountNum < 1) {
    return {
      ok: false,
      field: "guestCount",
      error: "Expected guest count must be at least 1.",
    }
  }

  const trucksNeeded = (input.trucksNeeded ?? "").trim()
  if (!trucksNeeded) return missing("trucksNeeded", "Number of trucks needed")
  const trucksNeededNum = parseInt(trucksNeeded, 10)
  if (!Number.isFinite(trucksNeededNum) || trucksNeededNum < 1) {
    return {
      ok: false,
      field: "trucksNeeded",
      error: "Number of trucks needed must be at least 1.",
    }
  }

  if (!input.streetAddress?.trim()) return missing("streetAddress", "Street address")
  if (!input.city?.trim()) return missing("city", "City")
  if (!input.zipCode?.trim()) return missing("zipCode", "Zip code")

  if (!input.contactName?.trim()) return missing("contactName", "Your name")
  if (!input.contactEmail?.trim()) return missing("contactEmail", "Email")
  if (!input.contactPhone?.trim()) return missing("contactPhone", "Phone")

  if (input.requestType === BOOKING_REQUEST_TYPE.SPECIFIC_VENDOR && !input.truckId?.trim()) {
    return {
      ok: false,
      field: "truckId",
      error: "Please select a food truck from the list.",
    }
  }

  if (input.requestType === BOOKING_REQUEST_TYPE.CUISINE_MATCH && input.cuisines.length === 0) {
    return {
      ok: false,
      field: "cuisines",
      error: "Please select at least one cuisine for a cuisine-based request.",
    }
  }

  return { ok: true }
}

export function canUpdatePendingOpportunityStatus(currentStatus: string): boolean {
  return currentStatus.toLowerCase() === "pending"
}
