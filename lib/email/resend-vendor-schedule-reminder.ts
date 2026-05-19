import { getPublicSiteBase } from "@/lib/email/public-site-base"
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

export const VENDOR_SCHEDULE_REMINDER_SUBJECT = "Serving this week? Add your schedule to FoodTruckCLT"

export function buildVendorScheduleReminderHtml(truckName: string, dashboardUrl: string): string {
  /** Greeting: bulk uses trucks.name (business name); test send uses "Nicole". Empty → "Hi there,". */
  const name = escapeHtml((truckName ?? "").trim() || "there")
  const dash = escapeHtml(dashboardUrl)
  return `
<p>Hi ${name},</p>
<p>If you're serving this week, take a minute to add your locations or mark yourself live on FoodTruckCLT.</p>
<p>Trucks with current locations are easier for customers, event hosts, breweries, neighborhoods, and offices to find.</p>
<p>You can log in here:</p>
<p><a href="${dash}">${dash}</a></p>
<p>When you're parked and serving, use:</p>
<p><strong>"I'm Serving Now — Add Me to the Map"</strong></p>
<p>Thanks for helping make FoodTruckCLT a more useful Charlotte food truck guide.</p>
<p>If you do not want reminder emails, reply and we'll remove you from future reminders.</p>
<p>— FoodTruckCLT</p>
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
    process.env.RESEND_FROM_EMAIL?.trim() || "FoodTruck CLT <noreply@foodtruckclt.com>"
  const to = opts.to.trim()
  if (!key) {
    return { ok: false, error: "RESEND_API_KEY is not configured" }
  }
  if (!to) {
    return { ok: false, error: "Missing recipient email" }
  }

  const dashboardUrl = `${getPublicSiteBase()}/dashboard`
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
      html: buildVendorScheduleReminderHtml(opts.truckName, dashboardUrl),
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
