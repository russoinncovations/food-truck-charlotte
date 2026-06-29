import assert from "node:assert/strict"
import test from "node:test"
import type { BookingInsertRow } from "@/lib/booking/complete-booking-request"
import { BOOKING_REQUEST_TYPE } from "@/lib/booking/booking-request-constants"
import {
  bookingRequestCategoryLabel,
  buildVendorBookingAlertFields,
  buildVendorBookingLeadEmail,
  buildVendorBookingLeadSubject,
} from "@/lib/email/booking-vendor-lead-email"
import {
  buildVendorOpportunityDashboardUrl,
  VENDOR_OPPORTUNITY_DASHBOARD_ORIGIN,
} from "@/lib/email/vendor-opportunity-dashboard-url"

const SAMPLE_OPPORTUNITY_ID = "11111111-2222-3333-4444-555555555555"

function sampleBooking(overrides: Partial<BookingInsertRow> = {}): BookingInsertRow {
  return {
    event_type: "corporate",
    event_date: "2026-07-15",
    start_time: "11:00",
    end_time: "14:00",
    guest_count: 120,
    venue_name: "Office campus",
    street_address: "100 N Tryon St",
    city: "Charlotte",
    state: "NC",
    zip_code: "28202",
    cuisines: ["Tacos"],
    dietary_requirements: null,
    budget_range: "flexible",
    contact_name: "Host Person",
    contact_email: "host@example.com",
    contact_phone: "704-555-0100",
    organization: "Acme Co",
    additional_notes: "Private notes",
    status: "new",
    request_type: BOOKING_REQUEST_TYPE.SPECIFIC_VENDOR,
    truck_id: "truck-1",
    vendor_type: "truck",
    preferred_trucks: "Taco Truck",
    ...overrides,
  }
}

test("buildVendorBookingLeadSubject uses FoodTruckCLT request format with event type and date", () => {
  assert.equal(
    buildVendorBookingLeadSubject(sampleBooking()),
    "New FoodTruckCLT Request: Corporate Event · Wed, Jul 15, 2026"
  )
})

test("buildVendorBookingLeadSubject falls back when event type or date is absent", () => {
  assert.equal(
    buildVendorBookingLeadSubject(sampleBooking({ event_type: "", event_date: "" })),
    "New FoodTruckCLT Request: Event · Date TBD"
  )
})

test("buildVendorBookingAlertFields include operational alert details only", () => {
  const fields = buildVendorBookingAlertFields(sampleBooking())
  const labels = fields.map((f) => f.label)
  assert.deepEqual(labels, [
    "Event type",
    "Date",
    "Time",
    "Location",
    "Guest count",
    "Request category",
    "Requested cuisine or truck type",
  ])
  assert.equal(fields.find((f) => f.label === "Guest count")?.value, "120")
  assert.equal(bookingRequestCategoryLabel(sampleBooking()), "Requested for your truck")
  assert.match(fields.find((f) => f.label === "Time")?.value ?? "", /11:00/)
})

test("buildVendorBookingLeadEmail excludes host mailto and phone from html and text", () => {
  const { html, text } = buildVendorBookingLeadEmail(sampleBooking(), "Taco Truck", SAMPLE_OPPORTUNITY_ID)
  assert.doesNotMatch(html, /mailto:/i)
  assert.doesNotMatch(text, /mailto:/i)
  assert.doesNotMatch(html, /host@example\.com/i)
  assert.doesNotMatch(text, /host@example\.com/i)
  assert.doesNotMatch(html, /704-555-0100/)
  assert.doesNotMatch(text, /704-555-0100/)
  assert.doesNotMatch(html, /Host Person/)
  assert.doesNotMatch(text, /Host Person/)
})

test("buildVendorBookingLeadEmail includes CTA with canonical vendor host and encoded opportunity id", () => {
  const { html, text } = buildVendorBookingLeadEmail(sampleBooking(), "Taco Truck", SAMPLE_OPPORTUNITY_ID)
  const expectedUrl = buildVendorOpportunityDashboardUrl(SAMPLE_OPPORTUNITY_ID)
  assert.equal(
    expectedUrl,
    `${VENDOR_OPPORTUNITY_DASHBOARD_ORIGIN}/dashboard?opportunity=${encodeURIComponent(SAMPLE_OPPORTUNITY_ID)}`
  )
  assert.match(html, /View Request &amp; Respond/)
  assert.ok(html.includes(expectedUrl))
  assert.match(text, /View Request & Respond: /)
  assert.ok(text.includes(expectedUrl))
})

test("buildVendorBookingLeadEmail states connect-only disclaimer without middleman payment language", () => {
  const { html, text } = buildVendorBookingLeadEmail(sampleBooking(), "Taco Truck", SAMPLE_OPPORTUNITY_ID)
  assert.match(html, /Agreements and payments are handled directly between you and the host/)
  assert.match(text, /Agreements and payments are handled directly between you and the host/)
  assert.match(html, /Host contact details appear after you mark Interested/)
  assert.doesNotMatch(html, /FoodTruckCLT manages payments/i)
})
