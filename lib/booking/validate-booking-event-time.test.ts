import assert from "node:assert/strict"
import test from "node:test"
import {
  BOOKING_START_TIME_REQUIRED_MESSAGE,
  isBookingStartTimePresent,
} from "@/lib/booking/validate-booking-event-time"
import {
  opportunityVisibleInExpiredOpportunities,
  opportunityVisibleInRecentResponses,
} from "@/lib/dashboard/vendor-booking-opportunities"

test("isBookingStartTimePresent rejects empty start time", () => {
  assert.equal(isBookingStartTimePresent(""), false)
  assert.equal(isBookingStartTimePresent("   "), false)
  assert.equal(isBookingStartTimePresent(null), false)
  assert.equal(isBookingStartTimePresent(undefined), false)
})

test("isBookingStartTimePresent accepts non-empty start time", () => {
  assert.equal(isBookingStartTimePresent("18:00"), true)
  assert.equal(isBookingStartTimePresent(" 09:30 "), true)
})

test("booking start time required message is stable", () => {
  assert.match(BOOKING_START_TIME_REQUIRED_MESSAGE, /start time/i)
})

test("expired opportunities are not classified as recent responses", () => {
  const truck = { name: "Truck", email: "vendor@example.com" }
  const br = { status: "contacted", event_date: "2020-05-15", start_time: "18:00", end_time: "22:00" }

  assert.equal(opportunityVisibleInRecentResponses("expired", br, truck), false)
  assert.equal(opportunityVisibleInExpiredOpportunities("expired", br, truck, null), true)
})
