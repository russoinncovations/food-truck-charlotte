"use server"

/** Supabase Storage bucket for vendor/truck listing photos (`create_truck_photos_storage` migration). */
import { createClient } from "@/lib/supabase/server"
import { revalidatePath } from "next/cache"

const TRUCK_PHOTOS_BUCKET = "truck-photos"

const MAX_BYTES = 5 * 1024 * 1024

const ALLOWED_TYPES = new Set(["image/jpeg", "image/png", "image/webp", "image/gif"])

function buildObjectPath(truckId: string, originalFilename: string): string {
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

type VendorPhotoResult =
  | { status: "idle" }
  | { status: "success"; publicUrl: string }
  | { status: "error"; message: string }

export async function uploadVendorTruckPhoto(
  _prevState: VendorPhotoResult,
  formData: FormData
): Promise<VendorPhotoResult> {
  const truckId = (formData.get("truckId") as string | null)?.trim()
  const file = formData.get("photo")

  if (!truckId) {
    return { status: "error", message: "Missing truck." }
  }

  if (!(file instanceof File) || file.size === 0) {
    return { status: "error", message: "Choose an image file." }
  }

  if (!ALLOWED_TYPES.has(file.type)) {
    return { status: "error", message: "Use JPG, PNG, WebP, or GIF." }
  }

  if (file.size > MAX_BYTES) {
    return { status: "error", message: "Image must be 5 MB or smaller." }
  }

  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user?.email) {
    return { status: "error", message: "You must be signed in." }
  }

  const { data: row, error: rowError } = await supabase
    .from("trucks")
    .select("id")
    .eq("id", truckId)
    .eq("email", user.email)
    .maybeSingle()

  if (rowError || !row) {
    return { status: "error", message: "Could not update this truck." }
  }

  const path = buildObjectPath(truckId, file.name || "photo.jpg")
  const bytes = new Uint8Array(await file.arrayBuffer())

  const { error: uploadError } = await supabase.storage.from(TRUCK_PHOTOS_BUCKET).upload(path, bytes, {
    contentType: file.type || "application/octet-stream",
    cacheControl: "3600",
    upsert: false,
  })

  if (uploadError) {
    return { status: "error", message: uploadError.message || "Upload failed." }
  }

  const {
    data: { publicUrl },
  } = supabase.storage.from(TRUCK_PHOTOS_BUCKET).getPublicUrl(path)

  const { error: updateError } = await supabase
    .from("trucks")
    .update({ photo_url: publicUrl })
    .eq("id", truckId)
    .eq("email", user.email)

  if (updateError) {
    return { status: "error", message: updateError.message || "Could not save photo URL." }
  }

  revalidatePath("/dashboard/profile")
  revalidatePath("/trucks")

  return { status: "success", publicUrl }
}
