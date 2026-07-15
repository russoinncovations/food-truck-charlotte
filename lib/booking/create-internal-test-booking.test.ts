import assert from "node:assert/strict"
import test from "node:test"
import {
  DEFAULT_INTERNAL_TEST_END_TIME,
  DEFAULT_INTERNAL_TEST_HOST_EMAIL,
  DEFAULT_INTERNAL_TEST_START_TIME,
  INTERNAL_TEST_BOOKING_MARKER,
  INTERNAL_TEST_END_AFTER_START_MESSAGE,
  INTERNAL_TEST_EVENT_MUST_BE_FUTURE_MESSAGE,
  defaultInternalTestEventDate,
  isAllowedInternalTestHostEmail,
  resolveInternalTestEventTiming,
} from "@/lib/booking/create-internal-test-booking"
import { bookingOpportunityExpiresAt } from "@/lib/booking/opportunity-expiration"
import {
  parseInternalTestRecipientId,
  truckMatchesInternalTestRecipient,
} from "@/lib/trucks/internal-test-recipients"

/** Fixed Eastern “now”: 2026-07-15 10:00 AM EDT (14:00 UTC). */
const FIXED_NOW = new Date("2026-07-15T14:00:00.000Z")

test("defaultInternalTestEventDate is tomorrow in America/New_York", () => {
  assert.equal(defaultInternalTestEventDate(FIXED_NOW), "2026-07-16")
  assert.equal(DEFAULT_INTERNAL_TEST_START_TIME, "11:00")
  assert.equal(DEFAULT_INTERNAL_TEST_END_TIME, "14:00")
})

test("resolveInternalTestEventTiming defaults to tomorrow 11:00–14:00 when inputs omitted", () => {
  const result = resolveInternalTestEventTiming({}, FIXED_NOW)
  assert.equal(result.ok, true)
  if (!result.ok) return
  assert.equal(result.timing.eventDate, "2026-07-16")
  assert.equal(result.timing.startTime, "11:00")
  assert.equal(result.timing.endTime, "14:00")
})

test("resolveInternalTestEventTiming accepts a custom future date and time", () => {
  const result = resolveInternalTestEventTiming(
    {
      eventDate: "2026-08-20",
      startTime: "17:00",
      endTime: "20:00",
    },
    FIXED_NOW
  )
  assert.equal(result.ok, true)
  if (!result.ok) return
  assert.deepEqual(result.timing, {
    eventDate: "2026-08-20",
    startTime: "17:00",
    endTime: "20:00",
  })
  const expiresAt = bookingOpportunityExpiresAt("2026-08-20", "20:00", "17:00")
  assert.ok(expiresAt)
  assert.ok(new Date(expiresAt!).getTime() > FIXED_NOW.getTime())
})

test("resolveInternalTestEventTiming rejects past date/time", () => {
  const result = resolveInternalTestEventTiming(
    {
      eventDate: "2026-07-15",
      startTime: "09:00",
      endTime: "11:00",
    },
    FIXED_NOW
  )
  assert.equal(result.ok, false)
  if (result.ok) return
  assert.equal(result.error, INTERNAL_TEST_EVENT_MUST_BE_FUTURE_MESSAGE)
})

test("resolveInternalTestEventTiming rejects end time before start time", () => {
  const result = resolveInternalTestEventTiming(
    {
      eventDate: "2026-08-01",
      startTime: "15:00",
      endTime: "12:00",
    },
    FIXED_NOW
  )
  assert.equal(result.ok, false)
  if (result.ok) return
  assert.equal(result.error, INTERNAL_TEST_END_AFTER_START_MESSAGE)
})

test("internal-test routing protections remain unchanged", () => {
  assert.equal(INTERNAL_TEST_BOOKING_MARKER, "INTERNAL TEST")
  assert.equal(isAllowedInternalTestHostEmail(DEFAULT_INTERNAL_TEST_HOST_EMAIL), true)
  assert.equal(isAllowedInternalTestHostEmail("vendor@example.com"), false)
  assert.equal(isAllowedInternalTestHostEmail("not-internal@foodtruckclt.com"), false)
  assert.equal(parseInternalTestRecipientId("official_test_truck"), "official_test_truck")
  assert.equal(parseInternalTestRecipientId("random"), "demo_vendor")
  assert.equal(
    truckMatchesInternalTestRecipient("official_test_truck", {
      name: "Official Test Truck",
      email: "evolvebtc@gmail.com",
    }),
    true
  )
  assert.equal(
    truckMatchesInternalTestRecipient("official_test_truck", {
      name: "Some Real Vendor",
      email: "real@vendor.com",
    }),
    false
  )
  assert.equal(
    truckMatchesInternalTestRecipient("demo_vendor", {
      name: "FoodTruckCLT Demo Vendor",
      email: "evolvebtc@icloud.com",
    }),
    true
  )
})
