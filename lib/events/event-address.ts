/**
 * Build a single line suitable for server-side geocoding (Charlotte, NC
 * appended when the line does not already include city/state).
 */

export function buildGeocodableLineFromParts(input: {
  address: string | null | undefined
  address_line1: string | null | undefined
  city: string | null | undefined
  state: string | null | undefined
  zip: string | null | undefined
  location_name: string | null | undefined
}): string | null {
  const oneLine = (input.address ?? "").trim()
  if (oneLine) {
    if (/charlotte|nc|north carolina/i.test(oneLine)) return oneLine
    return `${oneLine}, Charlotte, NC`
  }

  const line1 = (input.address_line1 ?? "").trim()
  const city = (input.city ?? "").trim() || "Charlotte"
  const st = (input.state ?? "").trim() || "NC"
  const zip = (input.zip ?? "").trim()
  if (line1) {
    return [line1, city, st, zip].filter(Boolean).join(", ")
  }

  const name = (input.location_name ?? "").trim()
  if (!name) return null
  if (/charlotte|nc|north carolina/i.test(name)) return name
  return `${name}, Charlotte, NC`
}

/** Promote-event form: street address, then venue name + Charlotte. */
export function buildGeocodableLineFromPromote(input: {
  streetAddress: string | null | undefined
  venueName: string | null | undefined
}): string | null {
  const street = (input.streetAddress ?? "").trim()
  if (street) {
    if (/charlotte|nc|north carolina/i.test(street)) return street
    return `${street}, Charlotte, NC`
  }
  const venue = (input.venueName ?? "").trim()
  if (!venue) return null
  if (/charlotte|nc|north carolina/i.test(venue)) return venue
  return `${venue}, Charlotte, NC`
}
