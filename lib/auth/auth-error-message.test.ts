import assert from "node:assert/strict"
import test from "node:test"
import {
  authErrorUserMessage,
  buildAuthErrorPath,
  parseAuthErrorParams,
} from "@/lib/auth/auth-error-message"

test("parseAuthErrorParams reads otp_expired from hash fragments", () => {
  const parsed = parseAuthErrorParams(
    new URLSearchParams(),
    "#error=access_denied&error_code=otp_expired&error_description=Email+link+is+invalid+or+has+expired"
  )
  assert.equal(parsed.error, "access_denied")
  assert.equal(parsed.errorCode, "otp_expired")
  assert.match(parsed.errorDescription ?? "", /invalid or has expired/i)
})

test("parseAuthErrorParams prefers query params when present", () => {
  const parsed = parseAuthErrorParams(
    new URLSearchParams("error=access_denied&error_code=exchange_failed&error_description=PKCE+failed"),
    "#error=access_denied&error_code=otp_expired"
  )
  assert.equal(parsed.errorCode, "exchange_failed")
})

test("authErrorUserMessage explains otp_expired distinctly from generic failure", () => {
  const msg = authErrorUserMessage({
    error: "access_denied",
    errorCode: "otp_expired",
    errorDescription: null,
  })
  assert.match(msg.title, /expired or already used/i)
  assert.match(msg.hint, /same device and browser/i)
})

test("buildAuthErrorPath preserves safe next and omits external redirects", () => {
  const path = buildAuthErrorPath({
    error: "access_denied",
    errorCode: "missing_auth_params",
    errorDescription: "No auth code",
    next: "/dashboard?opportunity=abc",
  })
  assert.match(path, /^\/auth\/error\?/)
  assert.match(path, /error_code=missing_auth_params/)
  assert.match(path, /next=%2Fdashboard%3Fopportunity%3Dabc/)

  const unsafe = buildAuthErrorPath({
    errorCode: "x",
    next: "https://evil.example",
  })
  assert.doesNotMatch(unsafe, /evil/)
})
