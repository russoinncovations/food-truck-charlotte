import { isValidTruckMapCoordinates } from "./truck-map-coords"

const NOMINATIM = "https://nominatim.openstreetmap.org/search"

export type GeocodeResult = { ok: true; lat: number; lng: number } | { ok: false; error: string }

/**
 * Geocode a freeform address/place string (bias toward Charlotte, NC).
 */
export async function geocodeCharlotteArea(query: string): Promise<GeocodeResult> {
  const q = query.trim()
  if (!q) {
    return { ok: false, error: "Enter a location to search." }
  }

  const searchQ = q.toLowerCase().includes("charlotte")
    ? q
    : `${q}, Charlotte, NC, USA`

  try {
    const url = new URL(NOMINATIM)
    url.searchParams.set("q", searchQ)
    url.searchParams.set("format", "json")
    url.searchParams.set("limit", "1")
    const res = await fetch(url.toString(), {
      headers: { "User-Agent": "foodtruckclt.com/1.0 (serving location)" },
      signal: AbortSignal.timeout(10_000),
    })
    if (!res.ok) {
      return { ok: false, error: "Location search failed. Try again." }
    }
    const data = (await res.json()) as { lat?: string; lon?: string }[]
    const lat = data[0]?.lat != null ? parseFloat(String(data[0].lat)) : NaN
    const lng = data[0]?.lon != null ? parseFloat(String(data[0].lon)) : NaN
    if (!isValidTruckMapCoordinates(lat, lng)) {
      return { ok: false, error: "Could not find a valid point in the Charlotte area. Try another search or set the pin manually." }
    }
    return { ok: true, lat, lng }
  } catch {
    return { ok: false, error: "Location search failed. Check your connection and try again." }
  }
}
