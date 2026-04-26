import { NextResponse } from "next/server"

/**
 * Temporary diagnostic: verify Google Geocoding from the server (e.g. Vercel).
 * Remove or protect this route when done — do not add auth secrets to responses.
 */
export const dynamic = "force-dynamic"

const TEST_ADDRESS = "324 S Mint St, Charlotte, NC 28202"
const GEOCODE_ENDPOINT = "https://maps.googleapis.com/maps/api/geocode/json"

function hasEnvKey(name: "GOOGLE_GEOCODING_API_KEY" | "GOOGLE_MAPS_API_KEY"): boolean {
  const v = process.env[name]?.trim()
  return Boolean(v)
}

/** Prefer GOOGLE_GEOCODING_API_KEY, then GOOGLE_MAPS_API_KEY (server keys only; never log). */
function resolveGeocodingKey(): string | null {
  const primary = process.env.GOOGLE_GEOCODING_API_KEY?.trim()
  if (primary) return primary
  const fallback = process.env.GOOGLE_MAPS_API_KEY?.trim()
  if (fallback) return fallback
  return null
}

type GeocodeJson = {
  status?: string
  error_message?: string
  results?: Array<{
    formatted_address?: string
    geometry?: { location?: { lat?: number; lng?: number } }
  }>
}

export async function GET() {
  const hasGoogleGeocodingKey = hasEnvKey("GOOGLE_GEOCODING_API_KEY")
  const hasGoogleMapsKey = hasEnvKey("GOOGLE_MAPS_API_KEY")

  try {
    const key = resolveGeocodingKey()
    if (!key) {
      return NextResponse.json({
        hasGoogleGeocodingKey,
        hasGoogleMapsKey,
        googleStatus: "NO_API_KEY",
        errorMessage: "Set GOOGLE_GEOCODING_API_KEY or GOOGLE_MAPS_API_KEY (server) to test geocoding.",
        formattedAddress: null,
        lat: null,
        lng: null,
      })
    }

    const params = new URLSearchParams()
    params.set("address", TEST_ADDRESS)
    params.set("key", key)
    params.set("region", "us")
    params.set("components", "country:US")

    const url = `${GEOCODE_ENDPOINT}?${params.toString()}`
    const res = await fetch(url, { signal: AbortSignal.timeout(15_000), cache: "no-store" })
    const json = (await res.json()) as GeocodeJson

    const googleStatus = json.status ?? "UNKNOWN"

    if (googleStatus !== "OK" || !json.results?.[0]) {
      return NextResponse.json({
        hasGoogleGeocodingKey,
        hasGoogleMapsKey,
        googleStatus,
        errorMessage:
          json.error_message?.trim() ||
          (googleStatus === "ZERO_RESULTS" ? "No results for this address." : `Geocoding status: ${googleStatus}`),
        formattedAddress: null,
        lat: null,
        lng: null,
      })
    }

    const first = json.results[0]
    const loc = first.geometry?.location
    const lat = typeof loc?.lat === "number" && Number.isFinite(loc.lat) ? loc.lat : null
    const lng = typeof loc?.lng === "number" && Number.isFinite(loc.lng) ? loc.lng : null
    if (lat == null || lng == null) {
      return NextResponse.json({
        hasGoogleGeocodingKey,
        hasGoogleMapsKey,
        googleStatus: "INVALID_RESPONSE",
        errorMessage: "Response missing lat/lng.",
        formattedAddress: first.formatted_address ?? null,
        lat: null,
        lng: null,
      })
    }

    return NextResponse.json({
      hasGoogleGeocodingKey,
      hasGoogleMapsKey,
      googleStatus,
      errorMessage: null,
      formattedAddress: first.formatted_address ?? null,
      lat,
      lng,
    })
  } catch (e) {
    const errorMessage = e instanceof Error ? e.message : "Unknown error"
    return NextResponse.json({
      hasGoogleGeocodingKey,
      hasGoogleMapsKey,
      googleStatus: "EXCEPTION",
      errorMessage,
      formattedAddress: null,
      lat: null,
      lng: null,
    })
  }
}
