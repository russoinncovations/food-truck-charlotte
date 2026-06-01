import { timingSafeEqual } from "crypto"

function isProduction(): boolean {
  return process.env.NODE_ENV === "production"
}

/** Server-only configured admin secret. Never send this value to the client. */
export function getConfiguredAdminKey(): string | null {
  const key = process.env.ADMIN_KEY?.trim()
  return key || null
}

export function isAdminKeyConfigured(): boolean {
  return getConfiguredAdminKey() !== null
}

function safeEqual(provided: string, expected: string): boolean {
  if (provided.length !== expected.length) return false
  return timingSafeEqual(Buffer.from(provided), Buffer.from(expected))
}

/** Returns true when `provided` matches the configured ADMIN_KEY. */
export function verifyAdminKey(provided: string | null | undefined): boolean {
  const expected = getConfiguredAdminKey()
  if (!expected) {
    if (isProduction()) {
      console.error("[admin] ADMIN_KEY is not set — denying access")
    }
    return false
  }

  const raw = (provided ?? "").trim()
  if (!raw) return false
  return safeEqual(raw, expected)
}

export type AdminPageAccessResult =
  | { allowed: true }
  | { allowed: false; reason: "not_configured" | "denied" }

/** Gate admin pages loaded with `?key=…`. */
export function checkAdminPageAccess(providedKey: string | null | undefined): AdminPageAccessResult {
  if (!isAdminKeyConfigured()) {
    return { allowed: false, reason: "not_configured" }
  }
  if (!verifyAdminKey(providedKey)) {
    return { allowed: false, reason: "denied" }
  }
  return { allowed: true }
}
