import { isValidTruckMapCoordinates } from "@/lib/location/truck-map-coords"

/**
 * Nominatim (OpenStreetMap) — use sparingly; respect
 * https://operations.osmfoundation.org/policies/nominatim/ (1 req/s, identify app).
 */
export async function geocodeNominatim(addressLine: string): Promise<{ lat: number; lng: number } | null> {
  const q = addressLine.trim()
  if (!q) return null
  try {
    const geoRes = await fetch(
      `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(q)}&format=json&limit=1`,
      { headers: { "User-Agent": "FoodTruckCLT/1.0 (https://foodtruckclt.com)" }, signal: AbortSignal.timeout(8000) }
    )
    const geoData = (await geoRes.json()) as { lat?: string; lon?: string }[]
    const la = geoData[0]?.lat != null ? parseFloat(geoData[0].lat) : undefined
    const lo = geoData[0]?.lon != null ? parseFloat(geoData[0].lon) : undefined
    if (la == null || lo == null || !Number.isFinite(la) || !Number.isFinite(lo)) return null
    return { lat: la, lng: lo }
  } catch {
    return null
  }
}

/** Vendor serving flow: geocode and require a pin in the Charlotte map bounds. */
export async function geocodeCharlotteArea(
  addressLine: string
): Promise<{ ok: true; lat: number; lng: number } | { ok: false; error: string }> {
  const coords = await geocodeNominatim(addressLine)
  if (!coords) {
    return { ok: false, error: "Could not find that address. Try a street address in the Charlotte area." }
  }
  if (!isValidTruckMapCoordinates(coords.lat, coords.lng)) {
    return { ok: false, error: "That location looks outside the Charlotte service area. Try a local address." }
  }
  return { ok: true, lat: coords.lat, lng: coords.lng }
}
