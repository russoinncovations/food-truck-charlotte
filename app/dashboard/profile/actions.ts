"use server"

/** Supabase Storage bucket for vendor/truck listing photos (`create_truck_photos_storage` migration). */
import { createClient } from "@/lib/supabase/server"
import { revalidatePath } from "next/cache"

const TRUCK_PHOTOS_BUCKET = "truck-photos"

const MAX_BYTES = 5 * 1024 * 1024

const ALLOWED_TYPES = new Set(["image/jpeg", "image/png", "image/webp", "image/gif"])

export type VendorTruckPhotoUploadResult =
  | { status: "success"; publicUrl: string }
  | { status: "error"; message: string }

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

function serializeUnknown(err: unknown): string {
  if (err instanceof Error) return err.message
  if (typeof err === "object" && err !== null) {
    try {
      return JSON.stringify(err)
    } catch {
      return String(err)
    }
  }
  return String(err)
}

export async function uploadVendorTruckPhoto(
  _prevState: unknown,
  formData: FormData
): Promise<VendorTruckPhotoUploadResult> {
  try {
    const truckId = (formData.get("truckId") as string | null)?.trim()
    const file = formData.get("photo")

    if (!truckId) {
      const message = "Missing truck."
      console.error("[uploadVendorTruckPhoto] validation error:", message)
      return { status: "error", message }
    }

    if (!(file instanceof File) || file.size === 0) {
      const message = "Choose an image file."
      console.error("[uploadVendorTruckPhoto] validation error:", message)
      return { status: "error", message }
    }

    if (!ALLOWED_TYPES.has(file.type)) {
      const message = "Use JPG, PNG, WebP, or GIF."
      console.error("[uploadVendorTruckPhoto] validation error:", message)
      return { status: "error", message }
    }

    if (file.size > MAX_BYTES) {
      const message = "Image must be 5 MB or smaller."
      console.error("[uploadVendorTruckPhoto] validation error:", message)
      return { status: "error", message }
    }

    const supabase = await createClient()
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError) {
      console.error("[uploadVendorTruckPhoto] auth.getUser error:", authError)
      return {
        status: "error",
        message: authError.message || "Authentication failed.",
      }
    }

    if (!user?.email) {
      const message = "You must be signed in."
      console.error("[uploadVendorTruckPhoto] validation error:", message)
      return { status: "error", message }
    }

    const { data: row, error: rowError } = await supabase
      .from("trucks")
      .select("id")
      .eq("id", truckId)
      .eq("email", user.email)
      .maybeSingle()

    if (rowError) {
      console.error("[uploadVendorTruckPhoto] trucks lookup error:", rowError)
      return {
        status: "error",
        message: rowError.message || "Could not update this truck.",
      }
    }

    if (!row) {
      const message = "Could not update this truck."
      console.error("[uploadVendorTruckPhoto] trucks lookup:", message)
      return { status: "error", message }
    }

    const path = buildObjectPath(truckId, file.name || "photo.jpg")
    const bytes = new Uint8Array(await file.arrayBuffer())

    const { error: uploadError } = await supabase.storage.from(TRUCK_PHOTOS_BUCKET).upload(path, bytes, {
      contentType: file.type || "application/octet-stream",
      cacheControl: "3600",
      upsert: false,
    })

    if (uploadError) {
      console.error("[uploadVendorTruckPhoto] storage.upload error:", uploadError)
      return {
        status: "error",
        message: uploadError.message || "Upload failed.",
      }
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
      console.error("[uploadVendorTruckPhoto] trucks.update error:", updateError)
      return {
        status: "error",
        message: updateError.message || "Could not save photo URL.",
      }
    }

    revalidatePath("/dashboard/profile")
    revalidatePath("/trucks")

    return { status: "success", publicUrl }
  } catch (err) {
    console.error("[uploadVendorTruckPhoto] unexpected thrown error:", err)
    const message = serializeUnknown(err)
    console.error("[uploadVendorTruckPhoto] serialized error message:", message)
    return { status: "error", message }
  }
}
