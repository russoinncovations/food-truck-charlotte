import { NextResponse } from "next/server"
import { revalidatePath } from "next/cache"
import { createAdminSupabaseClient } from "@/lib/supabase/admin"
import { createClient } from "@/lib/supabase/server"
import { verifyAdminKey } from "@/lib/admin/verify-admin-key"
import {
  TRUCK_PHOTOS_BUCKET,
  TRUCK_PHOTO_MAX_BYTES,
  TRUCK_PHOTO_ALLOWED_TYPES,
  buildTruckPhotoObjectPath,
  type TruckPhotoTarget,
} from "@/lib/trucks/truck-photo-upload-shared"

function jsonError(status: number, error: string) {
  return NextResponse.json({ success: false as const, error }, { status })
}

function parsePhotoTarget(raw: string | null): TruckPhotoTarget {
  if (raw === "hero" || raw === "gallery") return raw
  return "listing"
}

async function revalidateTruckPaths(slug: string | null | undefined) {
  revalidatePath("/dashboard/profile")
  revalidatePath("/trucks")
  revalidatePath("/")
  revalidatePath("/admin/vendors")
  if (slug && String(slug).trim()) {
    revalidatePath(`/trucks/${String(slug).trim()}`)
  }
}

type DbClient = ReturnType<typeof createAdminSupabaseClient> | Awaited<ReturnType<typeof createClient>>

type OwnedTruckRow = {
  id: string
  slug: string | null
}

/** Gallery writes bypass RLS only after server-side ownership verification. */
function galleryWriteClient(sessionClient: DbClient): DbClient {
  const admin = createAdminSupabaseClient()
  return admin ?? sessionClient
}

async function verifyVendorOwnsTruck(
  supabase: Awaited<ReturnType<typeof createClient>>,
  truckId: string,
  userEmail: string,
): Promise<{ truck: OwnedTruckRow } | { error: NextResponse }> {
  const { data: row, error: rowError } = await supabase
    .from("trucks")
    .select("id, slug")
    .eq("id", truckId)
    .eq("email", userEmail)
    .maybeSingle()

  if (rowError) {
    console.error("[upload-truck-photo] trucks lookup error:", rowError)
    return { error: jsonError(403, rowError.message || "Could not update this truck.") }
  }
  if (!row) {
    return { error: jsonError(403, "Could not update this truck.") }
  }

  return { truck: { id: String(row.id), slug: (row.slug as string | null) ?? null } }
}

async function uploadToStorage(
  client: DbClient,
  truckId: string,
  file: File,
): Promise<{ publicUrl: string } | { error: string }> {
  const path = buildTruckPhotoObjectPath(truckId, file.name || "photo.jpg")
  const bytes = new Uint8Array(await file.arrayBuffer())
  const { error: uploadError } = await client.storage.from(TRUCK_PHOTOS_BUCKET).upload(path, bytes, {
    contentType: file.type || "application/octet-stream",
    cacheControl: "3600",
    upsert: false,
  })
  if (uploadError) {
    console.error("[upload-truck-photo] storage.upload error:", uploadError)
    return { error: uploadError.message || "Upload failed." }
  }
  const {
    data: { publicUrl },
  } = client.storage.from(TRUCK_PHOTOS_BUCKET).getPublicUrl(path)
  return { publicUrl }
}

async function nextGallerySortOrder(client: DbClient, truckId: string): Promise<number> {
  const { data } = await client
    .from("truck_photos")
    .select("sort_order")
    .eq("truck_id", truckId)
    .order("sort_order", { ascending: false })
    .limit(1)
    .maybeSingle()
  const current = typeof data?.sort_order === "number" ? data.sort_order : -1
  return current + 1
}

async function persistPhotoTarget(
  client: DbClient,
  truckId: string,
  photoTarget: TruckPhotoTarget,
  publicUrl: string,
): Promise<{ galleryPhotoId?: string } | { error: string }> {
  if (photoTarget === "listing") {
    const { error } = await client.from("trucks").update({ photo_url: publicUrl }).eq("id", truckId)
    if (error) {
      console.error("[upload-truck-photo] trucks.update photo_url error:", error)
      return { error: error.message || "Could not save photo URL." }
    }
    return {}
  }

  if (photoTarget === "hero") {
    const { error } = await client.from("trucks").update({ hero_photo_url: publicUrl }).eq("id", truckId)
    if (error) {
      console.error("[upload-truck-photo] trucks.update hero_photo_url error:", error)
      return { error: error.message || "Could not save hero photo URL." }
    }
    return {}
  }

  const sortOrder = await nextGallerySortOrder(client, truckId)
  const { data, error } = await client
    .from("truck_photos")
    .insert({
      truck_id: truckId,
      photo_url: publicUrl,
      sort_order: sortOrder,
      is_hero: false,
    })
    .select("id")
    .maybeSingle()

  if (error || !data?.id) {
    console.error("[upload-truck-photo] truck_photos.insert error:", error)
    return { error: error?.message || "Could not save gallery photo." }
  }

  return { galleryPhotoId: String(data.id) }
}

async function handleDelete(client: DbClient, truckId: string, photoId: string, slug: string | null | undefined) {
  const { data: row, error: lookupError } = await client
    .from("truck_photos")
    .select("id")
    .eq("id", photoId)
    .eq("truck_id", truckId)
    .maybeSingle()

  if (lookupError) {
    console.error("[upload-truck-photo] truck_photos lookup error:", lookupError)
    return jsonError(500, lookupError.message || "Could not remove photo.")
  }
  if (!row) {
    return jsonError(404, "Gallery photo not found.")
  }

  const { error: deleteError } = await client.from("truck_photos").delete().eq("id", photoId).eq("truck_id", truckId)
  if (deleteError) {
    console.error("[upload-truck-photo] truck_photos.delete error:", deleteError)
    return jsonError(500, deleteError.message || "Could not remove photo.")
  }

  await revalidateTruckPaths(slug)
  return NextResponse.json({ success: true as const })
}

export async function POST(request: Request) {
  try {
    const formData = await request.formData()
    const action = ((formData.get("action") as string | null) ?? "upload").trim()
    const truckId = (formData.get("truckId") as string | null)?.trim()
    const adminKeyRaw = ((formData.get("adminKey") as string | null) ?? "").trim()
    const photoTarget = parsePhotoTarget((formData.get("photoTarget") as string | null)?.trim() ?? null)

    if (!truckId) {
      return jsonError(400, "Missing truck.")
    }

    /** Admin path (service role) — upload or delete without vendor session. */
    if (adminKeyRaw) {
      if (!verifyAdminKey(adminKeyRaw)) {
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

      if (action === "delete") {
        const photoId = (formData.get("photoId") as string | null)?.trim()
        if (!photoId) return jsonError(400, "Missing gallery photo.")
        return handleDelete(admin, truckId, photoId, truckRow.slug)
      }

      const file = formData.get("file")
      if (!(file instanceof File) || file.size === 0) {
        return jsonError(400, "Choose an image file.")
      }
      if (!TRUCK_PHOTO_ALLOWED_TYPES.has(file.type)) {
        return jsonError(400, "Use JPG, PNG, or WebP.")
      }
      if (file.size > TRUCK_PHOTO_MAX_BYTES) {
        return jsonError(400, "Image must be 5 MB or smaller.")
      }

      const uploaded = await uploadToStorage(admin, truckId, file)
      if ("error" in uploaded) {
        return jsonError(500, uploaded.error)
      }

      const saved = await persistPhotoTarget(admin, truckId, photoTarget, uploaded.publicUrl)
      if ("error" in saved) {
        return jsonError(500, saved.error)
      }

      await revalidateTruckPaths(truckRow.slug)
      return NextResponse.json({
        success: true as const,
        publicUrl: uploaded.publicUrl,
        galleryPhotoId: saved.galleryPhotoId,
      })
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

    const ownership = await verifyVendorOwnsTruck(supabase, truckId, user.email)
    if ("error" in ownership) {
      return ownership.error
    }
    const { truck: row } = ownership

    const touchesGallery = action === "delete" || photoTarget === "gallery"
    const dbClient: DbClient = touchesGallery ? galleryWriteClient(supabase) : supabase

    if (action === "delete") {
      const photoId = (formData.get("photoId") as string | null)?.trim()
      if (!photoId) return jsonError(400, "Missing gallery photo.")
      return handleDelete(dbClient, truckId, photoId, row.slug)
    }

    const file = formData.get("file")
    if (!(file instanceof File) || file.size === 0) {
      return jsonError(400, "Choose an image file.")
    }
    if (!TRUCK_PHOTO_ALLOWED_TYPES.has(file.type)) {
      return jsonError(400, "Use JPG, PNG, or WebP.")
    }
    if (file.size > TRUCK_PHOTO_MAX_BYTES) {
      return jsonError(400, "Image must be 5 MB or smaller.")
    }

    const uploaded = await uploadToStorage(supabase, truckId, file)
    if ("error" in uploaded) {
      return jsonError(500, uploaded.error)
    }

    const writeClient = photoTarget === "gallery" ? dbClient : supabase
    const saved = await persistPhotoTarget(writeClient, truckId, photoTarget, uploaded.publicUrl)
    if ("error" in saved) {
      return jsonError(500, saved.error)
    }

    await revalidateTruckPaths(row.slug)
    return NextResponse.json({
      success: true as const,
      publicUrl: uploaded.publicUrl,
      galleryPhotoId: saved.galleryPhotoId,
    })
  } catch (err) {
    console.error("[upload-truck-photo] unexpected error:", err)
    const message = err instanceof Error ? err.message : "Upload failed."
    return jsonError(500, message)
  }
}
