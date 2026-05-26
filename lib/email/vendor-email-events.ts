import { createAdminSupabaseClient } from "@/lib/supabase/admin"

export type VendorEmailEventInsert = {
  resendEmailId: string | null
  vendorEmail: string | null
  truckId?: string | null
  campaign?: string | null
  eventType: string
  eventTimestamp?: string | null
  linkUrl?: string | null
  rawPayload?: unknown
}

/**
 * Persists vendor email lifecycle rows. Requires SUPABASE_SERVICE_ROLE_KEY (same as other admin writes).
 */
/** @returns whether the row was persisted (false if skipped or DB error). */
export async function insertVendorEmailEvent(row: VendorEmailEventInsert): Promise<boolean> {
  const admin = createAdminSupabaseClient()
  if (!admin) {
    console.warn("[vendor_email_events] skip insert (no service role):", row.eventType)
    return false
  }

  const ts = row.eventTimestamp?.trim() || new Date().toISOString()

  let payload: Record<string, unknown> | null = null
  if (row.rawPayload !== undefined) {
    try {
      payload = JSON.parse(JSON.stringify(row.rawPayload)) as Record<string, unknown>
    } catch {
      payload = { _note: "raw_payload_serialisation_failed" }
    }
  }

  const { error } = await admin.from("vendor_email_events").insert({
    resend_email_id: row.resendEmailId,
    vendor_email: row.vendorEmail,
    truck_id: row.truckId ?? null,
    campaign: row.campaign ?? null,
    event_type: row.eventType,
    event_timestamp: ts,
    link_url: row.linkUrl ?? null,
    raw_payload: payload,
  })

  if (error) {
    console.error("[vendor_email_events] insert error:", error.message, row.eventType, row.resendEmailId ?? "")
    return false
  }
  return true
}

/** First dispatch row for this Resend email id (for truck_id / campaign on webhook rows). */
export async function lookupVendorEmailDispatchMeta(resendEmailId: string): Promise<{
  truck_id: string | null
  campaign: string | null
} | null> {
  const admin = createAdminSupabaseClient()
  if (!admin || !resendEmailId.trim()) return null

  const { data, error } = await admin
    .from("vendor_email_events")
    .select("truck_id, campaign, event_type")
    .eq("resend_email_id", resendEmailId.trim())
    .order("created_at", { ascending: true })
    .limit(25)

  if (error) {
    console.error("[vendor_email_events] lookup error:", error.message)
    return null
  }
  const rows = (data ?? []) as { truck_id: string | null; campaign: string | null; event_type: string }[]
  const dispatch = rows.find((r) => r.event_type === "dispatch.log")
  const pick = dispatch ?? rows[0]
  if (!pick) return null
  return {
    truck_id: pick.truck_id ?? null,
    campaign: pick.campaign ?? null,
  }
}
