import { NextResponse } from "next/server"
import { revalidatePath } from "next/cache"
import { createAdminSupabaseClient } from "@/lib/supabase/admin"
import { createClient } from "@/lib/supabase/server"

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

function jsonError(status: number, error: string) {
  return NextResponse.json({ success: false as const, error }, { status })
}

function expectedAdminKey(): string {
  return process.env.ADMIN_KEY ?? "7985"
}

export async function POST(request: Request) {
  try {
    const formData = await request.formData()
    const truckId = (formData.get("truckId") as string | null)?.trim()
    const file = formData.get("file")
    const adminKeyRaw = ((formData.get("adminKey") as string | null) ?? "").trim()

    if (!truckId) {
      return jsonError(400, "Missing truck.")
    }

    if (!(file instanceof File) || file.size === 0) {
      return jsonError(400, "Choose an image file.")
    }

    if (!ALLOWED_TYPES.has(file.type)) {
      return jsonError(400, "Use JPG, PNG, WebP, or GIF.")
    }

    if (file.size > MAX_BYTES) {
      return jsonError(400, "Image must be 5 MB or smaller.")
    }

    /** Admin replaces hero photo without vendor session (service role). */
    if (adminKeyRaw) {
      if (adminKeyRaw !== expectedAdminKey()) {
        return jsonError(403, "Unauthorized.")
      }
      const admin = createAdminSupabaseClient()
      if (!admin) {
        return jsonError(503, "Admin uploads require SUPABASE_SERVICE_ROLE_KEY.")
      }
      const { data: truckRow, error: truckErr } = await admin
        .from("trucks")
        .select("id, slug")
        .eq("id", truckId)
        .maybeSingle()
      if (truckErr || !truckRow) {
        return jsonError(404, "Truck not found.")
      }

      const path = buildObjectPath(truckId, file.name || "photo.jpg")
      const bytes = new Uint8Array(await file.arrayBuffer())
      const { error: uploadError } = await admin.storage.from(TRUCK_PHOTOS_BUCKET).upload(path, bytes, {
        contentType: file.type || "application/octet-stream",
        cacheControl: "3600",
        upsert: false,
      })
      if (uploadError) {
        console.error("[upload-truck-photo] admin storage.upload error:", uploadError)
        return jsonError(500, uploadError.message || "Upload failed.")
      }
      const {
        data: { publicUrl },
      } = admin.storage.from(TRUCK_PHOTOS_BUCKET).getPublicUrl(path)
      const { error: updateError } = await admin.from("trucks").update({ photo_url: publicUrl }).eq("id", truckId)
      if (updateError) {
        console.error("[upload-truck-photo] admin trucks.update error:", updateError)
        return jsonError(500, updateError.message || "Could not save photo URL.")
      }
      revalidatePath("/trucks")
      revalidatePath("/")
      revalidatePath("/admin/vendors")
      if (truckRow.slug && String(truckRow.slug).trim()) {
        revalidatePath(`/trucks/${String(truckRow.slug).trim()}`)
      }
      return NextResponse.json({ success: true as const, publicUrl })
    }

    const supabase = await createClient()
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError) {
      console.error("[upload-truck-photo] auth.getUser error:", authError)
      return jsonError(401, authError.message || "Authentication failed.")
    }

    if (!user?.email) {
      return jsonError(401, "You must be signed in.")
    }

    const { data: row, error: rowError } = await supabase
      .from("trucks")
      .select("id")
      .eq("id", truckId)
      .eq("email", user.email)
      .maybeSingle()

    if (rowError) {
      console.error("[upload-truck-photo] trucks lookup error:", rowError)
      return jsonError(403, rowError.message || "Could not update this truck.")
    }

    if (!row) {
      return jsonError(403, "Could not update this truck.")
    }

    const path = buildObjectPath(truckId, file.name || "photo.jpg")
    const bytes = new Uint8Array(await file.arrayBuffer())

    const { error: uploadError } = await supabase.storage.from(TRUCK_PHOTOS_BUCKET).upload(path, bytes, {
      contentType: file.type || "application/octet-stream",
      cacheControl: "3600",
      upsert: false,
    })

    if (uploadError) {
      console.error("[upload-truck-photo] storage.upload error:", uploadError)
      return jsonError(500, uploadError.message || "Upload failed.")
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
      console.error("[upload-truck-photo] trucks.update error:", updateError)
      return jsonError(500, updateError.message || "Could not save photo URL.")
    }

    revalidatePath("/dashboard/profile")
    revalidatePath("/trucks")

    return NextResponse.json({ success: true as const, publicUrl })
  } catch (err) {
    console.error("[upload-truck-photo] unexpected error:", err)
    const message = err instanceof Error ? err.message : "Upload failed."
    return jsonError(500, message)
  }
}
