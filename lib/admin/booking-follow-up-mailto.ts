import type { BookingRequest } from "@/lib/booking-types"

const FOLLOW_UP_SUBJECT = "Checking in on your FoodTruckCLT request"

const FOLLOW_UP_BODY_CORE = [
  "I wanted to check in on your FoodTruckCLT request.",
  "",
  "Were you able to find a food truck for your event, or do you still need help getting connected with one?",
  "",
  "If you're still looking, feel free to reply here and I'll do my best to help point you in the right direction.",
  "",
  "Once you’ve found a truck, reply to this thread and we can close the request on our side.",
  "",
  "Thanks,",
  "Nicole",
  "FoodTruckCLT",
].join("\n")

function formatEventDateLine(dateStr: string | undefined): string | null {
  if (!dateStr?.trim()) return null
  const [y, m, d] = dateStr.split("-").map(Number)
  if (!y || !m || !d) return dateStr.trim()
  const date = new Date(y, m - 1, d)
  return date.toLocaleDateString("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
    year: "numeric",
  })
}

function formatLocationLine(booking: BookingRequest): string | null {
  const parts = [
    booking.venue_name,
    booking.venue_address,
    booking.venue_city,
    booking.venue_state,
    booking.venue_zip,
  ].filter((x) => x != null && String(x).trim() !== "")
  if (parts.length === 0) return null
  return parts.join(", ")
}

/**
 * Mailto for admin follow-up with the booking requester (customer only — not sent automatically).
 */
export function buildBookingFollowUpMailtoFromRequest(booking: BookingRequest): string | null {
  const email = booking.contact_email?.trim()
  if (!email) return null

  const chunks: string[] = ["Hi,", ""]

  const eventDate = formatEventDateLine(booking.event_date)
  const location = formatLocationLine(booking)
  if (eventDate) {
    chunks.push(`Event date: ${eventDate}`)
  }
  if (location) {
    chunks.push(`Location: ${location}`)
  }
  if (eventDate || location) {
    chunks.push("")
  }

  chunks.push(FOLLOW_UP_BODY_CORE)

  const body = chunks.join("\n")
  return `mailto:${email}?subject=${encodeURIComponent(FOLLOW_UP_SUBJECT)}&body=${encodeURIComponent(body)}`
}
