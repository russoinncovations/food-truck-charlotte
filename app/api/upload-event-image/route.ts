import { NextResponse } from "next/server"
import { revalidatePath } from "next/cache"
import { createAdminSupabaseClient } from "@/lib/supabase/admin"
import { createClient } from "@/lib/supabase/server"
import {
  EVENT_IMAGES_BUCKET,
  buildEventImageObjectPath,
  validateEventImageFileMeta,
} from "@/lib/storage/event-images"

function expectedAdminKey(): string {
  return process.env.ADMIN_KEY ?? "7985"
}

function jsonError(status: number, error: string) {
  return NextResponse.json({ success: false as const, error }, { status })
}

export async function POST(request: Request) {
  try {
    const formData = await request.formData()
    const file = formData.get("file")
    const adminKeyRaw = ((formData.get("adminKey") as string | null) ?? "").trim()
    const truckIdRaw = ((formData.get("truckId") as string | null) ?? "").trim()
    const eventIdRaw = ((formData.get("eventId") as string | null) ?? "").trim()

    if (!(file instanceof File)) {
      return jsonError(400, "Choose an image file.")
    }

    const metaErr = validateEventImageFileMeta(file.type || "", file.size)
    if (metaErr) {
      return jsonError(400, metaErr)
    }

    const admin = createAdminSupabaseClient()
    if (!admin) {
      return jsonError(
        503,
        "Uploads are temporarily unavailable. If this continues, contact support.",
      )
    }

    let pathPrefix: string
    let adminEventIdForUpdate: string | null = null

    if (adminKeyRaw) {
      if (adminKeyRaw !== expectedAdminKey()) {
        return jsonError(403, "Unauthorized.")
      }
      if (eventIdRaw) {
        const { data: evRow, error: evErr } = await admin
          .from("events")
          .select("id")
          .eq("id", eventIdRaw.trim())
          .maybeSingle()
        if (evErr || !evRow) {
          return jsonError(404, "Event not found.")
        }
        pathPrefix = `admin/events/${evRow.id}`
        adminEventIdForUpdate = evRow.id
      } else {
        pathPrefix = "admin"
      }
    } else if (truckIdRaw) {
      const supabase = await createClient()
      const {
        data: { user },
        error: authError,
      } = await supabase.auth.getUser()
      if (authError || !user?.email) {
        return jsonError(401, "You must be signed in to upload for this truck.")
      }
      const { data: row, error: rowError } = await supabase
        .from("trucks")
        .select("id")
        .eq("id", truckIdRaw)
        .eq("email", user.email)
        .maybeSingle()
      if (rowError || !row) {
        return jsonError(403, "Could not upload for this account.")
      }
      pathPrefix = `vendor/${truckIdRaw}`
    } else {
      pathPrefix = "promote"
    }

    const objectPath = buildEventImageObjectPath(pathPrefix, file.type)
    const bytes = new Uint8Array(await file.arrayBuffer())

    const { error: uploadError } = await admin.storage
      .from(EVENT_IMAGES_BUCKET)
      .upload(objectPath, bytes, {
        contentType: file.type || "application/octet-stream",
        cacheControl: "3600",
        upsert: false,
      })

    if (uploadError) {
      console.error("[upload-event-image] storage.upload error:", uploadError)
      const msg = uploadError.message.includes("Bucket not found")
        ? "Storage is not configured for event images yet. Please contact the site owner."
        : uploadError.message || "Upload failed."
      return jsonError(500, msg)
    }

    const {
      data: { publicUrl },
    } = admin.storage.from(EVENT_IMAGES_BUCKET).getPublicUrl(objectPath)

    if (adminEventIdForUpdate) {
      const { error: updateErr } = await admin
        .from("events")
        .update({ image_url: publicUrl, featured_image_url: publicUrl })
        .eq("id", adminEventIdForUpdate)
      if (updateErr) {
        console.error("[upload-event-image] admin events.update error:", updateErr)
        return jsonError(500, updateErr.message || "File uploaded but event row was not updated.")
      }
      revalidatePath("/events")
      revalidatePath("/")
      revalidatePath("/admin/events")
      const { data: slugRow } = await admin
        .from("events")
        .select("slug")
        .eq("id", adminEventIdForUpdate)
        .maybeSingle()
      const s = slugRow?.slug != null ? String(slugRow.slug).trim() : ""
      if (s) {
        revalidatePath(`/events/${s}`)
      }
    }

    return NextResponse.json({ success: true as const, publicUrl })
  } catch (err) {
    console.error("[upload-event-image] unexpected error:", err)
    const message = err instanceof Error ? err.message : "Upload failed."
    return jsonError(500, message)
  }
}
