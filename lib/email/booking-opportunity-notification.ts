import type { SupabaseClient } from "@supabase/supabase-js"
import type { BookingInsertRow } from "@/lib/booking/complete-booking-request"
import { BOOKING_NOTIFICATION_STATUS } from "@/lib/booking/booking-notification-status"
import { resolveVendorBookingFromEmail } from "@/lib/email/booking-vendor-from"
import { buildVendorBookingLeadEmail } from "@/lib/email/booking-vendor-lead-email"
import { VENDOR_EMAIL_CAMPAIGN_BOOKING_LEAD } from "@/lib/email/vendor-email-campaigns"
import { insertVendorEmailEvent } from "@/lib/email/vendor-email-events"
import { isPlausibleVendorEmail } from "@/lib/trucks/vendor-reminder-recipients"

export type BookingOpportunityRef = {
  id: string
  truck_id: string
}

type TruckRow = {
  id: string
  name: string
  email: string | null
}

export type SendBookingNotificationResult =
  | { ok: true; status: string; resendEmailId?: string }
  | { ok: false; status: string; error: string }

async function loadTruckMap(
  db: SupabaseClient,
  truckIds: string[]
): Promise<Map<string, TruckRow>> {
  const uniqueIds = [...new Set(truckIds.filter(Boolean))]
  if (uniqueIds.length === 0) return new Map()

  const { data, error } = await db.from("trucks").select("id, name, email").in("id", uniqueIds)
  if (error) {
    console.error("[booking-notification] truck lookup:", error.message)
    return new Map()
  }

  return new Map(
    (data ?? []).map((t) => [
      String(t.id),
      {
        id: String(t.id),
        name: String(t.name ?? "").trim() || "your truck",
        email: (t.email as string | null) ?? null,
      },
    ])
  )
}

async function patchOpportunityNotification(
  db: SupabaseClient,
  opportunityId: string,
  patch: Record<string, unknown>
): Promise<void> {
  const { error } = await db.from("truck_opportunities").update(patch).eq("id", opportunityId)
  if (error) {
    console.error("[booking-notification] opportunity update:", opportunityId, error.message)
  }
}

/**
 * Sends one vendor booking lead email and records notification fields on the opportunity.
 */
export async function sendBookingNotificationForOpportunity(
  db: SupabaseClient,
  booking: BookingInsertRow,
  opportunity: BookingOpportunityRef,
  truck: TruckRow,
  bookingRequestId?: string | null
): Promise<SendBookingNotificationResult> {
  const email = String(truck.email ?? "").trim()

  if (!isPlausibleVendorEmail(email)) {
    await patchOpportunityNotification(db, opportunity.id, {
      notification_status: BOOKING_NOTIFICATION_STATUS.NOT_ELIGIBLE_NO_EMAIL,
      notification_email: null,
      notification_error: "No valid vendor email on file",
    })
    return {
      ok: false,
      status: BOOKING_NOTIFICATION_STATUS.NOT_ELIGIBLE_NO_EMAIL,
      error: "No valid vendor email on file",
    }
  }

  const resendKey = process.env.RESEND_API_KEY?.trim()
  if (!resendKey) {
    await patchOpportunityNotification(db, opportunity.id, {
      notification_status: BOOKING_NOTIFICATION_STATUS.DASHBOARD_ONLY,
      notification_email: email,
      notification_error: "RESEND_API_KEY is not configured",
    })
    return {
      ok: false,
      status: BOOKING_NOTIFICATION_STATUS.DASHBOARD_ONLY,
      error: "RESEND_API_KEY is not configured",
    }
  }

  const from = resolveVendorBookingFromEmail()
  const { subject, html, text } = buildVendorBookingLeadEmail(booking, truck.name)

  try {
    const { Resend } = await import("resend")
    const resend = new Resend(resendKey)
    const { data, error: sendErr } = await resend.emails.send({
      from,
      to: email,
      subject,
      html,
      text,
    })

    if (sendErr) {
      const msg = sendErr.message ?? String(sendErr)
      await patchOpportunityNotification(db, opportunity.id, {
        notification_status: BOOKING_NOTIFICATION_STATUS.FAILED,
        notification_email: email,
        notification_sent_at: new Date().toISOString(),
        notification_error: msg,
        resend_email_id: null,
      })
      return { ok: false, status: BOOKING_NOTIFICATION_STATUS.FAILED, error: msg }
    }

    const resendEmailId = data?.id ? String(data.id) : null
    const sentAt = new Date().toISOString()

    await patchOpportunityNotification(db, opportunity.id, {
      notification_status: BOOKING_NOTIFICATION_STATUS.SENT,
      notification_email: email,
      notification_sent_at: sentAt,
      resend_email_id: resendEmailId,
      notification_error: null,
      failed_at: null,
    })

    if (resendEmailId) {
      void insertVendorEmailEvent({
        resendEmailId,
        vendorEmail: email,
        truckId: truck.id,
        campaign: VENDOR_EMAIL_CAMPAIGN_BOOKING_LEAD,
        eventType: "dispatch.log",
        rawPayload: {
          template: "booking_vendor_lead",
          subject,
          truck_opportunity_id: opportunity.id,
          booking_request_id: bookingRequestId ?? null,
        },
      })
    }

    return {
      ok: true,
      status: BOOKING_NOTIFICATION_STATUS.SENT,
      resendEmailId: resendEmailId ?? undefined,
    }
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e)
    await patchOpportunityNotification(db, opportunity.id, {
      notification_status: BOOKING_NOTIFICATION_STATUS.FAILED,
      notification_email: email,
      notification_sent_at: new Date().toISOString(),
      notification_error: msg,
    })
    return { ok: false, status: BOOKING_NOTIFICATION_STATUS.FAILED, error: msg }
  }
}

/**
 * After opportunity fan-out, send booking notifications and record per-opportunity status.
 */
export async function processBookingOpportunityNotifications(
  db: SupabaseClient,
  booking: BookingInsertRow,
  opportunities: BookingOpportunityRef[],
  bookingRequestId?: string | null
): Promise<void> {
  if (opportunities.length === 0) return

  const truckMap = await loadTruckMap(
    db,
    opportunities.map((o) => o.truck_id)
  )

  for (const opp of opportunities) {
    const truck = truckMap.get(opp.truck_id)
    if (!truck) {
      await patchOpportunityNotification(db, opp.id, {
        notification_status: BOOKING_NOTIFICATION_STATUS.DASHBOARD_ONLY,
        notification_error: "Truck record not found",
      })
      continue
    }
    await sendBookingNotificationForOpportunity(db, booking, opp, truck, bookingRequestId)
  }
}
