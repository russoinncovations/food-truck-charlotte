import assert from "node:assert/strict"
import test from "node:test"
import { computeMetricsFromRows } from "@/lib/admin/fetch-booking-interested-counts"
import { BOOKING_NOTIFICATION_STATUS } from "@/lib/booking/booking-notification-status"
import {
  isOpportunityActiveAndActionable,
  isOpportunityEffectivelyExpired,
  resolveEffectiveOpportunityExpiresAt,
} from "@/lib/booking/opportunity-active"
import {
  isNonPendingHistoricalOpportunityStatus,
  planOpportunityExpirationBackfill,
} from "@/lib/booking/opportunity-expiration-backfill"
import {
  filterActivePendingOpportunities,
  opportunityVisibleInRequestsToConfirm,
} from "@/lib/dashboard/vendor-booking-opportunities"

const PAST_EVENT = {
  event_date: "2020-05-15",
  start_time: "18:00",
  end_time: "22:00",
  status: "contacted",
}

const FUTURE_EVENT = {
  event_date: "2030-05-15",
  start_time: "18:00",
  end_time: "22:00",
  status: "contacted",
}

const TRUCK = { name: "Test Truck", email: "vendor@example.com" }

test("historical pending with null expires_at and past booking is excluded from vendor active list", () => {
  const now = new Date("2020-06-01T12:00:00.000Z")
  const row = {
    id: "opp-1",
    status: "pending",
    booking_request_id: "booking-1",
    expires_at: null,
    booking_requests: PAST_EVENT,
  }

  assert.equal(
    isOpportunityActiveAndActionable(
      { status: "pending", expires_at: null, booking: PAST_EVENT },
      now
    ),
    false
  )

  assert.equal(
    opportunityVisibleInRequestsToConfirm("pending", PAST_EVENT, TRUCK, null),
    false
  )

  const active = filterActivePendingOpportunities([row], {
    id: "truck-1",
    name: "Test Truck",
    slug: null,
    email: "vendor@example.com",
    cuisine: null,
    cuisine_types: null,
    serving_today: null,
    serving_started_at: null,
    today_location: null,
    street_address: null,
    latitude: null,
    longitude: null,
    updated_at: null,
  })

  assert.equal(active.length, 0)
})

test("historical pending with null expires_at and past booking is excluded from admin active no-response", () => {
  const metrics = computeMetricsFromRows([
    {
      booking_request_id: "booking-1",
      status: "pending",
      notification_status: BOOKING_NOTIFICATION_STATUS.DELIVERED,
      expires_at: null,
      booking_requests: PAST_EVENT,
    },
  ])

  assert.equal(metrics.hasActiveNoVendorResponse, false)
  assert.equal(metrics.hasActiveDeliveredNoResponse, false)
})

test("future pending with null expires_at remains active through booking fallback", () => {
  const now = new Date("2020-01-01T12:00:00.000Z")

  assert.ok(resolveEffectiveOpportunityExpiresAt({ expires_at: null, booking: FUTURE_EVENT }))
  assert.equal(
    isOpportunityActiveAndActionable(
      { status: "pending", expires_at: null, booking: FUTURE_EVENT },
      now
    ),
    true
  )
  assert.equal(
    opportunityVisibleInRequestsToConfirm("pending", FUTURE_EVENT, TRUCK, null),
    true
  )

  const metrics = computeMetricsFromRows([
    {
      booking_request_id: "booking-2",
      status: "pending",
      notification_status: BOOKING_NOTIFICATION_STATUS.DELIVERED,
      expires_at: null,
      booking_requests: FUTURE_EVENT,
    },
  ])
  assert.equal(metrics.hasActiveNoVendorResponse, true)
})

test("expired pending opportunity is not actionable for vendor response", () => {
  const now = new Date("2020-06-01T12:00:00.000Z")
  assert.equal(isOpportunityEffectivelyExpired({ status: "pending", expires_at: null, booking: PAST_EVENT }, now), true)
  assert.equal(
    isOpportunityActiveAndActionable(
      { status: "pending", expires_at: null, booking: PAST_EVENT },
      now
    ),
    false
  )
})

test("backfill plan is idempotent", () => {
  const now = new Date("2020-06-01T12:00:00.000Z")
  const row = {
    id: "opp-1",
    status: "pending",
    expires_at: null,
    event_date: PAST_EVENT.event_date,
    start_time: PAST_EVENT.start_time,
    end_time: PAST_EVENT.end_time,
  }

  const first = planOpportunityExpirationBackfill(row, now)
  assert.ok(first?.expires_at)
  assert.equal(first?.status, "expired")

  const second = planOpportunityExpirationBackfill(
    {
      ...row,
      expires_at: first!.expires_at!,
      status: "expired",
    },
    now
  )
  assert.equal(second, null)
})

test("backfill never overwrites non-pending historical opportunity status", () => {
  const now = new Date("2020-06-01T12:00:00.000Z")
  const interested = planOpportunityExpirationBackfill(
    {
      id: "opp-2",
      status: "interested",
      expires_at: null,
      event_date: PAST_EVENT.event_date,
      start_time: PAST_EVENT.start_time,
      end_time: PAST_EVENT.end_time,
    },
    now
  )

  assert.ok(interested?.expires_at)
  assert.equal(interested?.status, undefined)
  assert.equal(isNonPendingHistoricalOpportunityStatus("interested"), true)
})
