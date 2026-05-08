/**
 * Local stock imagery — deterministic rotation keeps listings varied without an empty gray box.
 * Paths are served from `public/images/`.
 */
export const EVENT_IMAGE_FALLBACK_PATHS = [
  "/images/event-festival.jpg",
  "/images/hero-truck.jpg",
  "/images/truck-bbq.jpg",
  "/images/truck-wings.jpg",
  "/images/truck-tacos.jpg",
  "/images/truck-desserts.jpg",
] as const

export type EventImageFields = {
  imageUrl?: string | null
  featuredImageUrl?: string | null
}

export const EVENT_LISTING_DESCRIPTION_FALLBACK =
  "Details coming soon. Check the event page for updates."

function hashSeed(seed: string): number {
  return [...seed].reduce((acc, c) => acc + c.charCodeAt(0), 0)
}

/** Stable image path per event (id + slug) so siblings rarely share the same placeholder. */
export function getEventFallbackImage(seed: string): string {
  const n = hashSeed(seed)
  return EVENT_IMAGE_FALLBACK_PATHS[n % EVENT_IMAGE_FALLBACK_PATHS.length] ?? EVENT_IMAGE_FALLBACK_PATHS[0]
}

function firstAvailableUrl(fields: EventImageFields): string | undefined {
  for (const v of [fields.imageUrl, fields.featuredImageUrl]) {
    const t = v?.trim()
    if (t) return t
  }
  return undefined
}

/**
 * Prefer uploaded `image_url`, then `featured_image_url`; otherwise a deterministic local fallback.
 */
export function getEventDisplayImage(
  eventId: string,
  slug: string | null | undefined,
  fields: EventImageFields
): string {
  const url = firstAvailableUrl(fields)
  if (url) return url
  return getEventFallbackImage(`${eventId}:${slug ?? ""}`)
}
