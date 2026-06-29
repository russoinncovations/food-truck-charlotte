import assert from "node:assert/strict"
import test from "node:test"
import { BOOKING_NOTIFICATION_STATUS } from "@/lib/booking/booking-notification-status"
import {
  isOpportunityEmailAlreadyAttempted,
  opportunityDeliveryProblem,
  opportunityHasVendorResponse,
} from "@/lib/booking/opportunity-delivery-reliability"
import { isOpportunityEffectivelyExpired } from "@/lib/booking/opportunity-active"
import { bookingOpportunityExpiresAt, isBookingOpportunityExpired } from "@/lib/booking/opportunity-expiration"
import { computeMetricsFromRows } from "@/lib/admin/fetch-booking-interested-counts"

test("valid vendor send attempt is identifiable by stored provider message id", () => {
  assert.equal(
    isOpportunityEmailAlreadyAttempted({
      notificationStatus: BOOKING_NOTIFICATION_STATUS.SENT,
      notificationEmail: "vendor@example.com",
      providerMessageId: "resend_msg_123",
      emailSentAt: "2026-06-28T12:00:00.000Z",
    }),
    true
  )
})

test("bounced email is not marked delivered or responded", () => {
  const row = {
    status: "pending",
    notificationStatus: BOOKING_NOTIFICATION_STATUS.BOUNCED,
    bouncedAt: "2026-06-28T12:05:00.000Z",
  }

  assert.equal(opportunityDeliveryProblem(row), "bounced")
  assert.equal(opportunityHasVendorResponse(row.status), false)
})

test("dashboard opportunity can exist independently of email delivery state", () => {
  const metrics = computeMetricsFromRows([
    {
      booking_request_id: "booking-1",
      status: "pending",
      notification_status: BOOKING_NOTIFICATION_STATUS.DASHBOARD_ONLY,
    },
  ])

  assert.equal(metrics.isDashboardOnly, true)
  assert.equal(metrics.hasActiveNoVendorResponse, true)
})

test("vendor response status does not change email delivery facts", () => {
  const metrics = computeMetricsFromRows([
    {
      booking_request_id: "booking-1",
      status: "interested",
      notification_status: BOOKING_NOTIFICATION_STATUS.DELIVERED,
    },
  ])

  assert.equal(metrics.hasVendorResponse, true)
  assert.equal(metrics.hasDeliveredNoResponse, false)
  assert.equal(opportunityHasVendorResponse("interested"), true)
})

test("missing vendor email is visible in admin reporting", () => {
  const metrics = computeMetricsFromRows([
    {
      booking_request_id: "booking-1",
      status: "pending",
      notification_status: BOOKING_NOTIFICATION_STATUS.NOT_ELIGIBLE_NO_EMAIL,
    },
  ])

  assert.equal(metrics.hasMissingVendorEmail, true)
})

test("expired request cannot send a new vendor notification", () => {
  const now = new Date("2026-06-29T15:00:00.000Z")

  assert.equal(isBookingOpportunityExpired("2026-06-28", "22:00", "18:00", now), true)
})

test("active no-response admin filter excludes expired opportunities", () => {
  const expiredAt = bookingOpportunityExpiresAt("2020-06-28", "22:00", "18:00")
  assert.ok(expiredAt)

  const metrics = computeMetricsFromRows([
    {
      booking_request_id: "booking-1",
      status: "pending",
      notification_status: BOOKING_NOTIFICATION_STATUS.DELIVERED,
      expires_at: expiredAt,
    },
  ])

  assert.equal(isOpportunityEffectivelyExpired({ expires_at: expiredAt }, new Date("2020-06-29T15:00:00.000Z")), true)
  assert.equal(metrics.hasActiveNoVendorResponse, false)
  assert.equal(metrics.hasActiveDeliveredNoResponse, false)
})

test("active no-response admin filter excludes historical null expires_at when booking event is past", () => {
  const metrics = computeMetricsFromRows([
    {
      booking_request_id: "booking-1",
      status: "pending",
      notification_status: BOOKING_NOTIFICATION_STATUS.DELIVERED,
      expires_at: null,
      booking_requests: {
        event_date: "2020-05-15",
        start_time: "18:00",
        end_time: "22:00",
        status: "contacted",
      },
    },
  ])

  assert.equal(metrics.hasActiveNoVendorResponse, false)
})

test("idempotent notification handling prevents duplicate sends without intentional retry", () => {
  assert.equal(
    isOpportunityEmailAlreadyAttempted({
      notificationStatus: BOOKING_NOTIFICATION_STATUS.SENT,
      resendEmailId: "resend_msg_123",
    }),
    true
  )
})
