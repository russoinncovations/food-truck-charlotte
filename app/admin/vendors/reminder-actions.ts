"use server"

import { redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import {
  fetchVendorReminderRecipients,
  isPlausibleVendorEmail,
} from "@/lib/trucks/vendor-reminder-recipients"
import {
  logVendorReminderAttempt,
  sendVendorScheduleReminderEmail,
} from "@/lib/email/resend-vendor-schedule-reminder"

function adminKeyOk(key: string | null | undefined): boolean {
  const expected = process.env.ADMIN_KEY ?? "7985"
  return (key ?? "").trim() === expected
}

export async function sendVendorScheduleReminders(formData: FormData) {
  const rawKey = (formData.get("adminKey") as string | null) ?? ""
  const adminKey = rawKey.trim()

  if (!adminKeyOk(adminKey)) {
    redirect("/admin/vendors")
  }

  const supabase = await createClient()
  const { recipients, eligibleTruckCount } = await fetchVendorReminderRecipients(supabase)

  const noEmailSkipped = eligibleTruckCount - recipients.length
  let attempted = 0
  let sent = 0
  const errors: { email: string; message: string }[] = []

  for (const r of recipients) {
    attempted++
    const result = await sendVendorScheduleReminderEmail({ to: r.email, truckName: r.name })
    if (result.ok) {
      sent++
      logVendorReminderAttempt({
        vendorId: r.id,
        email: r.email,
        status: "sent",
        errorMessage: null,
      })
    } else {
      errors.push({ email: r.email, message: result.error })
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
  const errParam =
    errors.length > 0
      ? encodeURIComponent(
          JSON.stringify(errors.slice(0, 8)).slice(0, 1500)
        )
      : ""

  const keyQ = encodeURIComponent(adminKey)
  const base = `/admin/vendors?key=${keyQ}&reminder=1&attempted=${attempted}&sent=${sent}&skipped=${skipped}&failed=${failed}`
  redirect(errParam ? `${base}&errs=${errParam}` : base)
}

const TEST_GREETING_NAME = "Nicole"

/**
 * Sends the production schedule-reminder template to VENDOR_REMINDER_TEST_EMAIL only (no vendor list).
 */
export async function sendVendorScheduleReminderTest(formData: FormData) {
  const rawKey = (formData.get("adminKey") as string | null) ?? ""
  const adminKey = rawKey.trim()

  if (!adminKeyOk(adminKey)) {
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
