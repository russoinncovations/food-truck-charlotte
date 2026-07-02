import type { BookingInsertRow } from "@/lib/booking/complete-booking-request"
import { EVENT_TYPES } from "@/lib/booking-types"
import { instagramHref, normalizeWebsiteUrl } from "@/lib/trucks/truck-profile-helpers"

export type OrganizerHandoffTruck = {
  name: string
  slug: string | null
  cuisine: string | null
  cuisine_types: string[] | null
  short_description: string | null
  description: string | null
  booking_email: string | null
  booking_phone: string | null
  website: string | null
  instagram: string | null
}

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
}

function trimOrNull(v: string | null | undefined): string | null {
  const t = (v ?? "").trim()
  return t || null
}

function formatEventDateLabel(dateStr: string | null | undefined): string {
  const raw = trimOrNull(dateStr)
  if (!raw) return "Date TBD"
  const d = new Date(`${raw}T12:00:00`)
  if (Number.isNaN(d.getTime())) return raw
  return d.toLocaleDateString("en-US", {
    weekday: "short",
    month: "short",
    day: "numeric",
    year: "numeric",
  })
}

function formatEventTypeLabel(eventType: string | null | undefined): string {
  const raw = trimOrNull(eventType)
  if (!raw) return "Event"
  return EVENT_TYPES.find((t) => t.value === raw)?.label ?? raw
}

function cuisineLine(truck: OrganizerHandoffTruck): string {
  const types = (truck.cuisine_types ?? []).map((c) => String(c).trim()).filter(Boolean)
  if (types.length > 0) return types.join(", ")
  return trimOrNull(truck.cuisine) ?? "Food truck"
}

function profileSummary(truck: OrganizerHandoffTruck): string {
  return (
    trimOrNull(truck.short_description) ??
    trimOrNull(truck.description)?.slice(0, 280) ??
    `${truck.name} is listed on FoodTruckCLT.`
  )
}

export function buildOrganizerInterestedHandoffSubject(
  booking: Pick<BookingInsertRow, "event_type" | "event_date">,
  truckName: string
): string {
  const eventLabel = formatEventTypeLabel(booking.event_type)
  const dateLabel = formatEventDateLabel(booking.event_date)
  return `Interested food truck for your ${eventLabel} (${dateLabel}) — ${truckName}`
}

export function buildOrganizerInterestedHandoffEmail(args: {
  booking: Pick<
    BookingInsertRow,
    "event_type" | "event_date" | "city" | "contact_name" | "venue_name"
  >
  truck: OrganizerHandoffTruck
  profileUrl: string
}): { html: string; text: string } {
  const { booking, truck, profileUrl } = args
  const eventLabel = formatEventTypeLabel(booking.event_type)
  const dateLabel = formatEventDateLabel(booking.event_date)
  const location =
    [trimOrNull(booking.venue_name), trimOrNull(booking.city)].filter(Boolean).join(" · ") ||
    trimOrNull(booking.city) ||
    "Charlotte area"
  const cuisine = cuisineLine(truck)
  const summary = profileSummary(truck)
  const bookingEmail = trimOrNull(truck.booking_email)
  const bookingPhone = trimOrNull(truck.booking_phone)
  const website = trimOrNull(truck.website)
  const instagram = trimOrNull(truck.instagram)

  const contactLines: string[] = []
  if (bookingEmail) contactLines.push(`Booking email: ${bookingEmail}`)
  if (bookingPhone) contactLines.push(`Booking phone: ${bookingPhone}`)
  if (website) contactLines.push(`Website: ${normalizeWebsiteUrl(website)}`)
  if (instagram) contactLines.push(`Instagram: ${instagramHref(instagram)}`)

  const htmlContact = contactLines
    .map((line) => `<li>${escapeHtml(line)}</li>`)
    .join("\n")

  const textContact = contactLines.join("\n")

  const html = `
    <p>Hi ${escapeHtml(trimOrNull(booking.contact_name) ?? "there")},</p>
    <p>
      A local food truck marked <strong>Interested</strong> in your ${escapeHtml(eventLabel)} on ${escapeHtml(dateLabel)}
      (${escapeHtml(location)}).
    </p>
    <p>
      FoodTruckCLT connects organizers and vendors. Please contact the truck directly to confirm schedule, pricing,
      and payment terms. FoodTruckCLT does not handle payment or contracting.
    </p>
    <h2>${escapeHtml(truck.name)}</h2>
    <p><strong>Cuisine:</strong> ${escapeHtml(cuisine)}</p>
    <p>${escapeHtml(summary)}</p>
    <ul>${htmlContact}</ul>
    <p><a href="${escapeHtml(profileUrl)}">View FoodTruckCLT profile</a></p>
    <p>— FoodTruckCLT</p>
  `.trim()

  const text = [
    `Hi ${trimOrNull(booking.contact_name) ?? "there"},`,
    "",
    `A local food truck marked Interested in your ${eventLabel} on ${dateLabel} (${location}).`,
    "",
    "FoodTruckCLT connects organizers and vendors. Please contact the truck directly to confirm schedule, pricing, and payment terms. FoodTruckCLT does not handle payment or contracting.",
    "",
    truck.name,
    `Cuisine: ${cuisine}`,
    summary,
    "",
    textContact,
    "",
    `FoodTruckCLT profile: ${profileUrl}`,
    "",
    "— FoodTruckCLT",
  ].join("\n")

  return { html, text }
}
