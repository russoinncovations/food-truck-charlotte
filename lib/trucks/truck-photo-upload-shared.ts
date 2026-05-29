export const TRUCK_PHOTOS_BUCKET = "truck-photos"

export const TRUCK_PHOTO_MAX_BYTES = 5 * 1024 * 1024

export const TRUCK_PHOTO_ALLOWED_TYPES = new Set(["image/jpeg", "image/png", "image/webp"])

export const TRUCK_PHOTO_ACCEPT = "image/jpeg,image/png,image/webp"

export type TruckPhotoTarget = "listing" | "hero" | "gallery"

export function truckPhotoTargetLabel(target: TruckPhotoTarget): string {
  switch (target) {
    case "listing":
      return "Listing photo"
    case "hero":
      return "Hero photo"
    case "gallery":
      return "Gallery photo"
  }
}

export function validateTruckPhotoFile(file: File): string | null {
  if (file.size === 0) return "Choose an image file."
  if (!TRUCK_PHOTO_ALLOWED_TYPES.has(file.type)) {
    return "Use JPG, PNG, or WebP (max 5 MB)."
  }
  if (file.size > TRUCK_PHOTO_MAX_BYTES) return "Image must be 5 MB or smaller."
  return null
}

export function buildTruckPhotoObjectPath(truckId: string, originalFilename: string): string {
  const match = /\.([a-zA-Z0-9]+)$/.exec(originalFilename)
  const ext = match ? `.${match[1].toLowerCase()}` : ""
  const base = originalFilename
    .replace(/\.[^/.]+$/, "")
    .slice(0, 80)
    .replace(/[^a-zA-Z0-9_-]+/g, "-")
    .replace(/^-+|-+$/g, "")
  const safeBase = base || "photo"
  return `${truckId}/${Date.now()}-${safeBase}${ext}`
}
