import type { TruckScheduledStopRow } from "@/lib/schedule/scheduled-stops"

export type TruckProfilePhoto = {
  id: string
  photo_url: string
  alt_text: string | null
}

export type TruckProfileData = {
  id: string
  name: string
  slug: string
  tagline: string | null
  cuisineTags: string[]
  serviceAreaLabel: string | null
  priceRange: string | null
  aboutText: string | null
  menuHighlights: string[]
  hasMenuData: boolean
  servingToday: boolean
  todayLocation: string | null
  streetAddress: string | null
  website: string | null
  instagram: string | null
  facebook: string | null
  phone: string | null
  heroImageUrl: string
  galleryPhotos: TruckProfilePhoto[]
  upcomingStops: TruckScheduledStopRow[]
  catering: boolean
}

function trimStr(v: unknown): string {
  return typeof v === "string" ? v.trim() : ""
}

export function cuisineTagsFromRow(row: {
  cuisine_types?: string[] | null
  cuisine?: string | string[] | null
}): string[] {
  const fromTypes = Array.isArray(row.cuisine_types)
    ? row.cuisine_types.map((x) => trimStr(x)).filter(Boolean)
    : []
  if (fromTypes.length > 0) return fromTypes

  const raw = row.cuisine
  if (Array.isArray(raw)) {
    return raw.map((c) => trimStr(c)).filter(Boolean)
  }
  const single = trimStr(raw)
  if (!single) return []
  return single
    .split(/[,/&]| and /i)
    .map((s) => s.trim())
    .filter(Boolean)
}

export function serviceAreaLabelFromRow(row: {
  base_city?: string | null
  service_areas?: string | null
}): string | null {
  const city = trimStr(row.base_city)
  if (city) return city.includes("Charlotte") ? city : `${city} · Charlotte area`
  const areas = trimStr(row.service_areas)
  return areas || null
}

export function aboutTextFromRow(row: {
  full_description?: string | null
  short_description?: string | null
  description?: string | null
}): string | null {
  const full = trimStr(row.full_description)
  if (full) return full
  const short = trimStr(row.short_description)
  if (short) return short
  const desc = trimStr(row.description)
  return desc || null
}

/** Parse vendor-entered specials text — never invent items. */
export function parseMenuHighlights(
  todaySpecials: string | null | undefined,
  stopMenuNotes: (string | null | undefined)[]
): string[] {
  const items: string[] = []
  const seen = new Set<string>()

  const add = (raw: string) => {
    const t = raw.trim()
    if (!t) return
    const key = t.toLowerCase()
    if (seen.has(key)) return
    seen.add(key)
    items.push(t)
  }

  const specials = trimStr(todaySpecials)
  if (specials) {
    for (const line of specials.split(/\r?\n/)) {
      const cleaned = line.replace(/^[-•*]\s*/, "").trim()
      if (!cleaned) continue
      if (cleaned.includes(",")) {
        for (const part of cleaned.split(",")) add(part)
      } else {
        add(cleaned)
      }
    }
  }

  for (const note of stopMenuNotes) {
    add(trimStr(note))
  }

  return items.slice(0, 12)
}

export function normalizeWebsiteUrl(url: string): string {
  const trimmed = url.trim()
  if (!trimmed) return trimmed
  if (/^https?:\/\//i.test(trimmed)) return trimmed
  return `https://${trimmed}`
}

export function instagramHref(handle: string): string {
  const t = handle.trim().replace(/^@/, "")
  if (!t) return "#"
  if (/^https?:\/\//i.test(t)) return t
  return `https://instagram.com/${t}`
}

export function facebookHref(handle: string): string {
  const t = handle.trim()
  if (!t) return "#"
  if (/^https?:\/\//i.test(t)) return t
  if (t.startsWith("facebook.com")) return `https://${t}`
  return `https://facebook.com/${t.replace(/^@/, "")}`
}
