"use server"

import { redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"

export type EventPromotionResult = { success: true } | { success: false; error: string }

function emptyToNull(s: string | null | undefined): string | null {
  const t = (s ?? "").trim()
  return t === "" ? null : t
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
  const venue_name = emptyToNull(formData.get("venueName") as string | null)
  const street_address = emptyToNull(formData.get("streetAddress") as string | null)
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

  const supabase = await createClient()
  const { error } = await supabase.from("event_submissions").insert({
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
    status: "pending",
  })

  if (error) {
    return { success: false, error: error.message }
  }

  redirect("/promote-event/success")
}
