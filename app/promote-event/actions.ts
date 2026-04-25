"use server"

import { redirect } from "next/navigation"
import { buildGeocodableLineFromPromote } from "@/lib/events/event-address"
import { nextUniqueEventSlug } from "@/lib/events/slug"
import { geocodeWithGoogleServer } from "@/lib/location/google-geocoding"

export type EventPromotionResult = { success: true } | { success: false; error: string }

function emptyToNull(s: string | null | undefined): string | null {
  const t = (s ?? "").trim()
  return t === "" ? null : t
}

/** Prefer first matching key so the action stays aligned with the form. */
function readFirstFormString(formData: FormData, keys: string[]): string | null {
  for (const k of keys) {
    const v = emptyToNull(formData.get(k) as string | null)
    if (v) return v
  }
  return null
}

/** Normalize time from HTML <input type="time"> to timestamptz-friendly string or null. */
function normalizeTime(s: string | null | undefined): string | null {
  const t = (s ?? "").trim()
  if (!t) return null
  if (t.length === 5 && t[2] === ":") return `${t}:00`
  return t
}

function isPlausibleUrl(s: string | null | undefined): boolean {
  const t = (s ?? "").trim()
  if (!t) return true
  try {
    const u = new URL(t)
    return u.protocol === "http:" || u.protocol === "https:"
  } catch {
    return false
  }
}

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

export async function submitEventPromotion(
  _prev: EventPromotionResult | null,
  formData: FormData
): Promise<EventPromotionResult> {
  const event_name = ((formData.get("eventName") as string) ?? "").trim()
  const event_date = ((formData.get("eventDate") as string) ?? "").trim()
  const start_time = normalizeTime(formData.get("startTime") as string | null)
  const end_time = normalizeTime(formData.get("endTime") as string | null)
  const venue_name = readFirstFormString(formData, [
    "venueName",
    "venue_name",
    "locationName",
    "location_name",
  ])
  const street_address = readFirstFormString(formData, [
    "streetAddress",
    "street_address",
    "address",
    "streetAddressField",
    "street",
  ])
  const description = emptyToNull(formData.get("description") as string | null)
  const participating_trucks = emptyToNull(formData.get("participatingTrucks") as string | null)
  const is_public_raw = (formData.get("isPublic") as string) ?? "true"
  const is_public = is_public_raw !== "false"
  const event_url = emptyToNull(formData.get("eventUrl") as string | null)
  const graphic_url = emptyToNull(formData.get("graphicUrl") as string | null)
  const organizer_name = ((formData.get("organizerName") as string) ?? "").trim()
  const organizer_email = ((formData.get("organizerEmail") as string) ?? "").trim()
  const organizer_phone = emptyToNull(formData.get("organizerPhone") as string | null)

  if (!event_name) {
    return { success: false, error: "Event name is required." }
  }
  if (!event_date) {
    return { success: false, error: "Event date is required." }
  }
  if (!organizer_name || !organizer_email) {
    return { success: false, error: "Organizer name and email are required." }
  }
  if (!EMAIL_RE.test(organizer_email)) {
    return { success: false, error: "Please enter a valid organizer email address." }
  }
  if (!isPlausibleUrl(event_url) || !isPlausibleUrl(graphic_url)) {
    return { success: false, error: "Please enter valid http(s) URLs for website, ticket, or graphic links, or leave them blank." }
  }

  console.log("[promote-event] submitted venue name:", venue_name)
  console.log("[promote-event] submitted street address (raw):", street_address)

  const geocodeLine = buildGeocodableLineFromPromote({
    streetAddress: street_address,
    venueName: venue_name,
  })
  console.log("[promote-event] final geocode query:", geocodeLine)

  let lat: number | null = null
  let lng: number | null = null

  if (geocodeLine) {
    const outcome = await geocodeWithGoogleServer(geocodeLine)
    console.log("[promote-event] Google geocode status:", outcome.status, outcome)
    if (outcome.ok) {
      lat = outcome.latitude
      lng = outcome.longitude
      console.log("[promote-event] returned lat/lng:", lat, lng)
      console.log("[promote-event] formatted_address:", outcome.formatted_address, "place_id:", outcome.place_id)
    } else {
      console.warn(
        "Event submitted but geocoding failed; latitude/longitude not saved.",
        { query: geocodeLine, googleStatus: outcome.status, message: outcome.message }
      )
    }
  } else {
    console.log("[promote-event] no geocodable line (no street/venue to combine)")
  }

  const submissionInsert = {
    event_name,
    event_date,
    start_time,
    end_time,
    venue_name,
    street_address,
    description,
    participating_trucks,
    is_public,
    event_url,
    graphic_url,
    organizer_name,
    organizer_email,
    organizer_phone,
    status: "pending" as const,
    latitude: lat,
    longitude: lng,
  }
  console.log(
    "[promote-event] Supabase event_submissions insert payload latitude/longitude:",
    submissionInsert.latitude,
    submissionInsert.longitude
  )

  const { createAdminSupabaseClient } = await import("@/lib/supabase/admin")
  const admin = createAdminSupabaseClient()
  if (!admin) {
    console.error(
      "[promote-event] SUPABASE_SERVICE_ROLE_KEY or NEXT_PUBLIC_SUPABASE_URL is missing; cannot insert past RLS."
    )
    return {
      success: false,
      error:
        "Event submission is temporarily unavailable. Please try again later or contact the site owner.",
    }
  }

  const { data: sub, error } = await admin
    .from("event_submissions")
    .insert(submissionInsert)
    .select("id")
    .single()

  if (error) {
    console.error("[promote-event] event_submissions insert error:", error)
    return { success: false, error: error.message }
  }
  console.log("[promote-event] event_submissions insert ok, id:", sub?.id)

  if (sub?.id) {
    const slug = await nextUniqueEventSlug(admin, event_name)
    const eventsInsert = {
      title: event_name,
      date: event_date,
      start_time,
      end_time,
      location_name: venue_name,
      address: street_address,
      description,
      participating_trucks,
      is_public,
      event_website_url: event_url,
      image_url: graphic_url,
      featured_image_url: graphic_url,
      organizer_name,
      organizer_email,
      organizer_phone,
      listing_status: "pending" as const,
      active: false,
      submitted_by_truck_id: null,
      slug,
      latitude: lat,
      longitude: lng,
      source_submission_id: sub.id,
    }
    console.log(
      "[promote-event] public.events insert payload latitude/longitude:",
      eventsInsert.latitude,
      eventsInsert.longitude
    )
    const { error: evErr } = await admin.from("events").insert(eventsInsert as never)
    if (evErr) {
      console.error("[promote-event] public.events insert error:", evErr)
      console.error("[promote-event] Could not create pending `events` row (submission still saved):", evErr.message)
    }
  }

  redirect("/promote-event/success")
}
