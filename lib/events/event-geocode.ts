import { geocodeWithGoogleServer } from "@/lib/location/google-geocoding"
import { isValidTruckMapCoordinates } from "@/lib/location/truck-map-coords"

export type StoredEventCoords = {
  lat: number
  lng: number
  formatted_address?: string
  place_id?: string
  status?: string
}

/**
 * One-shot geocode for persisting to `events` / `event_submissions` (Google Geocoding API, server-only).
 * Returns null if empty, no API key, API error, or coordinates outside Charlotte bounds.
 */
export async function geocodeEventAddressForStorage(
  addressLine: string | null | undefined
): Promise<StoredEventCoords | null> {
  const line = (addressLine ?? "").trim()
  if (!line) return null

  const outcome = await geocodeWithGoogleServer(line)
  if (!outcome.ok) {
    console.warn("[event-geocode] Google geocode failed:", outcome.status, outcome.message, { addressLine: line })
    return null
  }

  return {
    lat: outcome.latitude,
    lng: outcome.longitude,
    formatted_address: outcome.formatted_address,
    place_id: outcome.place_id,
    status: outcome.status,
  }
}

export { toNumericCoord } from "@/lib/location/numeric-coord"

export function coordsAreValidForMap(lat: unknown, lng: unknown): boolean {
  if (lat == null || lng == null) return false
  return isValidTruckMapCoordinates(
    typeof lat === "string" ? parseFloat(lat) : Number(lat),
    typeof lng === "string" ? parseFloat(lng) : Number(lng)
  )
}
