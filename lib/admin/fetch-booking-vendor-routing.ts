import { createClient } from "@/lib/supabase/server"
import { createAdminSupabaseClient } from "@/lib/supabase/admin"
import {
  bookingNotificationDeliveryLabel,
  bookingNotificationNeedsOutreach,
  BOOKING_NOTIFICATION_STATUS_LABEL,
  type BookingNotificationStatus,
} from "@/lib/booking/booking-notification-status"

export type VendorOpportunityAdminRow = {
  id: string
  truck_id: string
  status: string
  created_at: string | null
  sent_at: string | null
  responded_at: string | null
  notification_status: string | null
  notification_email: string | null
  notification_sent_at: string | null
  resend_email_id: string | null
  delivered_at: string | null
  bounced_at: string | null
  failed_at: string | null
  complained_at: string | null
  reminder_sent_at: string | null
  notification_error: string | null
  truck_name: string | null
  truck_email: string | null
  truck_phone: string | null
  notification_status_label: string
  delivery_status_label: string
  needs_manual_outreach: boolean
}

type OppRow = {
  id: string
  truck_id: string
  status: string
  created_at: string | null
  sent_at?: string | null
  responded_at?: string | null
  notification_status?: string | null
  notification_email?: string | null
  notification_sent_at?: string | null
  resend_email_id?: string | null
  delivered_at?: string | null
  bounced_at?: string | null
  failed_at?: string | null
  complained_at?: string | null
  reminder_sent_at?: string | null
  notification_error?: string | null
}

const OPP_SELECT =
  "id, truck_id, status, created_at, sent_at, responded_at, notification_status, notification_email, notification_sent_at, resend_email_id, delivered_at, bounced_at, failed_at, complained_at, reminder_sent_at, notification_error"

function deliveryStatusLabel(notificationStatus: string | null): string {
  const s = (notificationStatus ?? "").toLowerCase()
  if (s === "delivered") return "Delivered"
  if (s === "bounced") return "Bounced"
  if (s === "failed") return "Failed"
  if (s === "complained") return "Complained"
  if (s === "sent") return "Awaiting delivery confirmation"
  if (s === "queued") return "Queued"
  if (s === "dashboard_only") return "No email send"
  if (s === "not_eligible_no_email") return "No email on file"
  return "—"
}

function notificationStatusLabel(status: string | null): string {
  const s = (status ?? "").toLowerCase()
  if (s && s in BOOKING_NOTIFICATION_STATUS_LABEL) {
    return BOOKING_NOTIFICATION_STATUS_LABEL[s as BookingNotificationStatus]
  }
  if (!s) return "Opportunity created"
  return bookingNotificationDeliveryLabel(status)
}

/**
 * Loads truck_opportunities for a booking request. Prefer service role so admin UI works
 * without a vendor session (RLS otherwise hides most rows).
 */
export async function fetchVendorRoutingForBookingRequest(
  bookingRequestId: string
): Promise<{
  rows: VendorOpportunityAdminRow[]
  usedServiceRole: boolean
  fetchError: string | null
}> {
  const id = bookingRequestId.trim()
  if (!id) {
    return { rows: [], usedServiceRole: false, fetchError: "Missing booking id" }
  }

  const admin = createAdminSupabaseClient()
  const client = admin ?? (await createClient())
  const usedServiceRole = Boolean(admin)

  const selectFull = async (): Promise<{ data: OppRow[] | null; error: { message: string } | null }> => {
    const res = await client
      .from("truck_opportunities")
      .select(OPP_SELECT)
      .eq("booking_request_id", id)
      .order("created_at", { ascending: true })
    return { data: res.data as OppRow[] | null, error: res.error }
  }

  let { data: opps, error } = await selectFull()

  if (error) {
    console.error("[admin] truck_opportunities for booking:", error)
    if (
      error.message?.includes("notification_status") ||
      error.message?.includes("sent_at") ||
      error.message?.includes("responded_at")
    ) {
      const res2 = await client
        .from("truck_opportunities")
        .select("id, truck_id, status, created_at")
        .eq("booking_request_id", id)
        .order("created_at", { ascending: true })
      if (res2.error) {
        console.error("[admin] truck_opportunities fallback:", res2.error)
        return { rows: [], usedServiceRole, fetchError: res2.error.message }
      }
      opps = res2.data as OppRow[] | null
      error = null
    } else {
      return { rows: [], usedServiceRole, fetchError: error.message }
    }
  }

  const list = opps ?? []
  const truckIds = [...new Set(list.map((o) => o.truck_id).filter(Boolean))]

  let truckMap = new Map<string, { name: string | null; email: string | null; phone: string | null }>()
  if (truckIds.length > 0) {
    const { data: trucks, error: truckErr } = await client
      .from("trucks")
      .select("id, name, email, booking_phone")
      .in("id", truckIds)

    if (truckErr) {
      console.error("[admin] trucks for opportunities:", truckErr)
    } else {
      truckMap = new Map(
        (trucks ?? []).map((t) => [
          t.id as string,
          {
            name: (t.name as string | null) ?? null,
            email: (t.email as string | null) ?? null,
            phone: (t.booking_phone as string | null) ?? null,
          },
        ])
      )
    }
  }

  const rows: VendorOpportunityAdminRow[] = list.map((r) => {
    const t = truckMap.get(r.truck_id) ?? { name: null, email: null, phone: null }
    const notificationStatus = r.notification_status ?? null
    return {
      id: r.id,
      truck_id: r.truck_id,
      status: r.status,
      created_at: r.created_at,
      sent_at: r.sent_at ?? null,
      responded_at: r.responded_at ?? null,
      notification_status: notificationStatus,
      notification_email: r.notification_email ?? null,
      notification_sent_at: r.notification_sent_at ?? null,
      resend_email_id: r.resend_email_id ?? null,
      delivered_at: r.delivered_at ?? null,
      bounced_at: r.bounced_at ?? null,
      failed_at: r.failed_at ?? null,
      complained_at: r.complained_at ?? null,
      reminder_sent_at: r.reminder_sent_at ?? null,
      notification_error: r.notification_error ?? null,
      truck_name: t.name,
      truck_email: t.email,
      truck_phone: t.phone,
      notification_status_label: notificationStatusLabel(notificationStatus),
      delivery_status_label: deliveryStatusLabel(notificationStatus),
      needs_manual_outreach: bookingNotificationNeedsOutreach(notificationStatus),
    }
  })

  return { rows, usedServiceRole, fetchError: null }
}
