import { createClient } from "@/lib/supabase/server"
import { createAdminSupabaseClient } from "@/lib/supabase/admin"

export type VendorOpportunityAdminRow = {
  id: string
  truck_id: string
  status: string
  created_at: string | null
  sent_at: string | null
  responded_at: string | null
  truck_name: string | null
  truck_email: string | null
  truck_phone: string | null
}

type OppRow = {
  id: string
  truck_id: string
  status: string
  created_at: string | null
  sent_at?: string | null
  responded_at?: string | null
}

/**
 * Loads truck_opportunities for a booking request. Prefer service role so admin UI works
 * without a vendor session (RLS otherwise hides most rows).
 */
export async function fetchVendorRoutingForBookingRequest(
  bookingRequestId: string
): Promise<{
  rows: VendorOpportunityAdminRow[]
  usedServiceRole: boolean
  fetchError: string | null
}> {
  const id = bookingRequestId.trim()
  if (!id) {
    return { rows: [], usedServiceRole: false, fetchError: "Missing booking id" }
  }

  const admin = createAdminSupabaseClient()
  const client = admin ?? (await createClient())
  const usedServiceRole = Boolean(admin)

  const selectFull = async (): Promise<{ data: OppRow[] | null; error: { message: string } | null }> => {
    const res = await client
      .from("truck_opportunities")
      .select("id, truck_id, status, created_at, sent_at, responded_at")
      .eq("booking_request_id", id)
      .order("created_at", { ascending: true })
    return { data: res.data as OppRow[] | null, error: res.error }
  }

  let { data: opps, error } = await selectFull()

  if (error) {
    console.error("[admin] truck_opportunities for booking:", error)
    if (error.message?.includes("sent_at") || error.message?.includes("responded_at")) {
      const res2 = await client
        .from("truck_opportunities")
        .select("id, truck_id, status, created_at")
        .eq("booking_request_id", id)
        .order("created_at", { ascending: true })
      if (res2.error) {
        console.error("[admin] truck_opportunities fallback:", res2.error)
        return { rows: [], usedServiceRole, fetchError: res2.error.message }
      }
      opps = res2.data as OppRow[] | null
      error = null
    } else {
      return { rows: [], usedServiceRole, fetchError: error.message }
    }
  }

  const list = opps ?? []
  const truckIds = [...new Set(list.map((o) => o.truck_id).filter(Boolean))]

  let truckMap = new Map<string, { name: string | null; email: string | null; phone: string | null }>()
  if (truckIds.length > 0) {
    const { data: trucks, error: truckErr } = await client
      .from("trucks")
      .select("id, name, email, booking_phone")
      .in("id", truckIds)

    if (truckErr) {
      console.error("[admin] trucks for opportunities:", truckErr)
    } else {
      truckMap = new Map(
        (trucks ?? []).map((t) => [
          t.id as string,
          {
            name: (t.name as string | null) ?? null,
            email: (t.email as string | null) ?? null,
            phone: (t.booking_phone as string | null) ?? null,
          },
        ])
      )
    }
  }

  const rows: VendorOpportunityAdminRow[] = list.map((r) => {
    const t = truckMap.get(r.truck_id) ?? { name: null, email: null, phone: null }
    return {
      id: r.id,
      truck_id: r.truck_id,
      status: r.status,
      created_at: r.created_at,
      sent_at: r.sent_at ?? r.created_at,
      responded_at: r.responded_at ?? null,
      truck_name: t.name,
      truck_email: t.email,
      truck_phone: t.phone,
    }
  })

  return { rows, usedServiceRole, fetchError: null }
}
