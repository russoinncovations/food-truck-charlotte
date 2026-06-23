import {
  createAdminSupabaseClient,
  describeAdminClientInitFailure,
  getAdminSupabaseEnvDiagnostics,
  type AdminSupabaseEnvDiagnostics,
} from "@/lib/supabase/admin"

export type BookingPipelineRuntimeChecks = {
  /** Env vars visible to this server runtime (values never shown). */
  env: AdminSupabaseEnvDiagnostics
  /** createAdminSupabaseClient() returned a client in this runtime. */
  adminClientInitialized: boolean
  /** Service-role SELECT on booking_requests succeeded. */
  serviceRoleQueryOk: boolean
  /** Code path: completeBookingRequest persists via createAdminSupabaseClient when available. */
  bookingPersistUsesAdminClient: true
  /** Code path: opportunity fan-out uses createAdminSupabaseClient. */
  bookingRoutingUsesAdminClient: true
  /** When persist would fall back to the anon/session client passed from the form action. */
  bookingPersistWouldFallbackToSessionClient: boolean
}

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
  runtime: BookingPipelineRuntimeChecks
  loadError: string | null
  tableRowCount: number | null
  latest: BookingAdminDiagnosticRow[]
  notes: string[]
}

function isInternalTestRow(row: Record<string, unknown>): boolean {
  const notes = String(row.additional_notes ?? "").toUpperCase()
  const email = String(row.contact_email ?? "").toLowerCase()
  if (notes.includes("INTERNAL TEST")) return true
  if (email.includes("internal-test") && email.endsWith("@foodtruckclt.com")) return true
  return false
}

function buildRuntimeChecks(): BookingPipelineRuntimeChecks {
  const env = getAdminSupabaseEnvDiagnostics()
  const admin = createAdminSupabaseClient()
  return {
    env,
    adminClientInitialized: admin !== null,
    serviceRoleQueryOk: false,
    bookingPersistUsesAdminClient: true,
    bookingRoutingUsesAdminClient: true,
    bookingPersistWouldFallbackToSessionClient: admin === null,
  }
}

function buildNotes(runtime: BookingPipelineRuntimeChecks): string[] {
  const notes: string[] = []

  if (!runtime.env.supabaseUrlPresent) {
    notes.push("NEXT_PUBLIC_SUPABASE_URL is not visible to this server runtime.")
  }
  if (!runtime.env.serviceRoleKeyPresent) {
    notes.push(
      "SUPABASE_SERVICE_ROLE_KEY is not visible to this server runtime (empty or unset in process.env)."
    )
  } else if (!runtime.adminClientInitialized) {
    notes.push(describeAdminClientInitFailure(runtime.env))
  }
  if (runtime.bookingPersistWouldFallbackToSessionClient) {
    notes.push(
      "Public booking submit would fall back to the anon/session Supabase client for insert — RLS may block .select('id') or routing."
    )
  }
  if (runtime.adminClientInitialized && !runtime.serviceRoleQueryOk && !runtime.env.serviceRoleKeyPresent) {
    notes.push("Service-role query did not run because the admin client was not initialized.")
  }

  return notes
}

/**
 * Latest booking_requests rows for admin diagnostics (bypasses UI filters; service role only).
 */
export async function fetchBookingAdminDiagnostics(): Promise<BookingAdminDiagnostics> {
  const runtime = buildRuntimeChecks()
  const notes = buildNotes(runtime)

  const admin = createAdminSupabaseClient()
  if (!admin) {
    return {
      runtime,
      loadError: describeAdminClientInitFailure(runtime.env),
      tableRowCount: null,
      latest: [],
      notes,
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

  runtime.serviceRoleQueryOk = !countRes.error && !recentRes.error

  if (countRes.error) {
    notes.push(`Service-role count query failed: ${countRes.error.message}`)
    return {
      runtime,
      loadError: countRes.error.message,
      tableRowCount: null,
      latest: [],
      notes,
    }
  }

  if (recentRes.error) {
    notes.push(`Service-role recent query failed: ${recentRes.error.message}`)
    return {
      runtime,
      loadError: recentRes.error.message,
      tableRowCount: countRes.count ?? null,
      latest: [],
      notes,
    }
  }

  const oppCountByBooking = new Map<string, number>()
  if (!oppRes.error) {
    for (const row of oppRes.data ?? []) {
      const bid = row.booking_request_id as string | null
      if (!bid) continue
      oppCountByBooking.set(bid, (oppCountByBooking.get(bid) ?? 0) + 1)
    }
  } else {
    notes.push(`truck_opportunities lookup failed: ${oppRes.error.message}`)
  }

  const adminAvailableAtSubmit = runtime.adminClientInitialized

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
      if (!adminAvailableAtSubmit) {
        routingError =
          "No opportunities — admin client was unavailable at submit time (check runtime env above)."
      } else if (requestType === "specific_vendor" && !r.truck_id) {
        routingError = "Specific vendor request missing truck_id."
      } else {
        routingError = "No opportunities created (routing insert may have failed — check server logs)."
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
    runtime,
    loadError: null,
    tableRowCount: countRes.count ?? null,
    latest,
    notes,
  }
}

export type AdminBookingsLoadResult = {
  bookings: Record<string, unknown>[]
  loadError: string | null
  runtime: BookingPipelineRuntimeChecks
}

/** Canonical admin list query — service role only (no public SELECT RLS policy). */
export async function fetchAllBookingRequestsForAdmin(): Promise<AdminBookingsLoadResult> {
  const runtime = buildRuntimeChecks()
  const admin = createAdminSupabaseClient()
  if (!admin) {
    return {
      bookings: [],
      loadError: describeAdminClientInitFailure(runtime.env),
      runtime,
    }
  }

  const { data, error } = await admin
    .from("booking_requests")
    .select("*")
    .order("created_at", { ascending: false })

  runtime.serviceRoleQueryOk = !error

  if (error) {
    console.error("[admin/bookings] Error fetching bookings:", error)
    return { bookings: [], loadError: error.message, runtime }
  }

  return { bookings: (data ?? []) as Record<string, unknown>[], loadError: null, runtime }
}
