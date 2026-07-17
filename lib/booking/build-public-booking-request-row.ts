import type { BookingInsertRow } from "@/lib/booking/complete-booking-request"
import type { BookingRequestTypeValue } from "@/lib/booking/booking-request-constants"

/**
 * Merge validated trucks-needed into notes. Production `booking_requests` has no
 * `truck_count` column — do not persist that field.
 */
export function mergeTrucksNeededIntoNotes(
  additionalNotes: string | null | undefined,
  trucksNeeded: number
): string {
  const line = `Trucks needed: ${trucksNeeded}`
  const base = (additionalNotes ?? "").trim()
  return base ? `${base}\n\n${line}` : line
}

export type PublicBookingPersistInput = {
  eventType: string
  eventDate: string
  startTime: string
  endTime: string
  guestCount: number
  trucksNeeded: number
  venueName: string | null
  streetAddress: string
  city: string
  state: string
  zipCode: string
  cuisines: string[] | null
  dietaryRequirements: string[] | null
  budgetRange: string | null
  contactName: string
  contactEmail: string
  contactPhone: string
  organization: string | null
  additionalNotes: string | null
  requestType: BookingRequestTypeValue
  truckId: string | null
  vendorType: string | null
  preferredTrucks: string | null
}

/** Build the booking_requests insert row — never includes `truck_count`. */
export function buildPublicBookingRequestInsertRow(
  input: PublicBookingPersistInput
): BookingInsertRow {
  const row: BookingInsertRow = {
    event_type: input.eventType,
    event_date: input.eventDate,
    start_time: input.startTime,
    end_time: input.endTime,
    guest_count: input.guestCount,
    venue_name: input.venueName,
    street_address: input.streetAddress,
    city: input.city,
    state: input.state,
    zip_code: input.zipCode,
    cuisines: input.cuisines,
    dietary_requirements: input.dietaryRequirements,
    budget_range: input.budgetRange,
    contact_name: input.contactName,
    contact_email: input.contactEmail,
    contact_phone: input.contactPhone,
    organization: input.organization,
    additional_notes: mergeTrucksNeededIntoNotes(input.additionalNotes, input.trucksNeeded),
    status: "new",
    request_type: input.requestType,
    truck_id: input.truckId,
    vendor_type: input.vendorType,
    preferred_trucks: input.preferredTrucks,
  }

  return row
}

export function bookingInsertRowHasTruckCount(row: Record<string, unknown>): boolean {
  return Object.prototype.hasOwnProperty.call(row, "truck_count")
}
