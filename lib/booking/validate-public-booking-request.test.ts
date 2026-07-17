import assert from "node:assert/strict"
import test from "node:test"
import { BOOKING_REQUEST_TYPE } from "@/lib/booking/booking-request-constants"
import {
  canUpdatePendingOpportunityStatus,
  validatePublicBookingRequestInput,
} from "@/lib/booking/validate-public-booking-request"

const baseInput = {
  requestType: BOOKING_REQUEST_TYPE.OPEN_REQUEST,
  truckId: "",
  eventType: "corporate",
  eventDate: "2026-08-01",
  startTime: "11:00",
  endTime: "14:00",
  guestCount: "100",
  trucksNeeded: "2",
  streetAddress: "100 N Tryon St",
  city: "Charlotte",
  zipCode: "28202",
  contactName: "Organizer Name",
  contactEmail: "organizer@example.com",
  contactPhone: "704-555-0100",
  cuisines: [] as string[],
}

test("validatePublicBookingRequestInput accepts required open request fields", () => {
  assert.deepEqual(validatePublicBookingRequestInput(baseInput), { ok: true })
})

test("validatePublicBookingRequestInput reports missing trucksNeeded with field", () => {
  const result = validatePublicBookingRequestInput({ ...baseInput, trucksNeeded: "" })
  assert.equal(result.ok, false)
  if (!result.ok) {
    assert.equal(result.field, "trucksNeeded")
    assert.match(result.error, /trucks needed/i)
  }
})

test("validatePublicBookingRequestInput reports missing event type with field", () => {
  const result = validatePublicBookingRequestInput({ ...baseInput, eventType: "" })
  assert.equal(result.ok, false)
  if (!result.ok) {
    assert.equal(result.field, "eventType")
  }
})

test("validatePublicBookingRequestInput requires request type", () => {
  const result = validatePublicBookingRequestInput({ ...baseInput, requestType: "" })
  assert.equal(result.ok, false)
  if (!result.ok) {
    assert.equal(result.field, "requestType")
  }
})

test("validatePublicBookingRequestInput requires cuisines for cuisine match requests", () => {
  const result = validatePublicBookingRequestInput({
    ...baseInput,
    requestType: BOOKING_REQUEST_TYPE.CUISINE_MATCH,
    cuisines: [],
  })
  assert.equal(result.ok, false)
  if (!result.ok) {
    assert.equal(result.field, "cuisines")
  }
})

test("validatePublicBookingRequestInput requires truck for specific vendor", () => {
  const result = validatePublicBookingRequestInput({
    ...baseInput,
    requestType: BOOKING_REQUEST_TYPE.SPECIFIC_VENDOR,
    truckId: "",
  })
  assert.equal(result.ok, false)
  if (!result.ok) {
    assert.equal(result.field, "truckId")
  }
})

test("canUpdatePendingOpportunityStatus blocks duplicate interested responses", () => {
  assert.equal(canUpdatePendingOpportunityStatus("pending"), true)
  assert.equal(canUpdatePendingOpportunityStatus("interested"), false)
  assert.equal(canUpdatePendingOpportunityStatus("not_available"), false)
})
