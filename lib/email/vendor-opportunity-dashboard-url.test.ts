import assert from "node:assert/strict"
import test from "node:test"
import {
  buildVendorDashboardOpportunityPath,
  buildVendorOpportunityDashboardUrl,
  VENDOR_OPPORTUNITY_DASHBOARD_ORIGIN,
} from "@/lib/email/vendor-opportunity-dashboard-url"

const SAMPLE_ID = "aaaa-bbbb-cccc-dddd"

test("buildVendorOpportunityDashboardUrl uses canonical vendor host and encoded opportunity id", () => {
  const url = buildVendorOpportunityDashboardUrl(SAMPLE_ID)
  assert.equal(url, `${VENDOR_OPPORTUNITY_DASHBOARD_ORIGIN}/dashboard?opportunity=${encodeURIComponent(SAMPLE_ID)}`)
  assert.match(url, /^https:\/\/vendor\.foodtruckclt\.com\//)
  assert.doesNotMatch(url, /localhost/)
  assert.doesNotMatch(url, /vercel\.app/)
})

test("buildVendorDashboardOpportunityPath encodes opportunity query value", () => {
  const id = "id/with+special&chars"
  assert.equal(
    buildVendorDashboardOpportunityPath(id),
    `/dashboard?opportunity=${encodeURIComponent(id)}`
  )
})
