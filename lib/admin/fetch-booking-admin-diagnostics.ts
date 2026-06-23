import { createAdminSupabaseClient } from "@/lib/supabase/admin"

export type BookingAdminDiagnosticRow = {
  id: string
  created_at: string | null
  status: string | null
  request_type: string | null
  contact_name: string | null
  contact_email: string | null
  event_date: string | null
  isInternalTest: boolean
  opportunityCount: number
  routingAttempted: boolean
  routingError: string | null
}

export type BookingAdminDiagnostics = {
  usedServiceRole: boolean
  loadError: string | null
  tableRowCount: number | null
  latest: BookingAdminDiagnosticRow[]
  envHints: string[]
}

function isInternalTestRow(row: Record<string, unknown>): boolean {
  const notes = String(row.additional_notes ?? "").toUpperCase()
  const email = String(row.contact_email ?? "").toLowerCase()
  if (notes.includes("INTERNAL TEST")) return true
  if (email.includes("internal-test") && email.endsWith("@foodtruckclt.com")) return true
  return false
}

/**
 * Latest booking_requests rows for admin diagnostics (bypasses UI filters; service role only).
 */
export async function fetchBookingAdminDiagnostics(): Promise<BookingAdminDiagnostics> {
  const admin = createAdminSupabaseClient()
  const envHints: string[] = []

  if (!process.env.SUPABASE_SERVICE_ROLE_KEY?.trim()) {
    envHints.push("SUPABASE_SERVICE_ROLE_KEY is not set — admin cannot read booking_requests under RLS.")
  }
  if (!admin) {
    return {
      usedServiceRole: false,
      loadError: "Service role client unavailable. Set SUPABASE_SERVICE_ROLE_KEY on the server.",
      tableRowCount: null,
      latest: [],
      envHints,
    }
  }

  const [countRes, recentRes, oppRes] = await Promise.all([
    admin.from("booking_requests").select("id", { count: "exact", head: true }),
    admin
      .from("booking_requests")
      .select(
        "id, created_at, status, request_type, contact_name, contact_email, event_date, additional_notes, truck_id"
      )
      .order("created_at", { ascending: false })
      .limit(10),
    admin.from("truck_opportunities").select("booking_request_id"),
  ])

  if (countRes.error) {
    return {
      usedServiceRole: true,
      loadError: countRes.error.message,
      tableRowCount: null,
      latest: [],
      envHints,
    }
  }

  if (recentRes.error) {
    return {
      usedServiceRole: true,
      loadError: recentRes.error.message,
      tableRowCount: countRes.count ?? null,
      latest: [],
      envHints,
    }
  }

  const oppCountByBooking = new Map<string, number>()
  if (!oppRes.error) {
    for (const row of oppRes.data ?? []) {
      const bid = row.booking_request_id as string | null
      if (!bid) continue
      oppCountByBooking.set(bid, (oppCountByBooking.get(bid) ?? 0) + 1)
    }
  }

  const hasServiceRoleForRouting = Boolean(process.env.SUPABASE_SERVICE_ROLE_KEY?.trim())
  if (!hasServiceRoleForRouting) {
    envHints.push("Routing and vendor notifications require SUPABASE_SERVICE_ROLE_KEY at submit time.")
  }

  const latest: BookingAdminDiagnosticRow[] = (recentRes.data ?? []).map((row) => {
    const r = row as Record<string, unknown>
    const id = String(r.id)
    const requestType = (r.request_type as string | null) ?? null
    const oppCount = oppCountByBooking.get(id) ?? 0
    const needsRouting =
      requestType === "specific_vendor" ||
      requestType === "open_request" ||
      requestType === "cuisine_match"

    let routingError: string | null = null
    if (needsRouting && oppCount === 0) {
      if (!hasServiceRoleForRouting) {
        routingError = "No opportunities — service role was likely missing when submitted."
      } else if (requestType === "specific_vendor" && !r.truck_id) {
        routingError = "Specific vendor request missing truck_id."
      } else {
        routingError = "No opportunities created (routing may have failed silently)."
      }
    }

    return {
      id,
      created_at: (r.created_at as string | null) ?? null,
      status: (r.status as string | null) ?? null,
      request_type: requestType,
      contact_name: (r.contact_name as string | null) ?? null,
      contact_email: (r.contact_email as string | null) ?? null,
      event_date: (r.event_date as string | null) ?? null,
      isInternalTest: isInternalTestRow(r),
      opportunityCount: oppCount,
      routingAttempted: needsRouting,
      routingError: needsRouting && oppCount === 0 ? routingError : null,
    }
  })

  return {
    usedServiceRole: true,
    loadError: null,
    tableRowCount: countRes.count ?? null,
    latest,
    envHints,
  }
}

export type AdminBookingsLoadResult = {
  bookings: Record<string, unknown>[]
  loadError: string | null
  usedServiceRole: boolean
}

/** Canonical admin list query — must use service role (no public SELECT RLS policy). */
export async function fetchAllBookingRequestsForAdmin(): Promise<AdminBookingsLoadResult> {
  const admin = createAdminSupabaseClient()
  if (!admin) {
    return {
      bookings: [],
      loadError:
        "Cannot load bookings: SUPABASE_SERVICE_ROLE_KEY is not configured. Requests may exist in the database but RLS blocks reads without the service role.",
      usedServiceRole: false,
    }
  }

  const { data, error } = await admin
    .from("booking_requests")
    .select("*")
    .order("created_at", { ascending: false })

  if (error) {
    console.error("[admin/bookings] Error fetching bookings:", error)
    return { bookings: [], loadError: error.message, usedServiceRole: true }
  }

  return { bookings: (data ?? []) as Record<string, unknown>[], loadError: null, usedServiceRole: true }
}
