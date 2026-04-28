import type { SupabaseClient } from "@supabase/supabase-js"
import {
  BOOKING_REQUEST_TYPE,
  type BookingRequestTypeValue,
} from "@/lib/booking/booking-request-constants"

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

function adminInboxEmail(): string | null {
  const a = process.env.INQUIRY_TO_EMAIL?.trim()
  if (a) return a
  const b = process.env.NEXT_PUBLIC_SUPPORT_EMAIL?.trim()
  if (b) return b
  return null
}

export async function completeBookingRequest(
  supabase: SupabaseClient,
  row: BookingInsertRow
): Promise<CompleteResult> {
  const { data, error } = await supabase
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

  let vendorEmail: string | null = null
  let vendorName: string | null = null

  if (isSpecific) {
    const { data: truckRow } = await supabase
      .from("trucks")
      .select("id, name, email")
      .eq("id", row.truck_id as string)
      .maybeSingle()

    if (truckRow) {
      vendorName = (truckRow.name as string) ?? row.preferred_trucks ?? "Vendor"
      vendorEmail = (truckRow.email as string | null)?.trim() || null
    }

    await supabase.from("truck_opportunities").insert({
      booking_request_id: id,
      truck_id: row.truck_id,
      status: "pending",
    })
  }

  if (isBroadcast) {
    const { data: listedTrucks } = await supabase
      .from("trucks")
      .select("id")
      .eq("show_in_directory", true)

    const rows =
      listedTrucks?.map((t) => ({
        booking_request_id: id,
        truck_id: t.id as string,
        status: "pending" as const,
      })) ?? []

    if (rows.length > 0) {
      const { error: oppErr } = await supabase.from("truck_opportunities").insert(rows)
      if (oppErr) {
        console.error("[booking] truck_opportunities broadcast insert:", oppErr)
      }
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
          <p><a href="https://www.foodtruckclt.com/admin/bookings">Open admin bookings</a></p>
          <p>— FoodTruck CLT</p>
        `,
        })
      }

      if (isSpecific && vendorEmail) {
        await resend.emails.send({
          from,
          to: vendorEmail,
          subject: "New booking request — " + (row.event_type || "Event"),
          html: `
          <h2>New booking request for ${vendorName}</h2>
          <p>A host submitted a request and selected your truck.</p>
          <ul>
            <li><strong>Event type:</strong> ${row.event_type || "Not specified"}</li>
            <li><strong>Date:</strong> ${row.event_date || "Not specified"}</li>
            <li><strong>Location:</strong> ${row.city || "Charlotte"}</li>
            <li><strong>Guest count:</strong> ${row.guest_count || "Not specified"}</li>
          </ul>
          <p>Log in to your vendor dashboard to respond:</p>
          <a href="https://www.foodtruckclt.com/vendor-login">View request</a>
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
