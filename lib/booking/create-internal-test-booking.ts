import type { SupabaseClient } from "@supabase/supabase-js"
import { BOOKING_REQUEST_TYPE } from "@/lib/booking/booking-request-constants"
import { completeBookingRequest, type BookingInsertRow } from "@/lib/booking/complete-booking-request"
import { createAdminSupabaseClient } from "@/lib/supabase/admin"
import {
  fetchInternalDemoVendorTruckId,
  INTERNAL_DEMO_VENDOR_NAME,
  isInternalDemoVendorTruck,
} from "@/lib/trucks/internal-demo-vendor"
import { easternDateStringToday } from "@/lib/events/public-events"

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
  | { ok: true; bookingId: string; truckId: string; truckName: string }
  | { ok: false; error: string }

/**
 * Admin-only test booking routed to the internal demo vendor (hidden from public directory).
 * Uses the same completeBookingRequest path as production submissions.
 */
export async function createInternalTestBookingRequest(opts: {
  adminDb: SupabaseClient
  requestType?: "specific_vendor" | "open_request"
}): Promise<CreateInternalTestBookingResult> {
  const adminDb = opts.adminDb
  const demoTruckId = await fetchInternalDemoVendorTruckId(adminDb)
  if (!demoTruckId) {
    return {
      ok: false,
      error: `No active internal demo truck found (name: ${INTERNAL_DEMO_VENDOR_NAME}). Create or activate it first.`,
    }
  }

  const { data: truck, error: truckErr } = await adminDb
    .from("trucks")
    .select("id, name, email, show_in_directory")
    .eq("id", demoTruckId)
    .maybeSingle()

  if (truckErr || !truck) {
    return { ok: false, error: truckErr?.message ?? "Demo truck not found" }
  }

  if (!isInternalDemoVendorTruck(truck)) {
    return {
      ok: false,
      error: "Refusing to route: truck is not marked as the internal demo vendor.",
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
    venue_name: "INTERNAL TEST — admin verification venue",
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
    additional_notes: `${INTERNAL_TEST_BOOKING_MARKER} — Admin pipeline verification. Do not contact real vendors or hosts. Safe to delete.`,
    status: "new",
    request_type: requestType,
    truck_id: requestType === BOOKING_REQUEST_TYPE.SPECIFIC_VENDOR ? demoTruckId : null,
    vendor_type: requestType === BOOKING_REQUEST_TYPE.OPEN_REQUEST ? "any" : null,
    preferred_trucks:
      requestType === BOOKING_REQUEST_TYPE.SPECIFIC_VENDOR
        ? String(truck.name ?? INTERNAL_DEMO_VENDOR_NAME)
        : null,
  }

  const persistDb = createAdminSupabaseClient()
  if (!persistDb) {
    return {
      ok: false,
      error: "SUPABASE_SERVICE_ROLE_KEY is required to create and route test bookings.",
    }
  }

  const result = await completeBookingRequest(persistDb, row)
  if (!result.ok) {
    return { ok: false, error: result.error }
  }

  return {
    ok: true,
    bookingId: result.id,
    truckId: demoTruckId,
    truckName: String(truck.name ?? INTERNAL_DEMO_VENDOR_NAME),
  }
}
