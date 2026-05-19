/**
 * “Profile + live pin” reminder — same HTML/subject for admin test and vendor bulk.
 */

import {
  VENDOR_EMAIL_CAMPAIGN_PROFILE_PIN_REMINDER,
  VENDOR_EMAIL_CAMPAIGN_PROFILE_PIN_TEST,
} from "@/lib/email/vendor-email-campaigns"
import { insertVendorEmailEvent } from "@/lib/email/vendor-email-events"

export const VENDOR_PROFILE_REMINDER_SUBJECT =
  "Quick FoodTruckCLT reminder: update your profile + drop your live pin"

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
}

const LOGIN_URL = "https://www.foodtruckclt.com/vendor-login"

/** Fixed vendor-facing body; preview is sent to admin only. */
export function buildVendorProfileReminderHtml(): string {
  return `
<p>Hi everyone,</p>
<p>FoodTruckCLT now has 67 trucks, carts, and tents listed, and I&apos;m getting ready to start sharing the site and live map more consistently in the Facebook group.</p>
<p>Before I do that, please take a few minutes to make sure your profile is ready.</p>
<p><strong>Please check:</strong></p>
<ol>
  <li>
    <strong>Your photo is updated</strong><br />
    Add a clear truck, cart, tent, logo, or food photo so people can recognize you.
  </li>
  <li>
    <strong>Your profile information is complete</strong><br />
    Make sure your cuisine, contact info, social links, and description are accurate.
  </li>
  <li>
    <strong>Drop your live location pin when you&apos;re serving</strong><br />
    This is the biggest one. I&apos;d love to help promote where trucks are each day, but I can&apos;t share your live location if there isn&apos;t a pin on the map.
  </li>
</ol>
<p><strong>Vendor login:</strong><br />
<a href="${LOGIN_URL}">${escapeHtml(LOGIN_URL)}</a></p>
<p>Please use the same email address this message was sent to when logging in, since your dashboard is connected to that email.</p>
<p>When you&apos;re out serving, log in and add your live location so people can find you in real time.</p>
<p>Thank you for helping make this more useful for both vendors and the community.</p>
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
          template: "vendor_profile_pin_reminder",
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
