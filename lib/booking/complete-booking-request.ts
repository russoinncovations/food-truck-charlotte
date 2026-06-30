import type { SupabaseClient } from "@supabase/supabase-js"
import {
  BOOKING_REQUEST_TYPE,
  type BookingRequestTypeValue,
} from "@/lib/booking/booking-request-constants"
import { fetchEligibleTruckIdsForBroadcast } from "@/lib/booking/eligible-trucks-for-opportunities"
import { bookingOpportunityExpiresAt } from "@/lib/booking/opportunity-expiration"
import {
  BOOKING_START_TIME_REQUIRED_MESSAGE,
  isBookingStartTimePresent,
} from "@/lib/booking/validate-booking-event-time"
import { getConfiguredAdminKey } from "@/lib/admin/verify-admin-key"
import { sendBookingVendorLeadEmails } from "@/lib/email/send-booking-vendor-lead-emails"
import { createAdminSupabaseClient, getAdminSupabaseEnvDiagnostics, describeAdminClientInitFailure } from "@/lib/supabase/admin"

const DEFAULT_PRODUCTION_SITE_BASE = "https://www.foodtruckclt.com"

/** Canonical production-safe site base for server-generated admin notification links. */
export function resolveProductionSiteBaseUrl(): string {
  const base =
    process.env.NEXT_PUBLIC_APP_URL?.trim() ||
    process.env.NEXT_PUBLIC_SITE_URL?.trim() ||
    process.env.PUBLIC_SITE_URL?.trim() ||
    DEFAULT_PRODUCTION_SITE_BASE
  return base.replace(/\/+$/, "")
}

/** Admin booking notification CTA — detail route when ADMIN_KEY is configured, else generic list. */
export function buildAdminBookingNotificationUrl(bookingId: string): string {
  const base = resolveProductionSiteBaseUrl()
  const adminKey = getConfiguredAdminKey()
  const id = bookingId.trim()
  if (adminKey && id) {
    return `${base}/admin/bookings/${id}?key=${encodeURIComponent(adminKey)}`
  }
  return `${base}/admin/bookings`
}

export { BOOKING_REQUEST_TYPE }
export type { BookingRequestTypeValue }

/** DB-facing row for booking_requests — use snake_case keys matching columns. */
export type BookingInsertRow = {
  event_type: string
  event_date: string
  start_time: string
  end_time: string
  guest_count: number
  venue_name: string | null
  street_address: string
  city: string
  state: string
  zip_code: string
  cuisines: string[] | null
  dietary_requirements: string[] | null
  budget_range: string | null
  contact_name: string
  contact_email: string
  contact_phone: string
  organization: string | null
  additional_notes: string | null
  status: string
  request_type: BookingRequestTypeValue
  truck_id: string | null
  vendor_type: string | null
  preferred_trucks: string | null
  how_heard_about_us?: string | null
}

type CompleteResult = { ok: true; id: string } | { ok: false; error: string }

export type CompleteBookingRequestOptions = {
  /** Admin internal-test open requests: fan-out only to these truck IDs (no public listed trucks). */
  broadcastTruckIds?: string[]
}

function adminInboxEmail(): string | null {
  const a = process.env.INQUIRY_TO_EMAIL?.trim()
  if (a) return a
  const b = process.env.NEXT_PUBLIC_SUPPORT_EMAIL?.trim()
  if (b) return b
  return null
}

export async function completeBookingRequest(
  supabase: SupabaseClient,
  row: BookingInsertRow,
  opts?: CompleteBookingRequestOptions
): Promise<CompleteResult> {
  if (!isBookingStartTimePresent(row.start_time)) {
    return { ok: false, error: BOOKING_START_TIME_REQUIRED_MESSAGE }
  }

  /** Server-only persistence: service role bypasses RLS for insert + returning id. */
  const persistDb = createAdminSupabaseClient()
  if (!persistDb) {
    console.error(
      "[booking] Admin Supabase client unavailable — insert/routing may use session client or fail:",
      describeAdminClientInitFailure(getAdminSupabaseEnvDiagnostics())
    )
  }
  const db = persistDb ?? supabase

  const { data, error } = await db
    .from("booking_requests")
    .insert(row as Record<string, unknown>)
    .select("id")
    .single()

  if (error || !data?.id) {
    return {
      ok: false,
      error: error?.message ?? "Could not save booking request",
    }
  }

  const id = data.id as string

  const isSpecific =
    row.request_type === BOOKING_REQUEST_TYPE.SPECIFIC_VENDOR && row.truck_id

  const isBroadcast =
    row.request_type === BOOKING_REQUEST_TYPE.OPEN_REQUEST ||
    row.request_type === BOOKING_REQUEST_TYPE.CUISINE_MATCH

  /** Opportunity fan-out is server-only; bypass anon INSERT policy (RLS Phase 2). */
  const oppDb = persistDb ?? createAdminSupabaseClient()
  if (!oppDb && (isSpecific || isBroadcast)) {
    console.error(
      "[booking] truck_opportunities: admin client unavailable:",
      describeAdminClientInitFailure(getAdminSupabaseEnvDiagnostics())
    )
  }

  const vendorNotifyOpportunities: { id: string; truck_id: string }[] = []
  const routedAt = new Date().toISOString()
  const expiresAt = bookingOpportunityExpiresAt(row.event_date, row.end_time, row.start_time)

  if (isSpecific && oppDb) {
    const { data: inserted, error: oppErr } = await oppDb
      .from("truck_opportunities")
      .insert({
        booking_request_id: id,
        truck_id: row.truck_id,
        status: "pending",
        routed_at: routedAt,
        expires_at: expiresAt,
      })
      .select("id, truck_id")
      .single()
    if (oppErr) {
      console.error("[booking] truck_opportunities specific insert:", oppErr)
    } else if (inserted?.id && inserted.truck_id) {
      vendorNotifyOpportunities.push({
        id: String(inserted.id),
        truck_id: String(inserted.truck_id),
      })
    }
  }

  if (isBroadcast && oppDb) {
    const requestType =
      row.request_type === BOOKING_REQUEST_TYPE.CUISINE_MATCH ? "cuisine_match" : "open_request"
    const truckIds =
      opts?.broadcastTruckIds && opts.broadcastTruckIds.length > 0
        ? opts.broadcastTruckIds
        : await fetchEligibleTruckIdsForBroadcast(db, {
            requestType,
            cuisines: row.cuisines,
            vendorType: row.vendor_type,
          })

    const rows = truckIds.map((truckId) => ({
      booking_request_id: id,
      truck_id: truckId,
      status: "pending" as const,
      routed_at: routedAt,
      expires_at: expiresAt,
    }))

    if (rows.length > 0) {
      const { data: insertedRows, error: oppErr } = await oppDb
        .from("truck_opportunities")
        .insert(rows)
        .select("id, truck_id")
      if (oppErr) {
        console.error("[booking] truck_opportunities broadcast insert:", oppErr)
      } else {
        for (const r of insertedRows ?? []) {
          if (r?.id && r.truck_id) {
            vendorNotifyOpportunities.push({
              id: String(r.id),
              truck_id: String(r.truck_id),
            })
          }
        }
      }
    }
  }

  if (oppDb && vendorNotifyOpportunities.length > 0) {
    try {
      await sendBookingVendorLeadEmails(oppDb, row, vendorNotifyOpportunities, id)
    } catch (e) {
      console.error("[booking] vendor lead emails:", e)
    }
  }

  const resendKey = process.env.RESEND_API_KEY
  const from =
    process.env.RESEND_FROM_EMAIL?.trim() ||
    "FoodTruck CLT <noreply@foodtruckclt.com>"

  if (resendKey) {
    const { Resend } = await import("resend")
    const resend = new Resend(resendKey)

    const summaryLines = [
      `<li><strong>Request type:</strong> ${row.request_type}</li>`,
      row.vendor_type ? `<li><strong>Vendor type:</strong> ${row.vendor_type}</li>` : "",
      row.preferred_trucks
        ? `<li><strong>Requested vendor:</strong> ${row.preferred_trucks}</li>`
        : "",
      `<li><strong>Event type:</strong> ${row.event_type || "—"}</li>`,
      `<li><strong>Date:</strong> ${row.event_date || "—"}</li>`,
      `<li><strong>Location:</strong> ${row.city || "—"}</li>`,
      `<li><strong>Guests:</strong> ${row.guest_count}</li>`,
      `<li><strong>Contact:</strong> ${row.contact_name} &lt;${row.contact_email}&gt;</li>`,
    ]
      .filter(Boolean)
      .join("\n")

    const adminTo = adminInboxEmail()
    const adminBookingUrl = buildAdminBookingNotificationUrl(id)

    try {
      if (adminTo) {
        await resend.emails.send({
          from,
          to: adminTo,
          subject: `New booking request — ${row.event_type || "event"} (${row.request_type})`,
          html: `
          <h2>New booking request</h2>
          <p><strong>Request ID:</strong> ${id}</p>
          <ul>${summaryLines}</ul>
          <p><a href="${adminBookingUrl}">Open admin bookings</a></p>
          <p>— FoodTruck CLT</p>
        `,
        })
      }
    } catch (e) {
      console.error("[booking] Resend notification failed:", e)
    }
  }

  return { ok: true, id }
}
