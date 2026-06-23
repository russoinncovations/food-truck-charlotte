import type { SupabaseClient } from "@supabase/supabase-js"
import { BOOKING_REQUEST_TYPE } from "@/lib/booking/booking-request-constants"
import { completeBookingRequest, type BookingInsertRow } from "@/lib/booking/complete-booking-request"
import { createAdminSupabaseClient } from "@/lib/supabase/admin"
import { easternDateStringToday } from "@/lib/events/public-events"
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
}): Promise<CreateInternalTestBookingResult> {
  const adminDb = opts.adminDb
  const recipientId = parseInternalTestRecipientId(
    opts.recipientId ?? DEFAULT_INTERNAL_TEST_RECIPIENT_ID
  )
  const recipient = internalTestRecipientConfig(recipientId)

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

  const today = easternDateStringToday()
  const requestType =
    opts.requestType === "open_request"
      ? BOOKING_REQUEST_TYPE.OPEN_REQUEST
      : BOOKING_REQUEST_TYPE.SPECIFIC_VENDOR

  const row: BookingInsertRow = {
    event_type: "other",
    event_date: today,
    start_time: "11:00",
    end_time: "14:00",
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
    additional_notes: `${INTERNAL_TEST_BOOKING_MARKER} — Admin pipeline verification for ${recipient.label} (${recipient.email}). Do not contact real vendors or hosts. Safe to delete.`,
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
