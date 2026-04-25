import { CHARLOTTE_MAP_BOUNDS, isValidTruckMapCoordinates } from "@/lib/location/truck-map-coords"

const GEOCODE_ENDPOINT = "https://maps.googleapis.com/maps/api/geocode/json"

function getGoogleGeocodingApiKey(): string | null {
  const k =
    process.env.GOOGLE_GEOCODING_API_KEY?.trim() ||
    process.env.GOOGLE_MAPS_API_KEY?.trim() ||
    null
  return k && k.length > 0 ? k : null
}

/** Google `bounds` = southwest|northeast (lat,lng|lat,lng) — matches CHARLOTTE_MAP_BOUNDS. */
const CHARLOTTE_GEO_BOUNDS = `${CHARLOTTE_MAP_BOUNDS.minLat},${CHARLOTTE_MAP_BOUNDS.minLng}|${CHARLOTTE_MAP_BOUNDS.maxLat},${CHARLOTTE_MAP_BOUNDS.maxLng}`

export type GoogleGeocodeOk = {
  ok: true
  latitude: number
  longitude: number
  formatted_address: string
  place_id: string
  status: string
}

export type GoogleGeocodeFail = {
  ok: false
  status: string
  message: string
}

export type GoogleGeocodeOutcome = GoogleGeocodeOk | GoogleGeocodeFail

/**
 * Server-only Google Geocoding API. Uses GOOGLE_GEOCODING_API_KEY or GOOGLE_MAPS_API_KEY (never NEXT_PUBLIC).
 * Biases to Charlotte; drops results outside existing Charlotte map bounds.
 */
export async function geocodeWithGoogleServer(address: string | null | undefined): Promise<GoogleGeocodeOutcome> {
  const q = (address ?? "").trim()
  if (!q) {
    return { ok: false, status: "EMPTY", message: "No address to geocode." }
  }

  const key = getGoogleGeocodingApiKey()
  if (!key) {
    return {
      ok: false,
      status: "NO_API_KEY",
      message: "Set GOOGLE_GEOCODING_API_KEY or GOOGLE_MAPS_API_KEY on the server for geocoding.",
    }
  }

  const params = new URLSearchParams()
  params.set("address", q)
  params.set("key", key)
  params.set("region", "us")
  params.set("components", "country:US")
  params.set("bounds", CHARLOTTE_GEO_BOUNDS)

  const url = `${GEOCODE_ENDPOINT}?${params.toString()}`

  let json: {
    status?: string
    error_message?: string
    results?: {
      formatted_address?: string
      place_id?: string
      geometry?: { location?: { lat?: number; lng?: number } }
    }[]
  }

  try {
    const res = await fetch(url, { signal: AbortSignal.timeout(12_000), cache: "no-store" })
    json = (await res.json()) as typeof json
  } catch (e) {
    const msg = e instanceof Error ? e.message : "fetch failed"
    return { ok: false, status: "FETCH_ERROR", message: msg }
  }

  const topStatus = json.status ?? "UNKNOWN"
  if (topStatus !== "OK" || !json.results?.length) {
    return {
      ok: false,
      status: topStatus,
      message: json.error_message ?? (topStatus === "ZERO_RESULTS" ? "No results for this address." : "Geocoding did not return a result."),
    }
  }

  const first = json.results[0]
  const loc = first.geometry?.location
  const lat = loc?.lat
  const lng = loc?.lng
  if (typeof lat !== "number" || typeof lng !== "number" || !Number.isFinite(lat) || !Number.isFinite(lng)) {
    return { ok: false, status: "INVALID_RESPONSE", message: "Missing lat/lng in Geocoding response." }
  }

  if (!isValidTruckMapCoordinates(lat, lng)) {
    return {
      ok: false,
      status: "OUT_OF_CHARLOTTE_BOUNDS",
      message: `Google returned ${lat}, ${lng} which is outside the Charlotte-area map bounds.`,
    }
  }

  return {
    ok: true,
    latitude: lat,
    longitude: lng,
    formatted_address: first.formatted_address ?? q,
    place_id: first.place_id ?? "",
    status: topStatus,
  }
}
