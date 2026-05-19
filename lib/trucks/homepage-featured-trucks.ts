import type { SupabaseClient } from "@supabase/supabase-js"
import { PUBLIC_LISTED_TRUCK_EQ } from "@/lib/trucks/public-listed-truck-query"
import { pickTruckPhotoUrlForDisplay } from "@/lib/trucks/truck-display-image"

/** Row shape for homepage featured cards (public-listed trucks only). */
export type HomepageFeaturedTruckRow = {
  id: string
  name: string
  slug: string
  cuisine: string | string[] | null
  cuisine_types: string[] | null
  serving_today: boolean | null
  today_location: string | null
  photo_url: string | null
  hero_photo_url: string | null
  catering: boolean | null
  updated_at: string | null
}

const FEATURED_SELECT =
  "id, name, slug, cuisine, cuisine_types, serving_today, today_location, photo_url, hero_photo_url, catering, updated_at, description, short_description, full_description, website, instagram, phone, email, booking_phone, booking_email, today_specials"

type TruckScoreRow = HomepageFeaturedTruckRow & {
  description: string | null
  short_description: string | null
  full_description: string | null
  website: string | null
  instagram: string | null
  phone: string | null
  email: string | null
  booking_phone: string | null
  booking_email: string | null
  today_specials: string | null
}

/** Exclude internal/demo-style listings without knocking out names like “Contesto”. */
function isExcludedFeaturedName(name: string | null | undefined): boolean {
  return /\b(test|demo)\b/i.test(String(name ?? ""))
}

function meaningfullyFilledText(s: string | null | undefined, minLen: number): boolean {
  const t = String(s ?? "").trim()
  return t.length >= minLen
}

function hasAboutText(row: TruckScoreRow): boolean {
  return (
    meaningfullyFilledText(row.short_description, 18) ||
    meaningfullyFilledText(row.description, 18) ||
    meaningfullyFilledText(row.full_description, 24)
  )
}

function hasCuisine(row: TruckScoreRow): boolean {
  const types = row.cuisine_types
  if (Array.isArray(types) && types.some((x) => String(x ?? "").trim().length > 0)) {
    return true
  }
  return meaningfullyFilledText(typeof row.cuisine === "string" ? row.cuisine : null, 2)
}

function hasWebsiteOrInstagram(row: TruckScoreRow): boolean {
  return meaningfullyFilledText(row.website, 4) || meaningfullyFilledText(row.instagram, 2)
}

function hasPhoneOrEmail(row: TruckScoreRow): boolean {
  return (
    meaningfullyFilledText(row.phone, 7) ||
    meaningfullyFilledText(row.email, 5) ||
    meaningfullyFilledText(row.booking_phone, 7) ||
    meaningfullyFilledText(row.booking_email, 5)
  )
}

function hasSpecialsOrOfferings(row: TruckScoreRow): boolean {
  return meaningfullyFilledText(row.today_specials, 3)
}

/** Completeness score for ranking only (criteria 1–3 applied in SQL). Max 6 points from criteria 4–9. */
export function featuredTruckCompletenessScore(row: TruckScoreRow): number {
  let score = 0
  if (pickTruckPhotoUrlForDisplay(row.photo_url, row.hero_photo_url)) score += 1
  if (hasAboutText(row)) score += 1
  if (hasCuisine(row)) score += 1
  if (hasWebsiteOrInstagram(row)) score += 1
  if (hasPhoneOrEmail(row)) score += 1
  if (hasSpecialsOrOfferings(row)) score += 1
  return score
}

function compareFeaturedTrucks(a: TruckScoreRow, b: TruckScoreRow): number {
  const sa = featuredTruckCompletenessScore(a)
  const sb = featuredTruckCompletenessScore(b)
  if (sa !== sb) return sb - sa
  const ta = a.updated_at ? new Date(a.updated_at).getTime() : 0
  const tb = b.updated_at ? new Date(b.updated_at).getTime() : 0
  if (ta !== tb) return tb - ta
  return String(a.name ?? "").localeCompare(String(b.name ?? ""), undefined, {
    sensitivity: "base",
  })
}

const FETCH_CAP = 1000

/**
 * Top N public-listed trucks for the homepage grid, ranked by profile completeness.
 */
export async function fetchHomepageFeaturedTrucks(
  supabase: SupabaseClient,
  limit = 4
): Promise<HomepageFeaturedTruckRow[]> {
  const { data, error } = await supabase
    .from("trucks")
    .select(FEATURED_SELECT)
    .eq("show_in_directory", PUBLIC_LISTED_TRUCK_EQ.show_in_directory)
    .eq("status", PUBLIC_LISTED_TRUCK_EQ.status)
    .eq("is_active", PUBLIC_LISTED_TRUCK_EQ.is_active)
    .order("name", { ascending: true })
    .limit(FETCH_CAP)

  if (error) {
    console.error("[homepage-featured-trucks]", error.message)
    return []
  }

  const rows = (data ?? []) as TruckScoreRow[]
  const eligible = rows.filter((r) => !isExcludedFeaturedName(r.name)).sort(compareFeaturedTrucks)

  return eligible.slice(0, limit).map((r) => ({
    id: r.id,
    name: r.name,
    slug: r.slug,
    cuisine: r.cuisine,
    cuisine_types: r.cuisine_types,
    serving_today: r.serving_today,
    today_location: r.today_location,
    photo_url: r.photo_url,
    hero_photo_url: r.hero_photo_url,
    catering: r.catering,
    updated_at: r.updated_at,
  }))
}
