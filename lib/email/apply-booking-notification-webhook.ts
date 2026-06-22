import { createAdminSupabaseClient } from "@/lib/supabase/admin"
import {
  BOOKING_NOTIFICATION_STATUS,
  BOOKING_RESEND_DELIVERY_EVENTS,
  type BookingNotificationStatus,
} from "@/lib/booking/booking-notification-status"
import { VENDOR_EMAIL_CAMPAIGN_BOOKING_LEAD } from "@/lib/email/vendor-email-campaigns"

type OpportunityPatch = {
  notification_status: BookingNotificationStatus
  delivered_at?: string
  bounced_at?: string
  failed_at?: string
  complained_at?: string
}

function timestampColumnForEvent(eventType: string): keyof OpportunityPatch | null {
  switch (eventType) {
    case "email.delivered":
      return "delivered_at"
    case "email.bounced":
      return "bounced_at"
    case "email.failed":
      return "failed_at"
    case "email.complained":
      return "complained_at"
    default:
      return null
  }
}

/**
 * Updates truck_opportunities delivery fields when Resend reports lifecycle events
 * for booking lead emails. Skips reminder campaign dispatches.
 */
export async function applyBookingNotificationWebhookEvent(opts: {
  resendEmailId: string
  eventType: string
  eventTimestamp: string
  campaign: string | null
}): Promise<boolean> {
  const emailId = opts.resendEmailId.trim()
  if (!emailId) return false

  const nextStatus = BOOKING_RESEND_DELIVERY_EVENTS[opts.eventType]
  if (!nextStatus) return false

  if (opts.campaign && opts.campaign !== VENDOR_EMAIL_CAMPAIGN_BOOKING_LEAD) {
    return false
  }

  const admin = createAdminSupabaseClient()
  if (!admin) return false

  const { data: opp, error: lookupErr } = await admin
    .from("truck_opportunities")
    .select("id, notification_status, resend_email_id")
    .eq("resend_email_id", emailId)
    .maybeSingle()

  if (lookupErr) {
    console.error("[booking-notification-webhook] lookup:", lookupErr.message)
    return false
  }
  if (!opp?.id) return false

  const ts = opts.eventTimestamp.trim() || new Date().toISOString()
  const patch: OpportunityPatch = { notification_status: nextStatus }
  const col = timestampColumnForEvent(opts.eventType)
  if (col && col !== "notification_status") {
    patch[col] = ts
  }

  const { error: updateErr } = await admin.from("truck_opportunities").update(patch).eq("id", opp.id)
  if (updateErr) {
    console.error("[booking-notification-webhook] update:", updateErr.message, emailId)
    return false
  }

  console.log("[booking-notification-webhook] updated opportunity:", opp.id, opts.eventType)
  return true
}

/** Resolve campaign for webhook when dispatch row may include truck_opportunity_id. */
export async function lookupBookingOpportunityIdForResendEmail(
  resendEmailId: string
): Promise<string | null> {
  const admin = createAdminSupabaseClient()
  if (!admin || !resendEmailId.trim()) return null

  const { data, error } = await admin
    .from("vendor_email_events")
    .select("raw_payload, campaign, event_type")
    .eq("resend_email_id", resendEmailId.trim())
    .eq("event_type", "dispatch.log")
    .order("created_at", { ascending: true })
    .limit(5)

  if (error || !data?.length) return null

  for (const row of data) {
    const campaign = row.campaign as string | null
    if (campaign !== VENDOR_EMAIL_CAMPAIGN_BOOKING_LEAD) continue
    const payload = row.raw_payload as { truck_opportunity_id?: unknown } | null
    const id = payload?.truck_opportunity_id
    if (typeof id === "string" && id.trim()) return id.trim()
  }
  return null
}

/** When webhook arrives before resend_email_id is on the opportunity row, link by dispatch payload. */
export async function ensureBookingOpportunityResendLink(
  resendEmailId: string,
  opportunityId: string
): Promise<void> {
  const admin = createAdminSupabaseClient()
  if (!admin) return

  const { data } = await admin
    .from("truck_opportunities")
    .select("resend_email_id")
    .eq("id", opportunityId)
    .maybeSingle()

  if (data?.resend_email_id) return

  await admin
    .from("truck_opportunities")
    .update({ resend_email_id: resendEmailId })
    .eq("id", opportunityId)
}

export { BOOKING_NOTIFICATION_STATUS }
