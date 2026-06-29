import { safeAuthNextPath } from "@/lib/auth/safe-auth-next-path"
import { buildVendorDashboardOpportunityPath } from "@/lib/email/vendor-opportunity-dashboard-url"

export function parseDashboardOpportunityId(raw: string | null | undefined): string | null {
  const id = (raw ?? "").trim()
  return id || null
}

/** Logged-out deep link → vendor login with safe return path to the opportunity dashboard. */
export function buildVendorLoginRedirectForDashboardOpportunity(opportunityId: string): string {
  const returnPath = buildVendorDashboardOpportunityPath(opportunityId)
  return `/vendor-login?next=${encodeURIComponent(returnPath)}`
}

/** Magic-link callback `next` — reuses existing open-redirect guard. */
export function resolveVendorLoginCallbackNext(
  nextParam: string | null | undefined,
  fallback: string
): string {
  return safeAuthNextPath(nextParam, fallback)
}

export type DeepLinkOpportunityCandidate = {
  id: string
  status: string
}

/**
 * Opens detail sheet only when the requested id is a visible pending opportunity for this vendor.
 */
export function resolvePendingDeepLinkOpportunity<T extends DeepLinkOpportunityCandidate>(
  pendingOpportunities: T[],
  requestedOpportunityId: string | null | undefined
): T | null {
  const requested = parseDashboardOpportunityId(requestedOpportunityId)
  if (!requested) return null
  const match = pendingOpportunities.find((o) => o.id === requested)
  if (!match) return null
  if (String(match.status ?? "").trim().toLowerCase() !== "pending") return null
  return match
}
