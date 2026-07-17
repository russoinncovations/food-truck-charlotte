import type { SupabaseClient } from "@supabase/supabase-js"
import { EVENT_TYPES } from "@/lib/booking-types"
import {
  bookingNotificationDeliveryLabel,
  bookingNotificationWasEmailed,
} from "@/lib/booking/booking-notification-status"
import { isOpportunityEffectivelyExpired } from "@/lib/booking/opportunity-active"
import { parseBookingEmbed } from "@/lib/dashboard/vendor-booking-opportunity-visibility"
import type { VendorDashboardTruck } from "@/lib/dashboard/vendor-booking-opportunities"

export type VendorAnalyticsWindow = "30d" | "all"

export type VendorAnalyticsBookingCounts = {
  received: number
  interested: number
  notAvailable: number
  expiredOrNoResponse: number
  pending: number
}

export type VendorAnalyticsResponseActivity = {
  responded: number
  total: number
  /** Average hours to respond, or null when not enough reliable timestamps. */
  averageResponseHours: number | null
}

export type VendorAnalyticsEmailCounts = {
  sent: number
  delivered: number
  opened: number
  clicked: number
  bouncedOrFailed: number
}

export type VendorAnalyticsRecentOpportunity = {
  id: string
  eventTypeLabel: string
  eventDate: string | null
  city: string | null
  guestCount: number | null
  responseStatusLabel: string
  emailStatusLabel: string | null
}

export type VendorAnalyticsLiveSchedule = {
  currentlyLive: boolean
  scheduledStopsThisMonth: number
  weeklyScheduleDaysSet: number
  weeklyScheduleLabel: string
}

export type VendorAnalyticsSummary = {
  window: VendorAnalyticsWindow
  windowLabel: string
  bookings: VendorAnalyticsBookingCounts
  response: VendorAnalyticsResponseActivity
  email: VendorAnalyticsEmailCounts
  recent: VendorAnalyticsRecentOpportunity[]
  liveSchedule: VendorAnalyticsLiveSchedule
}

type AnalyticsOpportunityRow = {
  id: string
  status: string | null
  created_at: string | null
  responded_at: string | null
  routed_at: string | null
  expires_at: string | null
  notification_status: string | null
  email_sent_at: string | null
  delivered_at: string | null
  opened_at: string | null
  clicked_at: string | null
  bounced_at: string | null
  failed_at: string | null
  resend_email_id: string | null
  booking_requests: unknown
}

const OPPORTUNITY_SELECT = [
  "id",
  "status",
  "created_at",
  "responded_at",
  "routed_at",
  "expires_at",
  "notification_status",
  "email_sent_at",
  "delivered_at",
  "opened_at",
  "clicked_at",
  "bounced_at",
  "failed_at",
  "resend_email_id",
  "booking_requests(event_type, event_date, city, guest_count, start_time, end_time, status)",
].join(", ")

function windowStartIso(window: VendorAnalyticsWindow): string | null {
  if (window === "all") return null
  const d = new Date()
  d.setDate(d.getDate() - 30)
  return d.toISOString()
}

function inWindow(createdAt: string | null | undefined, startIso: string | null): boolean {
  if (!startIso) return true
  if (!createdAt) return false
  const t = new Date(createdAt).getTime()
  if (Number.isNaN(t)) return false
  return t >= new Date(startIso).getTime()
}

function responseStatusLabel(status: string, effectivelyExpired: boolean): string {
  const s = status.toLowerCase()
  if (s === "interested") return "Interested"
  if (s === "not_available" || s === "pass") return "Not available"
  if (s === "expired" || effectivelyExpired) return "No response / expired"
  if (s === "pending") return "Pending"
  return status || "—"
}

function emailStatusForRow(row: AnalyticsOpportunityRow): string | null {
  if (row.clicked_at) return "Clicked"
  if (row.opened_at) return "Opened"
  if (row.bounced_at || row.failed_at) {
    if (row.bounced_at && row.failed_at) return "Bounced / failed"
    if (row.bounced_at) return "Bounced"
    return "Failed"
  }
  if (row.delivered_at) return "Delivered"
  if (row.email_sent_at || row.resend_email_id || bookingNotificationWasEmailed(row.notification_status)) {
    return "Sent"
  }
  if (row.notification_status) {
    const label = bookingNotificationDeliveryLabel(row.notification_status)
    if (label === "Dashboard only") return "Dashboard only"
    if (label === "Missing vendor email") return "Not emailed"
    return label
  }
  return null
}

function classifyBookingBucket(
  row: AnalyticsOpportunityRow
): keyof Omit<VendorAnalyticsBookingCounts, "received"> {
  const status = String(row.status ?? "").toLowerCase()
  const booking = parseBookingEmbed(row.booking_requests)
  const expired = isOpportunityEffectivelyExpired({
    status: row.status,
    expires_at: row.expires_at,
    booking,
  })

  if (status === "interested") return "interested"
  if (status === "not_available" || status === "pass") return "notAvailable"
  if (status === "expired" || (status === "pending" && expired)) return "expiredOrNoResponse"
  if (status === "pending") return "pending"
  return "expiredOrNoResponse"
}

function averageResponseHours(rows: AnalyticsOpportunityRow[]): number | null {
  const hours: number[] = []
  for (const row of rows) {
    const status = String(row.status ?? "").toLowerCase()
    if (status !== "interested" && status !== "not_available" && status !== "pass") continue
    if (!row.responded_at) continue
    const startRaw = row.routed_at || row.created_at
    if (!startRaw) continue
    const start = new Date(startRaw).getTime()
    const end = new Date(row.responded_at).getTime()
    if (Number.isNaN(start) || Number.isNaN(end) || end < start) continue
    hours.push((end - start) / (1000 * 60 * 60))
  }
  if (hours.length < 2) return null
  const avg = hours.reduce((a, b) => a + b, 0) / hours.length
  return Math.round(avg * 10) / 10
}

function monthBoundsLocal(): { start: string; endExclusive: string } {
  const now = new Date()
  const start = new Date(now.getFullYear(), now.getMonth(), 1)
  const end = new Date(now.getFullYear(), now.getMonth() + 1, 1)
  const toDate = (d: Date) => {
    const y = d.getFullYear()
    const m = String(d.getMonth() + 1).padStart(2, "0")
    const day = String(d.getDate()).padStart(2, "0")
    return `${y}-${m}-${day}`
  }
  return { start: toDate(start), endExclusive: toDate(end) }
}

function weeklyScheduleLabel(daysSet: number): string {
  if (daysSet <= 0) return "Not started yet"
  if (daysSet >= 5) return "Looking complete"
  return "In progress"
}

/**
 * Aggregate Activity Summary for the authenticated vendor's truck (RLS-scoped queries).
 */
export async function fetchVendorAnalyticsSummary(
  supabase: SupabaseClient,
  truck: VendorDashboardTruck,
  window: VendorAnalyticsWindow = "30d"
): Promise<VendorAnalyticsSummary> {
  const startIso = windowStartIso(window)

  const { data: oppData, error: oppError } = await supabase
    .from("truck_opportunities")
    .select(OPPORTUNITY_SELECT)
    .eq("truck_id", truck.id)
    .order("created_at", { ascending: false })
    .limit(500)

  if (oppError) {
    console.error("[vendor-analytics] opportunities:", oppError.message)
  }

  const allRows = (oppData ?? []) as AnalyticsOpportunityRow[]
  const windowRows = allRows.filter((r) => inWindow(r.created_at, startIso))

  const bookings: VendorAnalyticsBookingCounts = {
    received: windowRows.length,
    interested: 0,
    notAvailable: 0,
    expiredOrNoResponse: 0,
    pending: 0,
  }

  for (const row of windowRows) {
    bookings[classifyBookingBucket(row)] += 1
  }

  const responded = bookings.interested + bookings.notAvailable
  const response: VendorAnalyticsResponseActivity = {
    responded,
    total: bookings.received,
    averageResponseHours: averageResponseHours(windowRows),
  }

  const email: VendorAnalyticsEmailCounts = {
    sent: 0,
    delivered: 0,
    opened: 0,
    clicked: 0,
    bouncedOrFailed: 0,
  }

  for (const row of windowRows) {
    const wasSent =
      Boolean(row.email_sent_at) ||
      Boolean(row.resend_email_id) ||
      bookingNotificationWasEmailed(row.notification_status) ||
      Boolean(row.delivered_at) ||
      Boolean(row.opened_at) ||
      Boolean(row.clicked_at)
    if (wasSent) email.sent += 1
    if (row.delivered_at || String(row.notification_status).toLowerCase() === "delivered") {
      email.delivered += 1
    }
    if (row.opened_at) email.opened += 1
    if (row.clicked_at) email.clicked += 1
    if (
      row.bounced_at ||
      row.failed_at ||
      ["bounced", "failed", "complained"].includes(String(row.notification_status).toLowerCase())
    ) {
      email.bouncedOrFailed += 1
    }
  }

  const recent: VendorAnalyticsRecentOpportunity[] = windowRows.slice(0, 8).map((row) => {
    const booking = parseBookingEmbed(row.booking_requests)
    const bookingFields = (booking ?? {}) as {
      event_type?: string | null
      event_date?: string | null
      city?: string | null
      guest_count?: number | null
      expected_guests?: number | null
    }
    const expired = isOpportunityEffectivelyExpired({
      status: row.status,
      expires_at: row.expires_at,
      booking,
    })
    const eventType = bookingFields.event_type ?? null
    const guestCount = bookingFields.guest_count ?? bookingFields.expected_guests ?? null
    return {
      id: row.id,
      eventTypeLabel:
        EVENT_TYPES.find((t) => t.value === eventType)?.label ?? eventType ?? "Event",
      eventDate: bookingFields.event_date ?? null,
      city: bookingFields.city ?? null,
      guestCount,
      responseStatusLabel: responseStatusLabel(String(row.status ?? ""), expired),
      emailStatusLabel: emailStatusForRow(row),
    }
  })

  const { start: monthStart, endExclusive: monthEnd } = monthBoundsLocal()
  const [{ count: stopsCount }, { data: scheduleRows }] = await Promise.all([
    supabase
      .from("truck_scheduled_stops")
      .select("id", { count: "exact", head: true })
      .eq("truck_id", truck.id)
      .gte("stop_date", monthStart)
      .lt("stop_date", monthEnd)
      .neq("status", "canceled"),
    supabase.from("truck_schedule").select("day_of_week").eq("truck_id", truck.id).limit(50),
  ])

  const days = new Set(
    (scheduleRows ?? [])
      .map((r) => String((r as { day_of_week?: string | number | null }).day_of_week ?? "").trim())
      .filter(Boolean)
  )

  const weeklyScheduleDaysSet = days.size

  return {
    window,
    windowLabel: window === "30d" ? "Last 30 days" : "All time",
    bookings,
    response,
    email,
    recent,
    liveSchedule: {
      currentlyLive: Boolean(truck.serving_today),
      scheduledStopsThisMonth: stopsCount ?? 0,
      weeklyScheduleDaysSet,
      weeklyScheduleLabel: weeklyScheduleLabel(weeklyScheduleDaysSet),
    },
  }
}

export function parseVendorAnalyticsWindow(raw: string | string[] | undefined): VendorAnalyticsWindow {
  const v = Array.isArray(raw) ? raw[0] : raw
  return v === "all" ? "all" : "30d"
}

export function formatAverageResponseTime(hours: number | null): string {
  if (hours == null) return "Not enough data yet."
  if (hours < 1) return "Under 1 hour"
  if (hours < 24) return `${hours} hours`
  const days = Math.round((hours / 24) * 10) / 10
  return `${days} days`
}
