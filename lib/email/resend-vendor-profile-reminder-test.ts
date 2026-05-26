/**
 * Vendor Shortcut + Live Map reminder — same HTML/subject for admin test send (`INQUIRY_TO_EMAIL`) and vendor bulk send.
 */

import {
  VENDOR_EMAIL_CAMPAIGN_PROFILE_PIN_REMINDER,
  VENDOR_EMAIL_CAMPAIGN_PROFILE_PIN_TEST,
} from "@/lib/email/vendor-email-campaigns"
import { insertVendorEmailEvent } from "@/lib/email/vendor-email-events"

export const VENDOR_PROFILE_REMINDER_SUBJECT =
  "FoodTruckCLT Vendor Shortcut + Live Map Reminder"

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
}

const VENDOR_GO_LIVE_URL = "https://vendor.foodtruckclt.com/dashboard/live"
const LIVE_MAP_URL = "https://live.foodtruckclt.com/map"

/** Vendor activation / Go Live reminder — shared by admin test send and vendor bulk send. */
export function buildVendorProfileReminderHtml(): string {
  const goLive = escapeHtml(VENDOR_GO_LIVE_URL)
  const liveMap = escapeHtml(LIVE_MAP_URL)
  return `
<p>Hi everyone,</p>
<p>FoodTruckCLT is now set up so vendors can quickly manage their live map location from their phone.</p>
<p>If you&apos;re serving, please use your vendor dashboard to turn your live pin on so people can find you in real time.</p>
<p><strong>Vendor Go Live page:</strong><br />
<a href="${VENDOR_GO_LIVE_URL}">${goLive}</a></p>
<p>If you are not already logged in, you&apos;ll be asked to enter your email and use the sign-in link. After that, the shortcut should take you directly to your vendor tools.</p>
<p><strong>A few reminders:</strong></p>
<ol>
  <li>
    <strong>Turn your live pin on when you&apos;re serving</strong><br />
    This helps customers find you on the live map.
  </li>
  <li>
    <strong>Turn it off when you&apos;re done</strong><br />
    This keeps the map accurate and helps people trust it.
  </li>
  <li>
    <strong>Update your photo/profile if needed</strong><br />
    The more complete your profile is, the better it looks when people find your truck.
  </li>
</ol>
<p><strong>Live map:</strong><br />
<a href="${LIVE_MAP_URL}">${liveMap}</a></p>
<p>Thank you for helping make this more useful for vendors and the Charlotte food truck community.</p>
<p>— Nicole<br />FoodTruckCLT</p>
`.trim()
}

export type VendorProfileReminderSendResult =
  | { ok: true; resendEmailId?: string }
  | { ok: false; error: string }

/** Single send — same HTML/subject for admin test and vendor bulk. */
export async function sendVendorProfileReminderEmail(opts: {
  to: string
  truckId?: string | null
  /** Defaults: production campaign when truckId set, test campaign otherwise. */
  campaign?: string
}): Promise<VendorProfileReminderSendResult> {
  const key = process.env.RESEND_API_KEY
  const from =
    process.env.RESEND_FROM_EMAIL?.trim() || "FoodTruck CLT <noreply@foodtruckclt.com>"

  if (!key) {
    return { ok: false, error: "RESEND_API_KEY is not configured" }
  }

  const trimmed = opts.to.trim()
  if (!trimmed || !trimmed.includes("@")) {
    return { ok: false, error: "Invalid recipient address" }
  }

  const campaign =
    opts.campaign ??
    (opts.truckId
      ? VENDOR_EMAIL_CAMPAIGN_PROFILE_PIN_REMINDER
      : VENDOR_EMAIL_CAMPAIGN_PROFILE_PIN_TEST)

  try {
    const { Resend } = await import("resend")
    const resend = new Resend(key)
    const html = buildVendorProfileReminderHtml()
    const { data, error } = await resend.emails.send({
      from,
      to: trimmed,
      subject: VENDOR_PROFILE_REMINDER_SUBJECT,
      html,
    })
    if (error) {
      return { ok: false, error: error.message ?? "Resend returned an error" }
    }
    const resendEmailId = data?.id ? String(data.id) : undefined
    if (resendEmailId) {
      void insertVendorEmailEvent({
        resendEmailId,
        vendorEmail: trimmed,
        truckId: opts.truckId ?? null,
        campaign,
        eventType: "dispatch.log",
        rawPayload: {
          template: "vendor_shortcut_live_map_reminder",
          subject: VENDOR_PROFILE_REMINDER_SUBJECT,
        },
      })
    }
    return { ok: true, resendEmailId }
  } catch (e) {
    const message = e instanceof Error ? e.message : "Unknown error"
    return { ok: false, error: message }
  }
}
