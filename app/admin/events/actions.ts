"use server"

import { revalidatePath } from "next/cache"
import { createAdminSupabaseClient } from "@/lib/supabase/admin"

function expectedAdminKey(): string {
  return process.env.ADMIN_KEY ?? "7985"
}

function verifyAdminKey(raw: string | null | undefined): boolean {
  const k = (raw ?? "").trim()
  return k === expectedAdminKey()
}

function slugFromTitle(title: string): string {
  const base = title
    .toLowerCase()
    .trim()
    .replace(/\s+/g, "-")
    .replace(/[^a-z0-9-]/g, "")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "")
  return base || `event-${Date.now()}`
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
    listingRaw === "draft" || listingRaw === "rejected" || listingRaw === "approved"
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
  const baseSlug = slugFromTitle(title)
  let slug = baseSlug
  for (let i = 0; i < 5; i++) {
    const { data: existing } = await admin.from("events").select("id").eq("slug", slug).maybeSingle()
    if (!existing) break
    slug = `${baseSlug}-${Math.random().toString(36).slice(2, 8)}`
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
  }

  const { error } = await admin.from("events").insert(row as never)

  if (error) {
    return { success: false, error: error.message }
  }

  revalidatePath("/events")
  revalidatePath("/admin/events")
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
  await admin
    .from("events")
    .update({ active: true, listing_status: "approved" as const })
    .eq("id", id)
  revalidatePath("/admin/events")
  revalidatePath("/events")
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
}
