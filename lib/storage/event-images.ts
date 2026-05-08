import { randomUUID } from "node:crypto"

export const EVENT_IMAGES_BUCKET = "event-images"

export const EVENT_IMAGE_MAX_BYTES = 5 * 1024 * 1024

export const EVENT_IMAGE_ALLOWED_TYPES = new Set(["image/jpeg", "image/png", "image/webp"])

/** Client- and server-safe validation message, or null if OK. */
export function validateEventImageFileMeta(type: string, size: number): string | null {
  if (size === 0) return "Choose an image file."
  if (!EVENT_IMAGE_ALLOWED_TYPES.has(type)) {
    return "Please use a JPG, PNG, or WebP image (max 5 MB)."
  }
  if (size > EVENT_IMAGE_MAX_BYTES) return "Image must be 5 MB or smaller."
  return null
}

export function extensionForImageMime(mime: string): string {
  if (mime === "image/jpeg") return "jpg"
  if (mime === "image/png") return "png"
  if (mime === "image/webp") return "webp"
  return "jpg"
}

export function buildEventImageObjectPath(prefix: string, mime: string): string {
  const ext = extensionForImageMime(mime)
  const safePrefix = prefix.replace(/[^a-zA-Z0-9/_-]/g, "").replace(/\/+/g, "/").replace(/^\/|\/$/g, "")
  return `${safePrefix || "uploads"}/${randomUUID()}.${ext}`
}
