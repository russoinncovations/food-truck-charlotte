/** Host label for role-specific subdomain entry (`live.` / `vendor.` / `admin.`). */
export type FtcltRoleHost = "live" | "vendor" | "admin"

const ROLE: Record<string, FtcltRoleHost> = {
  live: "live",
  vendor: "vendor",
  admin: "admin",
}

/** Optional; defaults to `foodtruckclt.com` (prod). Allows staging apex if configured. */
function rootDomainPrimary(): string {
  const raw = process.env.NEXT_PUBLIC_ROOT_DOMAIN?.trim() ?? ""
  const base = (raw.replace(/^https?:\/\//i, "").split(":")[0]?.split("/")[0] ?? "foodtruckclt.com").toLowerCase()
  return base || "foodtruckclt.com"
}

/**
 * Parses `live|vendor|admin` from hostname for PWA subdomain routing:
 * - `live.foodtruckclt.com`, `vendor.foodtruckclt.com`, `admin.foodtruckclt.com`
 * - Local: `live.localhost`, `vendor.localhost`, `admin.localhost`
 */
export function getRoleSubdomainFromHost(rawHost: string | null | undefined): FtcltRoleHost | null {
  if (!rawHost) return null
  const host = rawHost.split(":")[0].toLowerCase()
  if (host === "localhost") return null

  // live.localhost, vendor.localhost (dev convenience)
  if (host.endsWith(".localhost")) {
    const label = host.slice(0, host.length - ".localhost".length)
    if (!label || label === "localhost") return null
    return ROLE[label] ?? null
  }

  const root = rootDomainPrimary()
  const suffix = `.${root}`
  if (!host.endsWith(suffix) || host === root) return null

  const label = host.slice(0, -suffix.length).toLowerCase()
  return ROLE[label] ?? null
}

/** Path redirect for subdomain root `/` visits (stable install entry URLs). */
export function roleHostRootRedirectTarget(role: FtcltRoleHost): string {
  switch (role) {
    case "live":
      return "/map"
    case "vendor":
      return "/dashboard/live"
    case "admin":
      return "/admin"
  }
}
