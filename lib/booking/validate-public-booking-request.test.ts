import assert from "node:assert/strict"
import test from "node:test"
import { BOOKING_REQUEST_TYPE } from "@/lib/booking/booking-request-constants"
import {
  canUpdatePendingOpportunityStatus,
  validatePublicBookingRequestInput,
} from "@/lib/booking/validate-public-booking-request"
import { isOpportunityEffectivelyExpired } from "@/lib/booking/opportunity-active"

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

test("validatePublicBookingRequestInput requires trucks needed and contact fields", () => {
  assert.equal(validatePublicBookingRequestInput({ ...baseInput, trucksNeeded: "" }).ok, false)
  assert.equal(validatePublicBookingRequestInput({ ...baseInput, contactPhone: "" }).ok, false)
})

test("validatePublicBookingRequestInput requires cuisines for cuisine match requests", () => {
  const result = validatePublicBookingRequestInput({
    ...baseInput,
    requestType: BOOKING_REQUEST_TYPE.CUISINE_MATCH,
    cuisines: [],
  })
  assert.equal(result.ok, false)
})

test("canUpdatePendingOpportunityStatus blocks duplicate interested responses", () => {
  assert.equal(canUpdatePendingOpportunityStatus("pending"), true)
  assert.equal(canUpdatePendingOpportunityStatus("interested"), false)
  assert.equal(canUpdatePendingOpportunityStatus("not_available"), false)
})

test("expired opportunities cannot be answered", () => {
  assert.equal(
    isOpportunityEffectivelyExpired({
      status: "pending",
      expires_at: "2020-01-01T00:00:00.000Z",
      booking: { event_date: "2020-01-01", end_time: "12:00", start_time: "10:00" },
    }),
    true
  )
})
