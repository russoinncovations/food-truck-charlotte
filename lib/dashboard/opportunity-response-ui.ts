export type LocalOpportunityResponse = "interested" | "not_available"

export function opportunityResponseLabel(status: string): string {
  const s = status.toLowerCase()
  if (s === "interested") return "Interested"
  if (s === "pass" || s === "not_available") return "Not available"
  if (s === "expired") return "Expired"
  if (s === "pending") return "Pending"
  return status
}

export function getEffectiveOpportunityStatus(
  serverStatus: string,
  localOverride?: LocalOpportunityResponse | null
): string {
  if (localOverride) return localOverride
  return serverStatus
}

export function isOpportunityPendingForAction(effectiveStatus: string): boolean {
  return effectiveStatus.toLowerCase() === "pending"
}

export function isOpportunityInterested(effectiveStatus: string): boolean {
  return effectiveStatus.toLowerCase() === "interested"
}

export function isOpportunityNotAvailable(effectiveStatus: string): boolean {
  const s = effectiveStatus.toLowerCase()
  return s === "not_available" || s === "pass"
}
