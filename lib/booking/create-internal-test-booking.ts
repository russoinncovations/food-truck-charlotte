import type { SupabaseClient } from "@supabase/supabase-js"
import { BOOKING_REQUEST_TYPE } from "@/lib/booking/booking-request-constants"
import { completeBookingRequest, type BookingInsertRow } from "@/lib/booking/complete-booking-request"
import { bookingOpportunityExpiresAt } from "@/lib/booking/opportunity-expiration"
import { createAdminSupabaseClient } from "@/lib/supabase/admin"
import {
  DEFAULT_INTERNAL_TEST_RECIPIENT_ID,
  fetchAllInternalTestRecipientTruckIds,
  fetchInternalTestRecipientTruckId,
  internalTestRecipientConfig,
  parseInternalTestRecipientId,
  truckMatchesInternalTestRecipient,
  type InternalTestRecipientId,
} from "@/lib/trucks/internal-test-recipients"

export const INTERNAL_TEST_BOOKING_MARKER = "INTERNAL TEST"
export const DEFAULT_INTERNAL_TEST_HOST_EMAIL = "internal-test@foodtruckclt.com"
export const DEFAULT_INTERNAL_TEST_START_TIME = "11:00"
export const DEFAULT_INTERNAL_TEST_END_TIME = "14:00"

export const INTERNAL_TEST_EVENT_MUST_BE_FUTURE_MESSAGE =
  "Event date and start time must be in the future (America/New_York)."
export const INTERNAL_TEST_END_AFTER_START_MESSAGE = "End time must be after start time."
export const INTERNAL_TEST_INVALID_DATE_MESSAGE = "Enter a valid event date (YYYY-MM-DD)."
export const INTERNAL_TEST_INVALID_TIME_MESSAGE = "Enter valid start and end times (HH:MM)."

export function resolveInternalTestHostEmail(): string {
  return (
    process.env.INTERNAL_TEST_BOOKING_CONTACT_EMAIL?.trim() ||
    DEFAULT_INTERNAL_TEST_HOST_EMAIL
  )
}

export function isAllowedInternalTestHostEmail(email: string): boolean {
  const e = email.trim().toLowerCase()
  if (!e.includes("@")) return false
  const configured = resolveInternalTestHostEmail().toLowerCase()
  if (e === configured) return true
  if (e.endsWith("@foodtruckclt.com") && e.includes("internal-test")) return true
  return false
}

/** Tomorrow’s calendar date in America/New_York as YYYY-MM-DD. */
export function defaultInternalTestEventDate(now = new Date()): string {
  const today = now.toLocaleDateString("en-CA", { timeZone: "America/New_York" })
  const [y, m, d] = today.split("-").map(Number)
  const next = new Date(Date.UTC(y, m - 1, d + 1))
  return `${next.getUTCFullYear()}-${String(next.getUTCMonth() + 1).padStart(2, "0")}-${String(next.getUTCDate()).padStart(2, "0")}`
}

function normalizeTimeInput(raw: string | null | undefined): string | null {
  const t = (raw ?? "").trim()
  if (!t) return null
  const m = t.match(/^(\d{1,2}):(\d{2})/)
  if (!m) return null
  const hour = Number(m[1])
  const minute = Number(m[2])
  if (hour < 0 || hour > 23 || minute < 0 || minute > 59) return null
  return `${String(hour).padStart(2, "0")}:${String(minute).padStart(2, "0")}`
}

function normalizeDateInput(raw: string | null | undefined): string | null {
  const t = (raw ?? "").trim()
  if (!/^\d{4}-\d{2}-\d{2}$/.test(t)) return null
  const [y, m, d] = t.split("-").map(Number)
  const probe = new Date(Date.UTC(y, m - 1, d))
  if (
    probe.getUTCFullYear() !== y ||
    probe.getUTCMonth() !== m - 1 ||
    probe.getUTCDate() !== d
  ) {
    return null
  }
  return t
}

export type InternalTestEventTiming = {
  eventDate: string
  startTime: string
  endTime: string
}

export type InternalTestEventTimingResult =
  | { ok: true; timing: InternalTestEventTiming }
  | { ok: false; error: string }

/**
 * Resolves and validates admin internal-test event timing (America/New_York).
 * Defaults: tomorrow, 11:00–14:00.
 */
export function resolveInternalTestEventTiming(
  opts?: {
    eventDate?: string | null
    startTime?: string | null
    endTime?: string | null
  },
  now = new Date()
): InternalTestEventTimingResult {
  const eventDate =
    normalizeDateInput(opts?.eventDate) ?? defaultInternalTestEventDate(now)
  const startTime =
    normalizeTimeInput(opts?.startTime) ?? DEFAULT_INTERNAL_TEST_START_TIME
  const endTime = normalizeTimeInput(opts?.endTime) ?? DEFAULT_INTERNAL_TEST_END_TIME

  if (!normalizeDateInput(eventDate)) {
    return { ok: false, error: INTERNAL_TEST_INVALID_DATE_MESSAGE }
  }
  if (!normalizeTimeInput(startTime) || !normalizeTimeInput(endTime)) {
    return { ok: false, error: INTERNAL_TEST_INVALID_TIME_MESSAGE }
  }

  const startIso = bookingOpportunityExpiresAt(eventDate, null, startTime)
  const endIso = bookingOpportunityExpiresAt(eventDate, endTime, startTime)
  if (!startIso || !endIso) {
    return { ok: false, error: INTERNAL_TEST_INVALID_DATE_MESSAGE }
  }

  const startMs = new Date(startIso).getTime()
  const endMs = new Date(endIso).getTime()
  if (Number.isNaN(startMs) || Number.isNaN(endMs)) {
    return { ok: false, error: INTERNAL_TEST_INVALID_DATE_MESSAGE }
  }
  if (endMs <= startMs) {
    return { ok: false, error: INTERNAL_TEST_END_AFTER_START_MESSAGE }
  }
  if (startMs <= now.getTime()) {
    return { ok: false, error: INTERNAL_TEST_EVENT_MUST_BE_FUTURE_MESSAGE }
  }

  return { ok: true, timing: { eventDate, startTime, endTime } }
}

export type CreateInternalTestBookingResult =
  | { ok: true; bookingId: string; truckId: string; truckName: string; recipientId: InternalTestRecipientId }
  | { ok: false; error: string }

/**
 * Admin-only test booking routed to an allowed internal test truck (hidden from public directory).
 * Uses the same completeBookingRequest path as production submissions.
 */
export async function createInternalTestBookingRequest(opts: {
  adminDb: SupabaseClient
  recipientId?: InternalTestRecipientId | string | null
  requestType?: "specific_vendor" | "open_request"
  eventDate?: string | null
  startTime?: string | null
  endTime?: string | null
}): Promise<CreateInternalTestBookingResult> {
  const adminDb = opts.adminDb
  const recipientId = parseInternalTestRecipientId(
    opts.recipientId ?? DEFAULT_INTERNAL_TEST_RECIPIENT_ID
  )
  const recipient = internalTestRecipientConfig(recipientId)

  const timingResult = resolveInternalTestEventTiming({
    eventDate: opts.eventDate,
    startTime: opts.startTime,
    endTime: opts.endTime,
  })
  if (!timingResult.ok) {
    return { ok: false, error: timingResult.error }
  }
  const { eventDate, startTime, endTime } = timingResult.timing

  const truckId = await fetchInternalTestRecipientTruckId(adminDb, recipientId)
  if (!truckId) {
    return {
      ok: false,
      error: `No active internal test truck found (${recipient.label}, ${recipient.email}). Create or activate it first.`,
    }
  }

  const { data: truck, error: truckErr } = await adminDb
    .from("trucks")
    .select("id, name, email, show_in_directory")
    .eq("id", truckId)
    .maybeSingle()

  if (truckErr || !truck) {
    return { ok: false, error: truckErr?.message ?? "Internal test truck not found" }
  }

  if (!truckMatchesInternalTestRecipient(recipientId, truck)) {
    return {
      ok: false,
      error: `Refusing to route: truck does not match allowed recipient ${recipient.label}.`,
    }
  }

  const hostEmail = resolveInternalTestHostEmail()
  if (!isAllowedInternalTestHostEmail(hostEmail)) {
    return {
      ok: false,
      error: "INTERNAL_TEST_BOOKING_CONTACT_EMAIL must be a foodtruckclt.com internal-test address.",
    }
  }

  const requestType =
    opts.requestType === "open_request"
      ? BOOKING_REQUEST_TYPE.OPEN_REQUEST
      : BOOKING_REQUEST_TYPE.SPECIFIC_VENDOR

  const row: BookingInsertRow = {
    event_type: "other",
    event_date: eventDate,
    start_time: startTime,
    end_time: endTime,
    guest_count: 25,
    venue_name: `${INTERNAL_TEST_BOOKING_MARKER} — ${recipient.label} verification venue`,
    street_address: "100 N Tryon St",
    city: "Charlotte",
    state: "NC",
    zip_code: "28202",
    cuisines: null,
    dietary_requirements: null,
    budget_range: "flexible",
    contact_name: "INTERNAL TEST Host",
    contact_email: hostEmail,
    contact_phone: "704-555-0100",
    organization: "FoodTruckCLT Admin",
    additional_notes: `${INTERNAL_TEST_BOOKING_MARKER} — Admin pipeline verification for ${recipient.label} (${recipient.email}). Event ${eventDate} ${startTime}–${endTime} ET. Do not contact real vendors or hosts. Safe to delete.`,
    status: "new",
    request_type: requestType,
    truck_id: requestType === BOOKING_REQUEST_TYPE.SPECIFIC_VENDOR ? truckId : null,
    vendor_type: requestType === BOOKING_REQUEST_TYPE.OPEN_REQUEST ? "any" : null,
    preferred_trucks:
      requestType === BOOKING_REQUEST_TYPE.SPECIFIC_VENDOR
        ? String(truck.name ?? recipient.name)
        : null,
  }

  const persistDb = createAdminSupabaseClient()
  if (!persistDb) {
    return {
      ok: false,
      error: "SUPABASE_SERVICE_ROLE_KEY is required to create and route test bookings.",
    }
  }

  const completeOpts =
    requestType === BOOKING_REQUEST_TYPE.OPEN_REQUEST
      ? { broadcastTruckIds: await fetchAllInternalTestRecipientTruckIds(adminDb) }
      : undefined

  if (
    requestType === BOOKING_REQUEST_TYPE.OPEN_REQUEST &&
    (!completeOpts?.broadcastTruckIds || completeOpts.broadcastTruckIds.length === 0)
  ) {
    return {
      ok: false,
      error: "No active internal test trucks found for open-request fan-out.",
    }
  }

  const result = await completeBookingRequest(persistDb, row, completeOpts)
  if (!result.ok) {
    return { ok: false, error: result.error }
  }

  return {
    ok: true,
    bookingId: result.id,
    truckId,
    truckName: String(truck.name ?? recipient.name),
    recipientId,
  }
}
