import { VENDOR_EMAIL_GO_LIVE_DASHBOARD_URL } from "@/lib/email/vendor-email-public-links"
import {
  VENDOR_EMAIL_CAMPAIGN_SCHEDULE_REMINDER,
  VENDOR_EMAIL_CAMPAIGN_SCHEDULE_REMINDER_TEST,
} from "@/lib/email/vendor-email-campaigns"
import { insertVendorEmailEvent } from "@/lib/email/vendor-email-events"

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
}

export const VENDOR_SCHEDULE_REMINDER_SUBJECT = "Help people find your truck this week"

export function buildVendorScheduleReminderHtml(): string {
  const dashboardHref = VENDOR_EMAIL_GO_LIVE_DASHBOARD_URL
  const dashboardLabel = escapeHtml(dashboardHref)
  return `
<p>Hi everyone,</p>
<p>FoodTruckCLT is starting to get more traffic from people looking for trucks and submitting booking requests.</p>
<p>If you want people to find you, please add your upcoming stops to your vendor dashboard.</p>
<p><strong>Vendor dashboard:</strong><br />
<a href="${dashboardHref}">${dashboardLabel}</a></p>
<p>You can add planned stops ahead of time so your schedule is visible, and if something changes last minute, you can use Go Live to update your pin.</p>
<p>Going forward, trucks with updated profiles and schedules will be easier to share, easier to find on the map, and easier to match with booking requests.</p>
<p>We&apos;re also seeing BBQ come up in requests, and we only have a handful of BBQ/smokehouse-style trucks listed right now. If that&apos;s your lane, please make sure your profile is updated.</p>
<p>Thanks,<br />Nicole<br />FoodTruckCLT</p>
<p>If you do not want reminder emails, reply and we&apos;ll remove you from future reminders.</p>
`
}

export type VendorReminderSendResult =
  | { ok: true; resendEmailId?: string }
  | { ok: false; error: string }

/**
 * Single vendor schedule / map reminder. Uses RESEND_API_KEY and RESEND_FROM_EMAIL.
 */
export async function sendVendorScheduleReminderEmail(opts: {
  to: string
  truckName: string
  truckId?: string | null
  /** Defaults to production schedule campaign; use test campaign for test sends. */
  campaign?: string
}): Promise<VendorReminderSendResult> {
  const key = process.env.RESEND_API_KEY
  const from =
    process.env.RESEND_FROM_EMAIL?.trim() || "Food Truck CLT <noreply@foodtruckclt.com>"
  const to = opts.to.trim()
  if (!key) {
    return { ok: false, error: "RESEND_API_KEY is not configured" }
  }
  if (!to) {
    return { ok: false, error: "Missing recipient email" }
  }

  const campaign =
    opts.campaign ??
    (opts.truckId
      ? VENDOR_EMAIL_CAMPAIGN_SCHEDULE_REMINDER
      : VENDOR_EMAIL_CAMPAIGN_SCHEDULE_REMINDER_TEST)

  try {
    const { Resend } = await import("resend")
    const resend = new Resend(key)
    const { data, error } = await resend.emails.send({
      from,
      to,
      subject: VENDOR_SCHEDULE_REMINDER_SUBJECT,
      html: buildVendorScheduleReminderHtml(),
    })
    if (error) {
      return { ok: false, error: error.message ?? String(error) }
    }
    const resendEmailId = data?.id ? String(data.id) : undefined
    if (resendEmailId) {
      void insertVendorEmailEvent({
        resendEmailId,
        vendorEmail: to,
        truckId: opts.truckId ?? null,
        campaign,
        eventType: "dispatch.log",
        rawPayload: {
          template: "vendor_schedule_reminder",
          subject: VENDOR_SCHEDULE_REMINDER_SUBJECT,
        },
      })
    }
    return { ok: true, resendEmailId }
  } catch (e) {
    const message = e instanceof Error ? e.message : String(e)
    return { ok: false, error: message }
  }
}

export function logVendorReminderAttempt(entry: {
  vendorId: string
  email: string
  status: "sent" | "failed"
  errorMessage: string | null
}): void {
  console.log(
    "[vendor-reminder]",
    JSON.stringify({
      timestamp: new Date().toISOString(),
      vendorId: entry.vendorId,
      email: entry.email,
      sent: entry.status === "sent",
      errorMessage: entry.errorMessage,
    })
  )
}
