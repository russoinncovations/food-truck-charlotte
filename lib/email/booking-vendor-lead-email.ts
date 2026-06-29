import type { BookingInsertRow } from "@/lib/booking/complete-booking-request"
import { BOOKING_REQUEST_TYPE } from "@/lib/booking/booking-request-constants"
import { EVENT_TYPES } from "@/lib/booking-types"
import { buildVendorOpportunityDashboardUrl } from "@/lib/email/vendor-opportunity-dashboard-url"

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

function formatTimeRange(start: string | null | undefined, end: string | null | undefined): string {
  const s = trimOrNull(start)
  const e = trimOrNull(end)
  if (!s && !e) return "Time TBD"
  if (s && e) return `${s} – ${e}`
  return s || e || "Time TBD"
}

function vendorTypeLabel(vendorType: string | null | undefined): string | null {
  const v = trimOrNull(vendorType)
  if (!v || v.toLowerCase() === "any") return null
  const map: Record<string, string> = {
    truck: "Food trucks",
    cart: "Food carts",
    tent: "Food tents",
  }
  return map[v.toLowerCase()] ?? v
}

export function bookingRequestCategoryLabel(row: BookingInsertRow): string {
  const rt = row.request_type
  if (rt === BOOKING_REQUEST_TYPE.SPECIFIC_VENDOR) return "Requested for your truck"
  if (rt === BOOKING_REQUEST_TYPE.OPEN_REQUEST) return "Open request"
  if (rt === BOOKING_REQUEST_TYPE.CUISINE_MATCH) return "Cuisine request"
  return "Booking request"
}

function requestedCuisineOrTruckType(row: BookingInsertRow): string {
  const cuisines = (row.cuisines ?? []).map((c) => String(c).trim()).filter(Boolean)
  if (cuisines.length > 0) return cuisines.join(", ")
  const vendor = vendorTypeLabel(row.vendor_type)
  if (vendor) return vendor
  const preferred = trimOrNull(row.preferred_trucks)
  if (preferred) return preferred
  return "Any food truck"
}

function locationLine(row: BookingInsertRow): string {
  const city = trimOrNull(row.city) ?? "Charlotte"
  const state = trimOrNull(row.state)
  return state ? `${city}, ${state}` : city
}

function formatGuestCountLabel(count: number): string {
  if (!Number.isFinite(count) || count <= 0) return "Not specified"
  return count.toLocaleString("en-US")
}

export function buildVendorBookingLeadSubject(row: BookingInsertRow): string {
  const eventLabel = formatEventTypeLabel(row.event_type)
  const dateLabel = formatEventDateLabel(row.event_date)
  return `New FoodTruckCLT Request: ${eventLabel} · ${dateLabel}`
}

export type VendorBookingAlertField = {
  label: string
  value: string
}

export function buildVendorBookingAlertFields(row: BookingInsertRow): VendorBookingAlertField[] {
  return [
    { label: "Event type", value: formatEventTypeLabel(row.event_type) },
    { label: "Date", value: formatEventDateLabel(row.event_date) },
    { label: "Time", value: formatTimeRange(row.start_time, row.end_time) },
    { label: "Location", value: locationLine(row) },
    { label: "Guest count", value: formatGuestCountLabel(row.guest_count) },
    { label: "Request category", value: bookingRequestCategoryLabel(row) },
    { label: "Requested cuisine or truck type", value: requestedCuisineOrTruckType(row) },
  ]
}

const FOODTRUCKCLT_CONNECT_DISCLAIMER =
  "FoodTruckCLT connects vendors and hosts. Agreements and payments are handled directly between you and the host."

export type VendorBookingLeadEmailContent = {
  subject: string
  html: string
  text: string
}

export function buildVendorBookingLeadEmail(
  row: BookingInsertRow,
  truckName: string,
  opportunityId: string
): VendorBookingLeadEmailContent {
  const subject = buildVendorBookingLeadSubject(row)
  const safeTruckName = escapeHtml(truckName.trim() || "there")
  const alertFields = buildVendorBookingAlertFields(row)
  const responseUrl = buildVendorOpportunityDashboardUrl(opportunityId)

  const fieldsHtml = alertFields
    .map(
      (field) =>
        `<tr><td style="padding:4px 12px 4px 0;color:#666;vertical-align:top;white-space:nowrap;">${escapeHtml(field.label)}</td><td style="padding:4px 0;color:#111;">${escapeHtml(field.value)}</td></tr>`
    )
    .join("\n")

  const fieldsText = alertFields.map((field) => `${field.label}: ${field.value}`).join("\n")

  const html = `
<p>Hi ${safeTruckName},</p>
<p>You have a new booking request on FoodTruckCLT.</p>
<table style="margin:16px 0;font-size:14px;border-collapse:collapse;">${fieldsHtml}</table>
<p><a href="${escapeHtml(responseUrl)}" style="display:inline-block;padding:12px 18px;border-radius:8px;background:#C53A2A;color:#ffffff;text-decoration:none;font-weight:700;">View Request &amp; Respond</a></p>
<p style="margin-top:24px;color:#666;font-size:14px;">${escapeHtml(FOODTRUCKCLT_CONNECT_DISCLAIMER)} Mark Interested or Not Available in your dashboard. Host contact details appear after you mark Interested.</p>
`.trim()

  const text = [
    `Hi ${truckName.trim() || "there"},`,
    "",
    "You have a new booking request on FoodTruckCLT.",
    "",
    fieldsText,
    "",
    `View Request & Respond: ${responseUrl}`,
    "",
    FOODTRUCKCLT_CONNECT_DISCLAIMER,
    "Mark Interested or Not Available in your dashboard. Host contact details appear after you mark Interested.",
  ].join("\n")

  return { subject, html, text }
}
