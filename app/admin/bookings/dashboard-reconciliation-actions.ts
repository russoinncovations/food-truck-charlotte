"use server"

import { revalidatePath } from "next/cache"
import { createAdminSupabaseClient } from "@/lib/supabase/admin"
import { verifyAdminKey } from "@/lib/admin/verify-admin-key"
import {
  applyDashboardOpportunityReconciliation,
  recheckSingleOpportunityVisibility,
} from "@/lib/admin/fetch-dashboard-opportunity-reconciliation"

export async function recheckDashboardOpportunityVisibility(formData: FormData): Promise<{
  ok: boolean
  error?: string
  result?: Awaited<ReturnType<typeof recheckSingleOpportunityVisibility>>
}> {
  if (!verifyAdminKey(formData.get("adminKey") as string | null)) {
    return { ok: false, error: "Unauthorized" }
  }

  const opportunityId = String(formData.get("opportunityId") ?? "").trim()
  if (!opportunityId) {
    return { ok: false, error: "Missing opportunity id" }
  }

  const admin = createAdminSupabaseClient()
  if (!admin) {
    return { ok: false, error: "SUPABASE_SERVICE_ROLE_KEY is required" }
  }

  const result = await recheckSingleOpportunityVisibility(opportunityId, admin)
  if ("error" in result) {
    return { ok: false, error: result.error }
  }

  return { ok: true, result }
}

export async function reconcileHistoricalPendingOpportunities(formData: FormData): Promise<{
  ok: boolean
  error?: string
  result?: Awaited<ReturnType<typeof applyDashboardOpportunityReconciliation>>
}> {
  if (!verifyAdminKey(formData.get("adminKey") as string | null)) {
    return { ok: false, error: "Unauthorized" }
  }

  const admin = createAdminSupabaseClient()
  if (!admin) {
    return { ok: false, error: "SUPABASE_SERVICE_ROLE_KEY is required" }
  }

  const dryRun = String(formData.get("dryRun") ?? "true").trim() !== "false"

  const result = await applyDashboardOpportunityReconciliation({ dryRun, adminDb: admin })

  if (!dryRun) {
    revalidatePath("/admin/bookings/dashboard-reconciliation")
    revalidatePath("/admin/bookings")
    revalidatePath("/dashboard")
  }

  return { ok: true, result }
}
