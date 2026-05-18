/**
 * Build mailto: link for admins to email the booking requester (customer).
 * Keep body reasonably short for client mailto URL limits.
 */
import type { BookingRequest } from "@/lib/booking-types"

export type BookingCustomerMailtoInput = {
  contactEmail: string
  eventDateLabel: string
  timeLabel: string
  locationLabel: string
  guestCount: number
  cuisinesLine: string
  /** Optional note typed by admin in the UI */
  adminNote?: string
}

const SUBJECT = "FoodTruckCLT booking request"

export function buildBookingCustomerMailtoHref(input: BookingCustomerMailtoInput): string {
  const email = input.contactEmail.trim()
  if (!email) {
    return "#"
  }

  const lines: string[] = [
    "Hello,",
    "",
    "This is FoodTruckCLT regarding your catering / booking request.",
    "",
    `Event date: ${input.eventDateLabel}`,
    `Time: ${input.timeLabel}`,
    `Location: ${input.locationLabel}`,
    `Guest count: ${input.guestCount}`,
    `Requested cuisines: ${input.cuisinesLine.trim() ? input.cuisinesLine : "None specified"}`,
  ]

  const note = input.adminNote?.trim()
  if (note) {
    lines.push("", "Message from FoodTruckCLT:", note)
  }

  lines.push("", "Thank you,", "FoodTruckCLT")

  const body = lines.join("\n")
  return `mailto:${email}?subject=${encodeURIComponent(SUBJECT)}&body=${encodeURIComponent(body)}`
}

function formatEventDateLabel(dateStr: string): string {
  const [y, m, d] = dateStr.split("-").map(Number)
  if (!y || !m || !d) return dateStr
  const date = new Date(y, m - 1, d)
  return date.toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric", year: "numeric" })
}

function formatTimeRange(start?: string, end?: string): string {
  const fmt = (timeString: string): string => {
    const [hours, minutes] = timeString.split(":")
    const h = parseInt(hours, 10)
    if (Number.isNaN(h)) return timeString
    const ampm = h >= 12 ? "PM" : "AM"
    const hour12 = h % 12 || 12
    return `${hour12}:${minutes ?? "00"} ${ampm}`
  }
  const s = start?.trim()
  const e = end?.trim()
  if (s && e) return `${fmt(s)} - ${fmt(e)}`
  if (s) return fmt(s)
  if (e) return fmt(e)
  return "Not specified"
}

/** Shared formatting for admin mailto (detail page + bookings table). */
export function buildBookingCustomerMailtoFromRequest(
  booking: BookingRequest,
  adminNote?: string
): string {
  const parts = [booking.venue_address, booking.venue_city, booking.venue_state].filter(
    (x) => x && String(x).trim() !== ""
  )
  const locationLabel = parts.length ? parts.join(", ") : "—"
  const cuisines =
    booking.cuisine_preferences && booking.cuisine_preferences.length > 0
      ? booking.cuisine_preferences.join(", ")
      : ""

  return buildBookingCustomerMailtoHref({
    contactEmail: booking.contact_email,
    eventDateLabel: formatEventDateLabel(booking.event_date),
    timeLabel: formatTimeRange(booking.event_start_time, booking.event_end_time),
    locationLabel,
    guestCount: booking.expected_guests,
    cuisinesLine: cuisines,
    adminNote,
  })
}
