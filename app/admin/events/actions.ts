"use server"

import { revalidatePath } from "next/cache"
import { createAdminSupabaseClient } from "@/lib/supabase/admin"
import { buildGeocodableLineFromParts } from "@/lib/events/event-address"
import { coordsAreValidForMap, geocodeEventAddressForStorage } from "@/lib/events/event-geocode"
import { nextUniqueEventSlug } from "@/lib/events/slug"

function expectedAdminKey(): string {
  return process.env.ADMIN_KEY ?? "7985"
}

function verifyAdminKey(raw: string | null | undefined): boolean {
  const k = (raw ?? "").trim()
  return k === expectedAdminKey()
}

export type QuickAddEventResult = { success: true } | { success: false; error: string }

export async function submitQuickAddEvent(_prev: QuickAddEventResult | null, formData: FormData): Promise<QuickAddEventResult> {
  if (!verifyAdminKey(formData.get("adminKey") as string | null)) {
    return { success: false, error: "Unauthorized." }
  }

  const admin = createAdminSupabaseClient()
  if (!admin) {
    return {
      success: false,
      error:
        "Server is not configured for admin writes. Set SUPABASE_SERVICE_ROLE_KEY on the server.",
    }
  }

  const title = ((formData.get("title") as string) ?? "").trim()
  const date = ((formData.get("date") as string) ?? "").trim()
  const start_time = ((formData.get("start_time") as string) ?? "").trim() || null
  const end_time = ((formData.get("end_time") as string) ?? "").trim() || null
  const location_name = ((formData.get("location_name") as string) ?? "").trim() || null
  const address = ((formData.get("address") as string) ?? "").trim() || null
  const description = ((formData.get("description") as string) ?? "").trim() || null
  const participating_trucks = ((formData.get("participating_trucks") as string) ?? "").trim() || null
  const isPublicRaw = (formData.get("is_public") as string) ?? "true"
  const is_public = isPublicRaw !== "false"
  const event_website_url = ((formData.get("event_website_url") as string) ?? "").trim() || null
  const facebook_post_url = ((formData.get("facebook_post_url") as string) ?? "").trim() || null
  const graphicUrl = ((formData.get("graphic_url") as string) ?? "").trim() || null
  const organizer_name = ((formData.get("organizer_name") as string) ?? "").trim() || null
  const organizer_email = ((formData.get("organizer_email") as string) ?? "").trim() || null
  const organizer_phone = ((formData.get("organizer_phone") as string) ?? "").trim() || null
  const sourcePaste = ((formData.get("sourcePaste") as string) ?? "").trim() || null
  const listingRaw = ((formData.get("listing_status") as string) ?? "approved").trim()
  const listingStatus =
    listingRaw === "draft" ||
    listingRaw === "rejected" ||
    listingRaw === "approved" ||
    listingRaw === "pending"
      ? listingRaw
      : "approved"

  if (!title || !date) {
    return { success: false, error: "Event name and date are required." }
  }

  for (const u of [event_website_url, facebook_post_url, graphicUrl]) {
    if (!u) continue
    try {
      const url = new URL(u)
      if (url.protocol !== "http:" && url.protocol !== "https:") {
        return { success: false, error: "Please use http(s) URLs for links, or leave them blank." }
      }
    } catch {
      return { success: false, error: "Please enter valid URLs, or leave optional link fields blank." }
    }
  }

  if (organizer_email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(organizer_email)) {
    return { success: false, error: "Organizer email is not valid." }
  }

  const active = listingStatus === "approved"
  const slug = await nextUniqueEventSlug(admin, title)

  const geoLine = buildGeocodableLineFromParts({
    address,
    location_name,
    address_line1: null,
    city: null,
    state: null,
    zip: null,
  })
  let latitude: number | null = null
  let longitude: number | null = null
  if (geoLine) {
    const c = await geocodeEventAddressForStorage(geoLine)
    if (c) {
      latitude = c.lat
      longitude = c.lng
    } else {
      console.warn("[admin] Quick Add: geocode failed for line:", geoLine)
    }
  }

  const row = {
    title,
    date,
    start_time,
    end_time,
    location_name,
    address,
    description,
    participating_trucks,
    is_public,
    event_website_url,
    facebook_post_url,
    graphic_url: null as string | null,
    image_url: graphicUrl,
    featured_image_url: graphicUrl,
    organizer_name,
    organizer_email,
    organizer_phone,
    admin_source_paste: sourcePaste,
    listing_status: listingStatus,
    active,
    submitted_by_truck_id: null,
    slug,
    latitude,
    longitude,
  }

  const { error } = await admin.from("events").insert(row as never)

  if (error) {
    return { success: false, error: error.message }
  }

  revalidatePath("/events")
  revalidatePath("/admin/events")
  revalidatePath("/")
  revalidatePath("/map")
  return { success: true }
}

export async function approveEventById(formData: FormData) {
  "use server"
  const id = (formData.get("id") as string | null) ?? ""
  if (!id || !verifyAdminKey(formData.get("adminKey") as string | null)) {
    return
  }
  const admin = createAdminSupabaseClient()
  if (!admin) return

  const { data: ev } = await admin
    .from("events")
    .select("id, address, location_name, address_line1, city, state, zip, latitude, longitude")
    .eq("id", id)
    .maybeSingle()

  if (ev) {
    const row = ev as Record<string, unknown>
    const line = buildGeocodableLineFromParts({
      address: (row.address as string) ?? null,
      location_name: (row.location_name as string) ?? null,
      address_line1: (row.address_line1 as string) ?? null,
      city: (row.city as string) ?? null,
      state: (row.state as string) ?? null,
      zip: (row.zip as string) ?? null,
    })
    const hasValidPin = coordsAreValidForMap(row.latitude, row.longitude)
    if (!hasValidPin && line) {
      const c = await geocodeEventAddressForStorage(line)
      if (c) {
        await admin.from("events").update({ latitude: c.lat, longitude: c.lng }).eq("id", id)
      } else {
        console.warn(
          "[admin] approve: could not geocode event; lat/lng left unset (approval not blocked). id=",
          id
        )
      }
    }
  }

  await admin
    .from("events")
    .update({ active: true, listing_status: "approved" as const })
    .eq("id", id)
  revalidatePath("/admin/events")
  revalidatePath("/events")
  revalidatePath("/")
  revalidatePath("/map")
}

export async function rejectEventById(formData: FormData) {
  "use server"
  const id = (formData.get("id") as string | null) ?? ""
  if (!id || !verifyAdminKey(formData.get("adminKey") as string | null)) {
    return
  }
  const admin = createAdminSupabaseClient()
  if (!admin) return
  await admin
    .from("events")
    .update({ active: false, listing_status: "rejected" as const })
    .eq("id", id)
  revalidatePath("/admin/events")
  revalidatePath("/events")
  revalidatePath("/")
  revalidatePath("/map")
}
