/** Canonical production vendor dashboard origin for booking-opportunity alert emails. */
export const VENDOR_OPPORTUNITY_DASHBOARD_ORIGIN = "https://vendor.foodtruckclt.com"

/** Same-origin dashboard path with opportunity deep-link query (path-only, for login `next`). */
export function buildVendorDashboardOpportunityPath(opportunityId: string): string {
  const id = opportunityId.trim()
  return `/dashboard?opportunity=${encodeURIComponent(id)}`
}

/** Absolute production URL for vendor booking-opportunity email CTAs. */
export function buildVendorOpportunityDashboardUrl(opportunityId: string): string {
  return `${VENDOR_OPPORTUNITY_DASHBOARD_ORIGIN}${buildVendorDashboardOpportunityPath(opportunityId)}`
}
