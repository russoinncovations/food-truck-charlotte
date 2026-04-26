/**
 * Parse stored lat/lng from DB (string or number). No server / geocoding dependencies —
 * safe to import from client and server.
 */
export function toNumericCoord(v: string | number | null | undefined): number | null {
  if (v == null) return null
  const n = typeof v === "string" ? parseFloat(v) : Number(v)
  return Number.isFinite(n) ? n : null
}
