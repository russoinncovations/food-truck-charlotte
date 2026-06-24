import type { SupabaseClient } from "@supabase/supabase-js"
import { createAdminSupabaseClient } from "@/lib/supabase/admin"
import type { BookingRequestEmbed } from "@/lib/dashboard/vendor-booking-opportunity-visibility"
import {
  evaluatePendingOpportunityDashboardVisibility,
  proposeSafeReconciliationFixes,
  type ReconciliationCategory,
  type SafeReconciliationFix,
} from "@/lib/dashboard/evaluate-pending-opportunity-dashboard-visibility"
import { isInternalTestBookingRequest } from "@/lib/dashboard/vendor-booking-opportunity-visibility"
import { isInternalTestTruck } from "@/lib/trucks/internal-test-recipients"
import { isBookingActiveForVendorOpportunities } from "@/lib/booking/booking-request-status"
import { resolveCanonicalVendorNotificationEmail } from "@/lib/trucks/canonical-vendor-email"

export type DashboardReconciliationRow = {
  opportunityId: string
  bookingRequestId: string | null
  eventDate: string | null
  hostName: string | null
  hostEmail: string | null
  truckId: string | null
  truckName: string | null
  truckEmail: string | null
  canonicalTruckEmail: string | null
  opportunityCreatedAt: string | null
  notificationStatus: string | null
  notificationTrackingKind: string
  visibleInRequestsToConfirm: boolean
  expectedSection: string
  exclusionReasons: string[]
  category: ReconciliationCategory
  inAuditScope: boolean
  auditScopeNote: string | null
  proposedFixes: SafeReconciliationFix[]
}

export type DashboardReconciliationSummary = {
  reviewedAt: string
  totalPendingFetched: number
  inAuditScopeCount: number
  visibleCount: number
  notVisibleCount: number
  byCategory: Record<ReconciliationCategory, number>
  usedServiceRole: boolean
  fetchError: string | null
}

export type DashboardReconciliationReport = {
  summary: DashboardReconciliationSummary
  rows: DashboardReconciliationRow[]
}

type OppRow = {
  id: string
  truck_id: string | null
  status: string
  created_at: string | null
  booking_request_id: string | null
  notification_status: string | null
  notification_sent_at: string | null
  resend_email_id: string | null
  delivered_at: string | null
  booking_requests: unknown
  trucks: unknown
}

function parseBooking(row: unknown): BookingRequestEmbed | null {
  const raw = Array.isArray(row) ? row[0] : row
  if (!raw || typeof raw !== "object") return null
  return raw as BookingRequestEmbed
}

function parseTruck(row: unknown): {
  id: string
  name: string | null
  email: string | null
  is_active: boolean | null
  status: string | null
} | null {
  const raw = Array.isArray(row) ? row[0] : row
  if (!raw || typeof raw !== "object") return null
  const t = raw as Record<string, unknown>
  if (!t.id) return null
  return {
    id: String(t.id),
    name: (t.name as string | null) ?? null,
    email: (t.email as string | null) ?? null,
    is_active: (t.is_active as boolean | null) ?? null,
    status: (t.status as string | null) ?? null,
  }
}

function isInAuditScope(
  oppStatus: string,
  br: BookingRequestEmbed | null,
  truck: ReturnType<typeof parseTruck>
): { inScope: boolean; note: string | null } {
  if (String(oppStatus).trim().toLowerCase() !== "pending") {
    return { inScope: false, note: "Opportunity status is not pending." }
  }
  if (!br) {
    return { inScope: false, note: "Missing booking_request." }
  }
  if (!isBookingActiveForVendorOpportunities(br.status)) {
    return { inScope: false, note: "Booking is terminal for vendors." }
  }
  if (!truck?.id) {
    return { inScope: false, note: "Missing truck_id / truck row." }
  }
  const internalBooking = isInternalTestBookingRequest(br)
  const internalTruck = isInternalTestTruck(truck)
  if (internalBooking && !internalTruck) {
    return { inScope: false, note: "INTERNAL TEST booking on production truck — excluded from production audit." }
  }
  return { inScope: true, note: null }
}

const EMPTY_CATEGORIES: Record<ReconciliationCategory, number> = {
  visible_healthy: 0,
  identity_email_mismatch: 0,
  rls_policy: 0,
  deleted_inactive_malformed_truck: 0,
  terminal_booking_status: 0,
  internal_test_exception: 0,
  needs_manual_review: 0,
}

const OPP_SELECT = `
  id, truck_id, status, created_at, booking_request_id,
  notification_status, notification_sent_at, resend_email_id, delivered_at,
  booking_requests (
    id, status, event_date, contact_name, contact_email, additional_notes, venue_name
  ),
  trucks (
    id, name, email, is_active, status
  )
`

export async function fetchDashboardOpportunityReconciliation(
  adminDb?: SupabaseClient | null
): Promise<DashboardReconciliationReport> {
  const admin = adminDb ?? createAdminSupabaseClient()
  const usedServiceRole = Boolean(admin)

  if (!admin) {
    return {
      summary: {
        reviewedAt: new Date().toISOString(),
        totalPendingFetched: 0,
        inAuditScopeCount: 0,
        visibleCount: 0,
        notVisibleCount: 0,
        byCategory: { ...EMPTY_CATEGORIES },
        usedServiceRole: false,
        fetchError: "SUPABASE_SERVICE_ROLE_KEY is required for reconciliation.",
      },
      rows: [],
    }
  }

  const { data, error } = await admin
    .from("truck_opportunities")
    .select(OPP_SELECT)
    .ilike("status", "pending")
    .order("created_at", { ascending: false })

  if (error) {
    return {
      summary: {
        reviewedAt: new Date().toISOString(),
        totalPendingFetched: 0,
        inAuditScopeCount: 0,
        visibleCount: 0,
        notVisibleCount: 0,
        byCategory: { ...EMPTY_CATEGORIES },
        usedServiceRole,
        fetchError: error.message,
      },
      rows: [],
    }
  }

  const opps = (data ?? []) as OppRow[]
  const rows: DashboardReconciliationRow[] = []
  const byCategory = { ...EMPTY_CATEGORIES }
  let inAuditScopeCount = 0
  let visibleCount = 0
  let notVisibleCount = 0

  for (const opp of opps) {
    const br = parseBooking(opp.booking_requests)
    const truck = parseTruck(opp.trucks)
    const scope = isInAuditScope(opp.status, br, truck)

    const visibility = evaluatePendingOpportunityDashboardVisibility({
      opportunityStatus: opp.status,
      bookingRequest: br,
      truck,
      notificationStatus: opp.notification_status,
      notification_sent_at: opp.notification_sent_at,
      resend_email_id: opp.resend_email_id,
      delivered_at: opp.delivered_at,
    })

    const proposedFixes = proposeSafeReconciliationFixes({
      opportunityId: opp.id,
      opportunityStatus: opp.status,
      visibility,
    })

    if (scope.inScope) {
      inAuditScopeCount += 1
      byCategory[visibility.category] += 1
      if (visibility.visibleInRequestsToConfirm) {
        visibleCount += 1
      } else {
        notVisibleCount += 1
      }
    }

    rows.push({
      opportunityId: opp.id,
      bookingRequestId: opp.booking_request_id,
      eventDate: br?.event_date ?? null,
      hostName: br?.contact_name ?? null,
      hostEmail: br?.contact_email ?? null,
      truckId: truck?.id ?? opp.truck_id,
      truckName: truck?.name ?? null,
      truckEmail: truck?.email ?? null,
      canonicalTruckEmail: truck ? resolveCanonicalVendorNotificationEmail(truck) : null,
      opportunityCreatedAt: opp.created_at,
      notificationStatus: opp.notification_status,
      notificationTrackingKind: visibility.notificationTrackingKind,
      visibleInRequestsToConfirm: visibility.visibleInRequestsToConfirm,
      expectedSection: visibility.expectedSection,
      exclusionReasons: visibility.exclusionReasons,
      category: visibility.category,
      inAuditScope: scope.inScope,
      auditScopeNote: scope.note,
      proposedFixes,
    })
  }

  return {
    summary: {
      reviewedAt: new Date().toISOString(),
      totalPendingFetched: opps.length,
      inAuditScopeCount,
      visibleCount,
      notVisibleCount,
      byCategory,
      usedServiceRole,
      fetchError: null,
    },
    rows,
  }
}

export type RecheckOpportunityResult = {
  opportunityId: string
  visibleInRequestsToConfirm: boolean
  expectedSection: string
  category: ReconciliationCategory
  exclusionReasons: string[]
  notificationTrackingKind: string
  proposedFixes: SafeReconciliationFix[]
}

export async function recheckSingleOpportunityVisibility(
  opportunityId: string,
  adminDb?: SupabaseClient | null
): Promise<RecheckOpportunityResult | { error: string }> {
  const admin = adminDb ?? createAdminSupabaseClient()
  if (!admin) return { error: "SUPABASE_SERVICE_ROLE_KEY is required" }

  const { data, error } = await admin
    .from("truck_opportunities")
    .select(OPP_SELECT)
    .eq("id", opportunityId.trim())
    .maybeSingle()

  if (error || !data) {
    return { error: error?.message ?? "Opportunity not found" }
  }

  const opp = data as OppRow
  const br = parseBooking(opp.booking_requests)
  const truck = parseTruck(opp.trucks)

  const visibility = evaluatePendingOpportunityDashboardVisibility({
    opportunityStatus: opp.status,
    bookingRequest: br,
    truck,
    notificationStatus: opp.notification_status,
    notification_sent_at: opp.notification_sent_at,
    resend_email_id: opp.resend_email_id,
    delivered_at: opp.delivered_at,
  })

  const proposedFixes = proposeSafeReconciliationFixes({
    opportunityId: opp.id,
    opportunityStatus: opp.status,
    visibility,
  })

  return {
    opportunityId: opp.id,
    visibleInRequestsToConfirm: visibility.visibleInRequestsToConfirm,
    expectedSection: visibility.expectedSection,
    category: visibility.category,
    exclusionReasons: visibility.exclusionReasons,
    notificationTrackingKind: visibility.notificationTrackingKind,
    proposedFixes,
  }
}

export type ReconciliationApplyLogEntry = {
  opportunityId: string
  fixType: SafeReconciliationFix["type"]
  before: string
  after: string
  visibleBefore: boolean
  visibleAfter: boolean
  applied: boolean
  error: string | null
}

export type ReconciliationApplyResult = {
  dryRun: boolean
  proposedFixCount: number
  appliedCount: number
  skippedCount: number
  byCategoryBefore: Record<ReconciliationCategory, number>
  logs: ReconciliationApplyLogEntry[]
}

export async function applyDashboardOpportunityReconciliation(opts: {
  dryRun: boolean
  adminDb?: SupabaseClient | null
}): Promise<ReconciliationApplyResult> {
  const report = await fetchDashboardOpportunityReconciliation(opts.adminDb)
  const admin = opts.adminDb ?? createAdminSupabaseClient()
  const byCategoryBefore = { ...report.summary.byCategory }

  const logs: ReconciliationApplyLogEntry[] = []
  let proposedFixCount = 0
  let appliedCount = 0
  let skippedCount = 0

  if (!admin) {
    return {
      dryRun: opts.dryRun,
      proposedFixCount: 0,
      appliedCount: 0,
      skippedCount: 0,
      byCategoryBefore,
      logs: [],
    }
  }

  for (const row of report.rows) {
    if (!row.inAuditScope || row.proposedFixes.length === 0) continue

    for (const fix of row.proposedFixes) {
      proposedFixCount += 1
      const visibleBefore = row.visibleInRequestsToConfirm

      if (fix.type === "normalize_opportunity_status") {
        if (opts.dryRun) {
          logs.push({
            opportunityId: fix.opportunityId,
            fixType: fix.type,
            before: fix.before,
            after: fix.after,
            visibleBefore,
            visibleAfter: true,
            applied: false,
            error: null,
          })
          continue
        }

        const { data: updated, error: updateErr } = await admin
          .from("truck_opportunities")
          .update({ status: fix.after })
          .eq("id", fix.opportunityId)
          .eq("status", fix.before)
          .select("id")
          .maybeSingle()

        if (updateErr || !updated) {
          skippedCount += 1
          logs.push({
            opportunityId: fix.opportunityId,
            fixType: fix.type,
            before: fix.before,
            after: fix.after,
            visibleBefore,
            visibleAfter: visibleBefore,
            applied: false,
            error: updateErr?.message ?? "Row not updated (status may have changed)",
          })
          continue
        }

        const recheck = await recheckSingleOpportunityVisibility(fix.opportunityId, admin)
        const visibleAfter =
          "visibleInRequestsToConfirm" in recheck ? recheck.visibleInRequestsToConfirm : visibleBefore

        appliedCount += 1
        logs.push({
          opportunityId: fix.opportunityId,
          fixType: fix.type,
          before: fix.before,
          after: fix.after,
          visibleBefore,
          visibleAfter,
          applied: true,
          error: null,
        })
      }
    }
  }

  return {
    dryRun: opts.dryRun,
    proposedFixCount,
    appliedCount,
    skippedCount,
    byCategoryBefore,
    logs,
  }
}

export const RECONCILIATION_CATEGORY_LABELS: Record<ReconciliationCategory, string> = {
  visible_healthy: "Visible and healthy",
  identity_email_mismatch: "Truck identity / email resolution mismatch",
  rls_policy: "RLS / booking embed policy",
  deleted_inactive_malformed_truck: "Deleted / inactive / malformed truck",
  terminal_booking_status: "Terminal booking status",
  internal_test_exception: "Internal / test exception",
  needs_manual_review: "Needs manual review",
}
