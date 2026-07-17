import assert from "node:assert/strict"
import test from "node:test"
import { BOOKING_REQUEST_TYPE } from "@/lib/booking/booking-request-constants"
import {
  bookingInsertRowHasTruckCount,
  buildPublicBookingRequestInsertRow,
  mergeTrucksNeededIntoNotes,
} from "@/lib/booking/build-public-booking-request-row"

test("mergeTrucksNeededIntoNotes appends when notes empty", () => {
  assert.equal(mergeTrucksNeededIntoNotes(null, 2), "Trucks needed: 2")
  assert.equal(mergeTrucksNeededIntoNotes("", 1), "Trucks needed: 1")
})

test("mergeTrucksNeededIntoNotes preserves existing notes", () => {
  assert.equal(
    mergeTrucksNeededIntoNotes("Need vegetarian options", 3),
    "Need vegetarian options\n\nTrucks needed: 3"
  )
})

test("buildPublicBookingRequestInsertRow does not include truck_count", () => {
  const row = buildPublicBookingRequestInsertRow({
    eventType: "corporate",
    eventDate: "2026-08-01",
    startTime: "11:00",
    endTime: "14:00",
    guestCount: 100,
    trucksNeeded: 2,
    venueName: null,
    streetAddress: "100 N Tryon St",
    city: "Charlotte",
    state: "NC",
    zipCode: "28202",
    cuisines: null,
    dietaryRequirements: null,
    budgetRange: null,
    contactName: "Organizer",
    contactEmail: "a@example.com",
    contactPhone: "704-555-0100",
    organization: null,
    additionalNotes: "Hello",
    requestType: BOOKING_REQUEST_TYPE.OPEN_REQUEST,
    truckId: null,
    vendorType: "any",
    preferredTrucks: null,
  })

  const asRecord = row as unknown as Record<string, unknown>
  assert.equal(bookingInsertRowHasTruckCount(asRecord), false)
  assert.equal("truck_count" in asRecord, false)
  assert.equal(asRecord.additional_notes, "Hello\n\nTrucks needed: 2")
  assert.equal(asRecord.guest_count, 100)
  assert.equal(asRecord.request_type, BOOKING_REQUEST_TYPE.OPEN_REQUEST)
})
