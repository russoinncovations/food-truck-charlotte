/**
 * Must match the address line built for geocoding (location name + street, trimmed).
 * Used to verify the map pin is still for the current text fields, not a stale one.
 */
export function servingAddressSearchLine(locationName: string, streetAddress: string): string {
  return [locationName.trim(), streetAddress.trim()].filter(Boolean).join(", ")
}

/** Client + server: cannot save or go live without a valid map pin (lat/lng) that matches the address fields. */
export const SERVING_REQUIRES_MAP_PIN_ERROR =
  "Please find or place the pin on the map before saving."
