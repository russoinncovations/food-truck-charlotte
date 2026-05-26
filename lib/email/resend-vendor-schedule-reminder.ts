import {
  PUBLIC_LIVE_MAP_URL,
  VENDOR_EMAIL_GO_LIVE_DASHBOARD_URL,
} from "@/lib/email/vendor-email-public-links"
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

export const VENDOR_SCHEDULE_REMINDER_SUBJECT =
  "Going out this week? Add yourself to the FoodTruckCLT map"

export function buildVendorScheduleReminderHtml(): string {
  const goLiveHref = VENDOR_EMAIL_GO_LIVE_DASHBOARD_URL
  const goLiveLabel = escapeHtml(goLiveHref)
  const mapHref = PUBLIC_LIVE_MAP_URL
  const mapLabel = escapeHtml(mapHref)
  return `
<p>Hi everyone,</p>
<p>We&apos;re starting to push more people to the FoodTruckCLT live map so customers can find trucks in real time.</p>
<p>If you&apos;re serving this week, add your location or turn your live pin on here:</p>
<p><a href="${goLiveHref}">${goLiveLabel}</a></p>
<p>You can also save that page to your phone&apos;s home screen so it&apos;s easy to tap when you&apos;re out serving.</p>
<p>When you&apos;re done for the day, just turn your live pin off so the map stays accurate.</p>
<p><strong>Live map:</strong><br />
<a href="${mapHref}">${mapLabel}</a></p>
<p>Let&apos;s make it easier for people to find you.</p>
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
