import type { BookingInsertRow } from "@/lib/booking/complete-booking-request"

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
  if (!raw) return "TBD"
  const d = new Date(`${raw}T12:00:00`)
  if (Number.isNaN(d.getTime())) return raw
  return d.toLocaleDateString("en-US", {
    weekday: "short",
    month: "short",
    day: "numeric",
    year: "numeric",
  })
}

function formatGuestCount(count: number): string {
  if (!Number.isFinite(count) || count <= 0) return "an unknown number of"
  return `about ${count.toLocaleString("en-US")}`
}

function vendorTypeLabel(vendorType: string | null | undefined): string | null {
  const v = trimOrNull(vendorType)
  if (!v || v.toLowerCase() === "any") return null
  const map: Record<string, string> = {
    truck: "food trucks",
    cart: "food carts",
    tent: "food tents",
  }
  return map[v.toLowerCase()] ?? v
}

function requestedFoodLabel(row: BookingInsertRow): string {
  const cuisines = (row.cuisines ?? []).map((c) => String(c).trim()).filter(Boolean)
  if (cuisines.length > 0) return cuisines.join(", ")
  const vendor = vendorTypeLabel(row.vendor_type)
  if (vendor) return vendor
  const preferred = trimOrNull(row.preferred_trucks)
  if (preferred) return preferred
  return "food trucks"
}

function locationLine(row: BookingInsertRow): string {
  const city = trimOrNull(row.city) ?? "Charlotte"
  const state = trimOrNull(row.state)
  return state ? `${city}, ${state}` : city
}

export function buildVendorBookingLeadSubject(
  row: BookingInsertRow,
  truckName?: string | null
): string {
  const dateLabel = formatEventDateLabel(row.event_date)
  const city = trimOrNull(row.city) ?? "Charlotte"
  const name = trimOrNull(truckName)

  if (name) {
    return `New booking inquiry for ${name}: ${dateLabel}`
  }
  const eventType = trimOrNull(row.event_type)
  if (eventType && row.guest_count > 0) {
    return `Potential event booking: ${eventType} for ${row.guest_count} guests`
  }
  return `New potential booking: ${dateLabel} in ${city}`
}

function leadSummarySentence(row: BookingInsertRow): string {
  const eventType = trimOrNull(row.event_type) ?? "An event"
  const city = trimOrNull(row.city) ?? "the Charlotte area"
  const food = requestedFoodLabel(row)
  const dateLabel = formatEventDateLabel(row.event_date)
  const guests = formatGuestCount(row.guest_count)
  const budget = trimOrNull(row.budget_range)
  const base = `A ${eventType} in ${city} is looking for ${food} on ${dateLabel} for ${guests} guests.`
  return budget ? `${base} Budget: ${budget}.` : base
}

function leadSummaryBullets(row: BookingInsertRow): string[] {
  const bullets: string[] = []
  const push = (label: string, value: string | null | undefined) => {
    const v = trimOrNull(value ?? undefined)
    if (v) bullets.push(`${label}: ${v}`)
  }

  push("Event type", row.event_type)
  push("Date", formatEventDateLabel(row.event_date))
  push("Location", locationLine(row))
  if (row.guest_count > 0) {
    bullets.push(`Guest count: ${row.guest_count.toLocaleString("en-US")}`)
  }
  push("Requested cuisine or truck type", requestedFoodLabel(row))
  push("Budget", row.budget_range)

  return bullets
}

function detailLine(label: string, value: string | null | undefined): string | null {
  const v = trimOrNull(value ?? undefined)
  if (!v) return null
  return `${label}: ${v}`
}

function buildEventDetailLines(row: BookingInsertRow): string[] {
  const lines: string[] = []
  const push = (label: string, value: string | null | undefined) => {
    const line = detailLine(label, value)
    if (line) lines.push(line)
  }

  push("Event type", row.event_type)
  push("Date", formatEventDateLabel(row.event_date))
  if (trimOrNull(row.start_time) || trimOrNull(row.end_time)) {
    const start = trimOrNull(row.start_time) ?? "—"
    const end = trimOrNull(row.end_time) ?? "—"
    lines.push(`Time: ${start} – ${end}`)
  }
  push("Venue", row.venue_name)
  if (trimOrNull(row.street_address)) {
    const addr = [row.street_address, row.city, row.state, row.zip_code].filter(Boolean).join(", ")
    push("Address", addr)
  } else {
    push("City", row.city)
    push("State", row.state)
    push("Zip", row.zip_code)
  }
  if (row.guest_count > 0) {
    lines.push(`Guest count: ${row.guest_count.toLocaleString("en-US")}`)
  }
  const cuisines = (row.cuisines ?? []).map((c) => String(c).trim()).filter(Boolean)
  if (cuisines.length > 0) {
    lines.push(`Requested cuisine: ${cuisines.join(", ")}`)
  }
  const vendor = vendorTypeLabel(row.vendor_type)
  if (vendor) {
    lines.push(`Requested vendor type: ${vendor}`)
  }
  push("Preferred trucks", row.preferred_trucks)
  push("Budget", row.budget_range)
  const dietary = (row.dietary_requirements ?? []).map((d) => String(d).trim()).filter(Boolean)
  if (dietary.length > 0) {
    lines.push(`Dietary requirements: ${dietary.join(", ")}`)
  }
  push("Organization", row.organization)
  push("Additional notes", row.additional_notes)

  return lines
}

export type VendorBookingLeadEmailContent = {
  subject: string
  html: string
  text: string
}

export function buildVendorBookingLeadEmail(
  row: BookingInsertRow,
  truckName: string
): VendorBookingLeadEmailContent {
  const subject = buildVendorBookingLeadSubject(row, truckName)
  const safeTruckName = escapeHtml(truckName.trim() || "there")
  const summary = escapeHtml(leadSummarySentence(row))
  const summaryBullets = leadSummaryBullets(row)
  const hostName = escapeHtml(trimOrNull(row.contact_name) ?? "Host")
  const hostEmail = escapeHtml(trimOrNull(row.contact_email) ?? "")
  const hostPhone = trimOrNull(row.contact_phone)
  const detailLines = buildEventDetailLines(row)

  const contactHtml = [
    `<p><strong>${hostName}</strong></p>`,
    hostEmail ? `<p><a href="mailto:${hostEmail}">${hostEmail}</a></p>` : "",
    hostPhone ? `<p>${escapeHtml(hostPhone)}</p>` : "",
  ]
    .filter(Boolean)
    .join("\n")

  const detailsHtml = detailLines
    .map((line) => `<li>${escapeHtml(line)}</li>`)
    .join("\n")

  const summaryHtml = summaryBullets
    .map((line) => `<li>${escapeHtml(line)}</li>`)
    .join("\n")

  const html = `
<p>Hi ${safeTruckName},</p>
<p>You may have a new potential customer through FoodTruckCLT.</p>
<p><strong>${summary}</strong></p>
<ul>${summaryHtml}</ul>
<p>If you are interested or available, please contact the host directly:</p>
${contactHtml}
<h3>Event details</h3>
<ul>${detailsHtml}</ul>
<p style="margin-top:24px;color:#666;font-size:14px;">FoodTruckCLT connects customers with local food trucks. Please respond directly to the host if the opportunity is a fit.</p>
`.trim()

  const contactText = [
    trimOrNull(row.contact_name) ?? "Host",
    trimOrNull(row.contact_email) ?? "",
    hostPhone ?? "",
  ]
    .filter(Boolean)
    .join("\n")

  const text = [
    `Hi ${truckName.trim() || "there"},`,
    "",
    "You may have a new potential customer through FoodTruckCLT.",
    "",
    leadSummarySentence(row),
    "",
    ...summaryBullets.map((line) => `- ${line}`),
    "",
    "If you are interested or available, please contact the host directly:",
    "",
    contactText,
    "",
    "Event details",
    ...detailLines.map((line) => `- ${line}`),
    "",
    "FoodTruckCLT connects customers with local food trucks. Please respond directly to the host if the opportunity is a fit.",
  ].join("\n")

  return { subject, html, text }
}
