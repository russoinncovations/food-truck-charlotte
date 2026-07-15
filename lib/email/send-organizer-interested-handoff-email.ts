import type { SupabaseClient } from "@supabase/supabase-js"
import type { BookingInsertRow } from "@/lib/booking/complete-booking-request"
import {
  buildOrganizerInterestedHandoffEmail,
  buildOrganizerInterestedHandoffSubject,
  type OrganizerHandoffTruck,
} from "@/lib/email/booking-organizer-interested-handoff-email"

const TRUCK_SELECT =
  "id, name, slug, cuisine, cuisine_types, short_description, description, booking_email, booking_phone, website, instagram"

export type SendOrganizerInterestedHandoffResult =
  | { ok: true }
  | { ok: false; error: string; skipped?: boolean }

function siteBaseUrl(): string {
  const env =
    process.env.NEXT_PUBLIC_SITE_URL?.trim() ||
    process.env.NEXT_PUBLIC_APP_URL?.trim() ||
    "https://www.foodtruckclt.com"
  return env.replace(/\/$/, "")
}

export async function sendOrganizerInterestedHandoffEmail(
  db: SupabaseClient,
  args: {
    bookingRequestId: string
    truckId: string
    booking: Pick<
      BookingInsertRow,
      | "event_type"
      | "event_date"
      | "city"
      | "contact_name"
      | "contact_email"
      | "venue_name"
    >
  }
): Promise<SendOrganizerInterestedHandoffResult> {
  const organizerEmail = (args.booking.contact_email ?? "").trim()
  if (!organizerEmail) {
    return { ok: false, error: "Organizer email missing", skipped: true }
  }

  const { data: truckRow, error: truckErr } = await db
    .from("trucks")
    .select(TRUCK_SELECT)
    .eq("id", args.truckId)
    .maybeSingle()

  if (truckErr || !truckRow) {
    return { ok: false, error: truckErr?.message ?? "Truck not found" }
  }

  const truck: OrganizerHandoffTruck = {
    name: String(truckRow.name ?? "").trim() || "Food truck",
    slug: (truckRow.slug as string | null) ?? null,
    cuisine: (truckRow.cuisine as string | null) ?? null,
    cuisine_types: (truckRow.cuisine_types as string[] | null) ?? null,
    short_description: (truckRow.short_description as string | null) ?? null,
    description: (truckRow.description as string | null) ?? null,
    booking_email: (truckRow.booking_email as string | null) ?? null,
    booking_phone: (truckRow.booking_phone as string | null) ?? null,
    website: (truckRow.website as string | null) ?? null,
    instagram: (truckRow.instagram as string | null) ?? null,
  }

  const profilePath = truck.slug ? `/trucks/${truck.slug}` : "/trucks"
  const profileUrl = `${siteBaseUrl()}${profilePath}`
  const subject = buildOrganizerInterestedHandoffSubject(args.booking, truck.name)
  const { html, text } = buildOrganizerInterestedHandoffEmail({
    booking: args.booking,
    truck,
    profileUrl,
  })

  const resendKey = process.env.RESEND_API_KEY?.trim()
  const from =
    process.env.RESEND_FROM_EMAIL?.trim() || "FoodTruck CLT <noreply@foodtruckclt.com>"

  if (!resendKey) {
    console.warn("[organizer-handoff] RESEND_API_KEY missing; skipping organizer email")
    return { ok: false, error: "Email service unavailable", skipped: true }
  }

  try {
    const { Resend } = await import("resend")
    const resend = new Resend(resendKey)
    const { error } = await resend.emails.send({
      from,
      to: organizerEmail,
      subject,
      html,
      text,
    })
    if (error) {
      return { ok: false, error: error.message ?? "Resend send failed" }
    }
    return { ok: true }
  } catch (e) {
    const message = e instanceof Error ? e.message : "Resend send failed"
    return { ok: false, error: message }
  }
}
