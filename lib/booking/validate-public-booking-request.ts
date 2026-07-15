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

export function validatePublicBookingRequestInput(
  input: PublicBookingRequestInput
): { ok: true } | { ok: false; error: string } {
  if (
    input.requestType !== BOOKING_REQUEST_TYPE.SPECIFIC_VENDOR &&
    input.requestType !== BOOKING_REQUEST_TYPE.CUISINE_MATCH &&
    input.requestType !== BOOKING_REQUEST_TYPE.OPEN_REQUEST
  ) {
    return { ok: false, error: "Invalid request type" }
  }

  if (
    !input.eventType ||
    !input.eventDate ||
    !input.startTime ||
    !input.endTime ||
    !input.guestCount ||
    !input.trucksNeeded
  ) {
    return { ok: false, error: "Missing required event details" }
  }

  const trucksNeededNum = parseInt(input.trucksNeeded, 10)
  if (!Number.isFinite(trucksNeededNum) || trucksNeededNum < 1) {
    return { ok: false, error: "Invalid trucks needed" }
  }

  if (!input.streetAddress || !input.city || !input.zipCode) {
    return { ok: false, error: "Missing location" }
  }

  if (!input.contactName || !input.contactEmail || !input.contactPhone) {
    return { ok: false, error: "Missing contact info" }
  }

  if (input.requestType === BOOKING_REQUEST_TYPE.CUISINE_MATCH && input.cuisines.length === 0) {
    return { ok: false, error: "Missing cuisines" }
  }

  return { ok: true }
}

export function canUpdatePendingOpportunityStatus(currentStatus: string): boolean {
  return currentStatus.toLowerCase() === "pending"
}
