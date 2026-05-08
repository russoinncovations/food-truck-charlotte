/**
 * Deterministic placeholder images for trucks without photo_url.
 * Kept in sync with directory listing behavior (was app/trucks/page.tsx).
 */
export const TRUCK_IMAGE_FALLBACK_URLS = [
  "https://images.unsplash.com/photo-1687351977296-e909232009b4?w=400&h=300&fit=crop",
  "https://images.unsplash.com/photo-1509315811345-672d83ef2fbc?w=400&h=300&fit=crop",
  "https://images.unsplash.com/photo-1626186241349-5d5f44407f55?w=400&h=300&fit=crop",
  "https://images.unsplash.com/photo-1563861019306-9cccb83bdf0c?w=400&h=300&fit=crop",
  "https://images.unsplash.com/photo-1519861155730-0b5fbf0dd889?w=400&h=300&fit=crop",
  "https://images.unsplash.com/photo-1726868734684-ce396eef668e?w=400&h=300&fit=crop",
  "https://images.unsplash.com/photo-1669039415113-48f87a568fdd?w=400&h=300&fit=crop",
] as const

/** Same hashing as legacy directory cards — stable per truck id. */
export function getTruckFallbackImage(truckId: string): string {
  const index =
    truckId.split("").reduce((acc, c) => acc + c.charCodeAt(0), 0) % TRUCK_IMAGE_FALLBACK_URLS.length
  return TRUCK_IMAGE_FALLBACK_URLS[index]
}

/** Public URL from photo_url, or deterministic Unsplash fallback. */
export function getTruckDisplayImage(truckId: string, photoUrl: string | null | undefined): string {
  const trimmed = photoUrl?.trim()
  return trimmed ? trimmed : getTruckFallbackImage(truckId)
}
