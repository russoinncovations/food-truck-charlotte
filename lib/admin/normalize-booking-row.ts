import type { BookingRequest, BookingStatus } from "@/lib/booking-types"

function coerceBookingStatus(s: unknown): BookingStatus {
  const v = typeof s === "string" ? s : ""
  const direct: Record<string, BookingStatus> = {
    new: "new",
    contacted: "contacted",
    in_progress: "in_progress",
    quoted: "quoted",
    confirmed: "confirmed",
    completed: "completed",
    cancelled: "cancelled",
    matched: "in_progress",
    closed: "completed",
    archived: "cancelled",
  }
  return direct[v] ?? "new"
}

/** Maps booking_requests DB row keys to admin UI (BookingRequest) shape. */
export function normalizeBookingRowForAdmin(
  r: Record<string, unknown>
): BookingRequest {
  const city = (r.city ?? r.venue_city) as string | undefined
  const state = (r.state ?? r.venue_state) as string | undefined
  const zip = (r.zip_code ?? r.venue_zip) as string | undefined
  const street = (r.street_address ?? r.venue_address) as string | undefined
  const guests = (r.guest_count ?? r.expected_guests) as number | undefined
  const start = (r.start_time ?? r.event_start_time) as string | undefined
  const end = (r.end_time ?? r.event_end_time) as string | undefined
  const org = (r.organization ?? r.organization_name) as string | undefined
  const cuisines = (r.cuisines ?? r.cuisine_preferences) as string[] | undefined
  const pref = r.preferred_trucks as string | undefined
  const specific = r.specific_trucks as string[] | undefined

  return {
    id: r.id as string,
    created_at: r.created_at as string,
    updated_at: (r.updated_at as string) ?? (r.created_at as string),
    contact_name: r.contact_name as string,
    contact_email: r.contact_email as string,
    contact_phone: r.contact_phone as string | undefined,
    organization_name: org,
    event_type: r.event_type as BookingRequest["event_type"],
    event_date: r.event_date as string,
    event_start_time: start,
    event_end_time: end,
    venue_name: r.venue_name as string | undefined,
    venue_address: street ?? "",
    venue_city: city ?? "",
    venue_state: state ?? "",
    venue_zip: zip,
    expected_guests: typeof guests === "number" ? guests : Number(guests) || 0,
    budget_range: r.budget_range as BookingRequest["budget_range"],
    cuisine_preferences: cuisines,
    specific_trucks:
      specific && specific.length > 0 ? specific : pref ? [pref] : undefined,
    dietary_requirements: r.dietary_requirements as string[] | undefined,
    additional_notes: r.additional_notes as string | undefined,
    how_heard_about_us: r.how_heard_about_us as string | undefined,
    status: coerceBookingStatus(r.status),
    truck_id: r.truck_id as string | null | undefined,
    request_type: r.request_type as string | null | undefined,
    vendor_type: r.vendor_type as string | null | undefined,
    preferred_trucks: pref ?? null,
  }
}
