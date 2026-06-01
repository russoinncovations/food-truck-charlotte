"use server"

import { redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import {
  fetchVendorReminderRecipients,
  fetchVendorProfileReminderRecipients,
  isPlausibleVendorEmail,
  type VendorReminderRecipient,
} from "@/lib/trucks/vendor-reminder-recipients"
import {
  logVendorReminderAttempt,
  sendVendorScheduleReminderEmail,
} from "@/lib/email/resend-vendor-schedule-reminder"
import { sendVendorProfileReminderEmail } from "@/lib/email/resend-vendor-profile-reminder-test"
import {
  VENDOR_EMAIL_CAMPAIGN_PROFILE_PIN_TEST,
  VENDOR_EMAIL_CAMPAIGN_SCHEDULE_REMINDER_TEST,
} from "@/lib/email/vendor-email-campaigns"
import {
  failuresForReminderRedirectQuery,
  pauseBetweenVendorReminderSends,
  type VendorReminderSendFailureReport,
} from "@/lib/admin/vendor-reminder-send-pacing"
import { verifyAdminKey } from "@/lib/admin/verify-admin-key"

export async function sendVendorScheduleReminders(formData: FormData) {
  const rawKey = (formData.get("adminKey") as string | null) ?? ""
  const adminKey = rawKey.trim()

  if (!verifyAdminKey(adminKey)) {
    redirect("/admin/vendors")
  }

  const supabase = await createClient()
  const { recipients, eligibleTruckCount } = await fetchVendorReminderRecipients(supabase)

  const noEmailSkipped = eligibleTruckCount - recipients.length
  let attempted = 0
  let sent = 0
  const errors: VendorReminderSendFailureReport[] = []

  for (let i = 0; i < recipients.length; i++) {
    const r = recipients[i]
    if (i > 0) await pauseBetweenVendorReminderSends()
    attempted++
    const result = await sendVendorScheduleReminderEmail({
      to: r.email,
      truckName: r.name,
      truckId: r.id,
    })
    if (result.ok) {
      sent++
      logVendorReminderAttempt({
        vendorId: r.id,
        email: r.email,
        status: "sent",
        errorMessage: null,
      })
    } else {
      errors.push({
        email: r.email,
        message: result.error,
        truckId: r.id,
        truckName: r.name,
      })
      logVendorReminderAttempt({
        vendorId: r.id,
        email: r.email,
        status: "failed",
        errorMessage: result.error,
      })
    }
  }

  const failed = errors.length
  const skipped = noEmailSkipped
  const { encoded: errsEncoded, truncated: errsTrunc } = failuresForReminderRedirectQuery(errors)
  const errParam = errors.length > 0 ? `&errs=${errsEncoded}` : ""
  const truncParam = errsTrunc ? "&reminderErrTrunc=1" : ""

  const keyQ = encodeURIComponent(adminKey)
  const base = `/admin/vendors?key=${keyQ}&reminder=1&attempted=${attempted}&sent=${sent}&skipped=${skipped}&failed=${failed}`
  redirect(`${base}${errParam}${truncParam}`)
}

const MAX_RETRY_RECIPIENTS = 250

/** Re-send schedule reminders only for trucks that failed in a prior paced bulk/retry run. */
export async function sendVendorScheduleRemindersRetry(formData: FormData) {
  const rawKey = (formData.get("adminKey") as string | null) ?? ""
  const adminKey = rawKey.trim()

  if (!verifyAdminKey(adminKey)) {
    redirect("/admin/vendors")
  }

  const keyQ = encodeURIComponent(adminKey)
  const rawJson = formData.get("retryRecipients")
  let parsed: unknown
  try {
    parsed = JSON.parse(String(rawJson ?? "[]"))
  } catch {
    redirect(`/admin/vendors?key=${keyQ}&retryParseErr=1`)
  }

  if (!Array.isArray(parsed)) {
    redirect(`/admin/vendors?key=${keyQ}&retryParseErr=1`)
  }

  const rows = parsed.slice(0, MAX_RETRY_RECIPIENTS) as {
    email?: unknown
    truckId?: unknown
    truckName?: unknown
  }[]

  const recipients: VendorReminderRecipient[] = []
  const seenEmail = new Set<string>()

  for (const row of rows) {
    const email =
      typeof row.email === "string" ? row.email.trim() : ""
    const truckId =
      typeof row.truckId === "string" ? row.truckId.trim() : ""
    const truckName =
      typeof row.truckName === "string"
        ? row.truckName.trim()
        : "there"
    if (!email.includes("@") || !truckId || !isPlausibleVendorEmail(email)) continue
    const k = email.toLowerCase()
    if (seenEmail.has(k)) continue
    seenEmail.add(k)
    recipients.push({ id: truckId, name: truckName || "there", email })
  }

  if (recipients.length === 0) {
    redirect(`/admin/vendors?key=${keyQ}&retryEmpty=1`)
  }

  let attempted = 0
  let sent = 0
  const errors: VendorReminderSendFailureReport[] = []

  for (let i = 0; i < recipients.length; i++) {
    const r = recipients[i]
    if (i > 0) await pauseBetweenVendorReminderSends()
    attempted++
    const result = await sendVendorScheduleReminderEmail({
      to: r.email,
      truckName: r.name,
      truckId: r.id,
    })
    if (result.ok) {
      sent++
      logVendorReminderAttempt({
        vendorId: r.id,
        email: r.email,
        status: "sent",
        errorMessage: null,
      })
    } else {
      errors.push({
        email: r.email,
        message: result.error,
        truckId: r.id,
        truckName: r.name,
      })
      logVendorReminderAttempt({
        vendorId: r.id,
        email: r.email,
        status: "failed",
        errorMessage: result.error,
      })
    }
  }

  const failed = errors.length
  const skipped = 0
  const { encoded: errsEncoded, truncated: errsTrunc } = failuresForReminderRedirectQuery(errors)
  const errParam = errors.length > 0 ? `&errs=${errsEncoded}` : ""
  const truncParam = errsTrunc ? "&reminderErrTrunc=1" : ""

  const base = `/admin/vendors?key=${keyQ}&reminderRetry=1&attempted=${attempted}&sent=${sent}&skipped=${skipped}&failed=${failed}`
  redirect(`${base}${errParam}${truncParam}`)
}

const TEST_GREETING_NAME = "Nicole"

/**
 * Sends the production schedule-reminder template to VENDOR_REMINDER_TEST_EMAIL only (no vendor list).
 */
export async function sendVendorScheduleReminderTest(formData: FormData) {
  const rawKey = (formData.get("adminKey") as string | null) ?? ""
  const adminKey = rawKey.trim()

  if (!verifyAdminKey(adminKey)) {
    redirect("/admin/vendors")
  }

  const keyQ = encodeURIComponent(adminKey)
  const testTo = process.env.VENDOR_REMINDER_TEST_EMAIL?.trim()

  if (!testTo || !isPlausibleVendorEmail(testTo)) {
    redirect(
      `/admin/vendors?key=${keyQ}&testReminder=1&testOk=0&testErr=${encodeURIComponent(
        "Set VENDOR_REMINDER_TEST_EMAIL in your environment to a valid address."
      )}`
    )
  }

  const result = await sendVendorScheduleReminderEmail({
    to: testTo,
    truckName: TEST_GREETING_NAME,
    campaign: VENDOR_EMAIL_CAMPAIGN_SCHEDULE_REMINDER_TEST,
  })

  if (result.ok) {
    logVendorReminderAttempt({
      vendorId: "test-reminder",
      email: testTo,
      status: "sent",
      errorMessage: null,
    })
    redirect(`/admin/vendors?key=${keyQ}&testReminder=1&testOk=1`)
  }

  logVendorReminderAttempt({
    vendorId: "test-reminder",
    email: testTo,
    status: "failed",
    errorMessage: result.error,
  })
  redirect(`/admin/vendors?key=${keyQ}&testReminder=1&testOk=0&testErr=${encodeURIComponent(result.error)}`)
}

/**
 * Sends the profile + live pin reminder draft to INQUIRY_TO_EMAIL only (admin preview). No vendors.
 */
export async function sendVendorProfileReminderTestToAdmin(formData: FormData) {
  const rawKey = (formData.get("adminKey") as string | null) ?? ""
  const adminKey = rawKey.trim()

  if (!verifyAdminKey(adminKey)) {
    redirect("/admin/vendors")
  }

  const keyQ = encodeURIComponent(adminKey)
  const to = process.env.INQUIRY_TO_EMAIL?.trim()

  if (!to || !isPlausibleVendorEmail(to)) {
    redirect(
      `/admin/vendors?key=${keyQ}&profileReminderTest=1&profileTestOk=0&profileTestErr=${encodeURIComponent(
        "Set INQUIRY_TO_EMAIL in your environment to a valid address."
      )}`
    )
  }

  const result = await sendVendorProfileReminderEmail({
    to,
    campaign: VENDOR_EMAIL_CAMPAIGN_PROFILE_PIN_TEST,
  })

  if (result.ok) {
    redirect(`/admin/vendors?key=${keyQ}&profileReminderTest=1&profileTestOk=1`)
  }

  redirect(
    `/admin/vendors?key=${keyQ}&profileReminderTest=1&profileTestOk=0&profileTestErr=${encodeURIComponent(result.error)}`
  )
}

/**
 * Sends profile + live pin reminder to all eligible directory vendors (deduped). Manual button only.
 */
export async function sendVendorProfileRemindersBulk(formData: FormData) {
  const rawKey = (formData.get("adminKey") as string | null) ?? ""
  const adminKey = rawKey.trim()

  if (!verifyAdminKey(adminKey)) {
    redirect("/admin/vendors")
  }

  const keyQ = encodeURIComponent(adminKey)
  const supabase = await createClient()
  const { recipients, eligibleTruckCount } = await fetchVendorProfileReminderRecipients(supabase)

  const skipped = eligibleTruckCount - recipients.length
  const errors: VendorReminderSendFailureReport[] = []
  let sent = 0

  for (let i = 0; i < recipients.length; i++) {
    const r = recipients[i]
    if (i > 0) await pauseBetweenVendorReminderSends()

    const result = await sendVendorProfileReminderEmail({ to: r.email, truckId: r.id })
    if (result.ok) {
      sent++
      logVendorReminderAttempt({
        vendorId: r.id,
        email: r.email,
        status: "sent",
        errorMessage: null,
      })
    } else {
      errors.push({
        email: r.email,
        message: result.error,
        truckId: r.id,
        truckName: r.name,
      })
      console.error("[profile-reminder-bulk] failed:", r.email, result.error)
      logVendorReminderAttempt({
        vendorId: r.id,
        email: r.email,
        status: "failed",
        errorMessage: result.error,
      })
    }
  }

  const attempted = recipients.length
  const failed = errors.length
  const { encoded: pbErrsEncoded, truncated: pbTrunc } = failuresForReminderRedirectQuery(errors)
  const errParam = errors.length > 0 ? `&pbErrs=${pbErrsEncoded}` : ""
  const truncParam = pbTrunc ? "&pbErrTrunc=1" : ""

  const base = `/admin/vendors?key=${keyQ}&profileBulk=1&pbAttempted=${attempted}&pbSent=${sent}&pbSkipped=${skipped}&pbFailed=${failed}`
  redirect(`${base}${errParam}${truncParam}`)
}
