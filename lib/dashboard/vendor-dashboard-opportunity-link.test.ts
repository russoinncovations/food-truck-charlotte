import assert from "node:assert/strict"
import test from "node:test"
import { updateTruckOpportunityStatus } from "@/app/dashboard/actions"
import {
  buildVendorLoginRedirectForDashboardOpportunity,
  parseDashboardOpportunityId,
  resolvePendingDeepLinkOpportunity,
  resolveVendorLoginCallbackNext,
} from "@/lib/dashboard/vendor-dashboard-opportunity-link"
import { buildVendorDashboardOpportunityPath } from "@/lib/email/vendor-opportunity-dashboard-url"

const PENDING_ID = "pending-opp-id"
const OTHER_ID = "other-opp-id"

test("buildVendorLoginRedirectForDashboardOpportunity preserves safe opportunity return path", () => {
  const redirectPath = buildVendorLoginRedirectForDashboardOpportunity(PENDING_ID)
  assert.equal(
    redirectPath,
    `/vendor-login?next=${encodeURIComponent(buildVendorDashboardOpportunityPath(PENDING_ID))}`
  )
  const decoded = decodeURIComponent(redirectPath.split("next=")[1] ?? "")
  assert.equal(decoded, `/dashboard?opportunity=${encodeURIComponent(PENDING_ID)}`)
})

test("resolveVendorLoginCallbackNext allows dashboard opportunity next path and rejects external urls", () => {
  const next = `/dashboard?opportunity=${PENDING_ID}`
  assert.equal(resolveVendorLoginCallbackNext(next, "/dashboard"), next)
  assert.equal(resolveVendorLoginCallbackNext("https://evil.example/phish", "/dashboard"), "/dashboard")
  assert.equal(resolveVendorLoginCallbackNext("//evil.example", "/dashboard"), "/dashboard")
})

test("resolvePendingDeepLinkOpportunity opens only matching visible pending opportunities", () => {
  const pending = [
    { id: PENDING_ID, status: "pending" },
    { id: OTHER_ID, status: "interested" },
  ]
  assert.deepEqual(resolvePendingDeepLinkOpportunity(pending, PENDING_ID), pending[0])
  assert.equal(resolvePendingDeepLinkOpportunity(pending, OTHER_ID), null)
  assert.equal(resolvePendingDeepLinkOpportunity(pending, "missing-id"), null)
  assert.equal(resolvePendingDeepLinkOpportunity(pending, null), null)
})

test("parseDashboardOpportunityId trims and rejects empty values", () => {
  assert.equal(parseDashboardOpportunityId(`  ${PENDING_ID}  `), PENDING_ID)
  assert.equal(parseDashboardOpportunityId(""), null)
  assert.equal(parseDashboardOpportunityId(undefined), null)
})

test("updateTruckOpportunityStatus remains available for dashboard interested/not-available forms", () => {
  assert.equal(typeof updateTruckOpportunityStatus, "function")
})
