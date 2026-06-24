import assert from "node:assert/strict"
import test from "node:test"
import { BOOKING_NOTIFICATION_STATUS } from "../booking/booking-notification-status"
import { evaluatePendingOpportunityDashboardVisibility } from "./evaluate-pending-opportunity-dashboard-visibility"

test("dashboard_only pending opportunity is visible in Requests to Confirm", () => {
  const result = evaluatePendingOpportunityDashboardVisibility({
    opportunityStatus: "pending",
    notificationStatus: BOOKING_NOTIFICATION_STATUS.DASHBOARD_ONLY,
    bookingRequest: {
      status: "new",
      contact_name: "Host",
      contact_email: "host@example.com",
      additional_notes: null,
    },
    truck: {
      id: "truck-1",
      name: "Real Vendor Truck",
      email: "vendor@example.com",
      is_active: true,
      status: "active",
    },
  })

  assert.equal(result.visibleInRequestsToConfirm, true)
  assert.equal(result.expectedSection, "requests_to_confirm")
  assert.equal(result.notificationTrackingKind, "dashboard_only")
  assert.equal(result.category, "visible_healthy")
  assert.deepEqual(result.exclusionReasons, [])
})

test("historical untracked pending without notification_status remains dashboard visible", () => {
  const result = evaluatePendingOpportunityDashboardVisibility({
    opportunityStatus: "pending",
    notificationStatus: null,
    bookingRequest: { status: "contacted", event_date: "2026-06-01" },
    truck: {
      id: "truck-2",
      name: "Another Truck",
      email: "owner@foodtruckclt.com",
      is_active: true,
      status: "active",
    },
  })

  assert.equal(result.visibleInRequestsToConfirm, true)
  assert.equal(result.notificationTrackingKind, "historical_untracked")
})

test("terminal booking excluded from visibility", () => {
  const result = evaluatePendingOpportunityDashboardVisibility({
    opportunityStatus: "pending",
    bookingRequest: { status: "fulfilled" },
    truck: {
      id: "truck-3",
      name: "Truck",
      email: "v@v.com",
      is_active: true,
      status: "active",
    },
  })

  assert.equal(result.visibleInRequestsToConfirm, false)
  assert.equal(result.category, "terminal_booking_status")
})

test("internal test booking hidden from production truck", () => {
  const result = evaluatePendingOpportunityDashboardVisibility({
    opportunityStatus: "pending",
    bookingRequest: {
      status: "new",
      additional_notes: "INTERNAL TEST — admin verification",
      contact_name: "INTERNAL TEST Host",
    },
    truck: {
      id: "truck-prod",
      name: "Production Truck",
      email: "prod@example.com",
      is_active: true,
      status: "active",
    },
  })

  assert.equal(result.visibleInRequestsToConfirm, false)
  assert.equal(result.category, "internal_test_exception")
})
