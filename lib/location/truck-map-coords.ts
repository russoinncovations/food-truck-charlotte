/**
 * Map pins: Charlotte–area bounds (loose) to reject typos, null Island, or global misfits.
 * Lat/lng in WGS-84.
 */
const CLT = {
  minLat: 34.85,
  maxLat: 35.5,
  minLng: -81.2,
  maxLng: -80.4,
} as const

export function isValidTruckMapCoordinates(lat: unknown, lng: unknown): boolean {
  const la = typeof lat === "string" ? parseFloat(lat) : Number(lat)
  const lo = typeof lng === "string" ? parseFloat(lng) : Number(lng)
  if (!Number.isFinite(la) || !Number.isFinite(lo)) return false
  if (Math.abs(la) < 1e-6 && Math.abs(lo) < 1e-6) return false
  if (la < CLT.minLat || la > CLT.maxLat) return false
  if (lo < CLT.minLng || lo > CLT.maxLng) return false
  return true
}

export { CLT as CHARLOTTE_MAP_BOUNDS }
