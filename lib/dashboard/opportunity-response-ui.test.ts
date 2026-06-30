import assert from "node:assert/strict"
import { test } from "node:test"
import {
  getEffectiveOpportunityStatus,
  isOpportunityInterested,
  isOpportunityNotAvailable,
  isOpportunityPendingForAction,
  opportunityResponseLabel,
} from "./opportunity-response-ui"

test("opportunityResponseLabel maps vendor response statuses", () => {
  assert.equal(opportunityResponseLabel("pending"), "Pending")
  assert.equal(opportunityResponseLabel("interested"), "Interested")
  assert.equal(opportunityResponseLabel("not_available"), "Not available")
  assert.equal(opportunityResponseLabel("pass"), "Not available")
  assert.equal(opportunityResponseLabel("expired"), "Expired")
})

test("getEffectiveOpportunityStatus prefers local override after save", () => {
  assert.equal(getEffectiveOpportunityStatus("pending", "interested"), "interested")
  assert.equal(getEffectiveOpportunityStatus("pending", "not_available"), "not_available")
  assert.equal(getEffectiveOpportunityStatus("interested", null), "interested")
  assert.equal(getEffectiveOpportunityStatus("pending", null), "pending")
})

test("pending-for-action helpers reflect effective status", () => {
  assert.equal(isOpportunityPendingForAction("pending"), true)
  assert.equal(isOpportunityPendingForAction("interested"), false)
  assert.equal(isOpportunityInterested("interested"), true)
  assert.equal(isOpportunityNotAvailable("not_available"), true)
  assert.equal(isOpportunityNotAvailable("pass"), true)
})
