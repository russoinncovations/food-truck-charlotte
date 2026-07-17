import type { BookingInsertRow } from "@/lib/booking/complete-booking-request"
import { EVENT_TYPES } from "@/lib/booking-types"

export type OrganizerHandoffTruck = {
  name: string
  slug: string | null
  cuisine: string | null
  cuisine_types: string[] | null
  /** Preferred public booking contact, then general truck email. */
  contact_email: string | null
  /** Preferred public booking phone, then general truck phone. */
  contact_phone: string | null
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

export function cuisineLine(truck: OrganizerHandoffTruck): string {
  const types = (truck.cuisine_types ?? []).map((c) => String(c).trim()).filter(Boolean)
  if (types.length > 0) return types.join(", ")
  return trimOrNull(truck.cuisine) ?? "Food truck"
}

export function buildOrganizerInterestedHandoffSubject(
  booking: Pick<BookingInsertRow, "event_type" | "event_date">,
  truckName: string
): string {
  const eventLabel = formatEventTypeLabel(booking.event_type)
  const dateLabel = formatEventDateLabel(booking.event_date)
  return `Good news: ${truckName} is interested in your ${eventLabel} (${dateLabel})`
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
  const contactEmail = trimOrNull(truck.contact_email)
  const contactPhone = trimOrNull(truck.contact_phone)
  const hostName = trimOrNull(booking.contact_name) ?? "there"

  const detailLinesHtml: string[] = [
    `<li><strong>Truck:</strong> ${escapeHtml(truck.name)}</li>`,
    `<li><strong>Cuisine / category:</strong> ${escapeHtml(cuisine)}</li>`,
  ]
  const detailLinesText: string[] = [`Truck: ${truck.name}`, `Cuisine / category: ${cuisine}`]

  if (contactEmail) {
    detailLinesHtml.push(
      `<li><strong>Contact email:</strong> <a href="mailto:${escapeHtml(contactEmail)}">${escapeHtml(contactEmail)}</a></li>`
    )
    detailLinesText.push(`Contact email: ${contactEmail}`)
  }
  if (contactPhone) {
    detailLinesHtml.push(`<li><strong>Phone:</strong> ${escapeHtml(contactPhone)}</li>`)
    detailLinesText.push(`Phone: ${contactPhone}`)
  }
  detailLinesHtml.push(
    `<li><strong>Profile:</strong> <a href="${escapeHtml(profileUrl)}">${escapeHtml(profileUrl)}</a></li>`
  )
  detailLinesText.push(`Profile: ${profileUrl}`)

  const disclaimer =
    "FoodTruckCLT does not manage the final booking, pricing, contract, payment, or event logistics. Please confirm all details directly with the truck."

  const html = `
    <p>Hi ${escapeHtml(hostName)},</p>
    <p><strong>Good news, a food truck is interested in your event.</strong></p>
    <p>
      ${escapeHtml(truck.name)} marked interested in your ${escapeHtml(eventLabel)} on ${escapeHtml(dateLabel)}
      (${escapeHtml(location)}).
    </p>
    <p>
      The truck may contact you directly using the event contact information you provided. You can also reach out to
      them using the details below.
    </p>
    <ul>
      ${detailLinesHtml.join("\n")}
    </ul>
    <p><em>${escapeHtml(disclaimer)}</em></p>
    <p>— FoodTruckCLT</p>
  `.trim()

  const text = [
    `Hi ${hostName},`,
    "",
    "Good news, a food truck is interested in your event.",
    "",
    `${truck.name} marked interested in your ${eventLabel} on ${dateLabel} (${location}).`,
    "",
    "The truck may contact you directly using the event contact information you provided. You can also reach out to them using the details below.",
    "",
    ...detailLinesText,
    "",
    disclaimer,
    "",
    "— FoodTruckCLT",
  ].join("\n")

  return { html, text }
}
