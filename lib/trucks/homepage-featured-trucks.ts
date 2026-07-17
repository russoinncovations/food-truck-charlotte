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

/**
 * Curated homepage featured set — balanced cuisine mix with real photography.
 * Order is display order. Missing/unlisted slugs are skipped and filled by balanced fallback.
 *
 * Mix target:
 * 1 Latin/Mexican · 2 BBQ · 3 Burgers/comfort · 4 Wings/chicken · 5 International · 6 Dessert
 */
export const HOMEPAGE_FEATURED_TRUCK_SLUGS = [
  "moyas-kitchen-authentic-mexican-food", // Mexican / Tacos
  "ernies-smokehouse-a3170489", // BBQ
  "goudas-kitchen-on-the-go", // Burgers / comfort
  "cchilloutt", // Wings / chicken / cookout
  "kabuto-on-wheels", // Asian / Indian
  "sprinkles-dessert-truck", // Desserts (one only)
] as const

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

function hasRealPhoto(row: HomepageFeaturedTruckRow): boolean {
  return Boolean(pickTruckPhotoUrlForDisplay(row.photo_url, row.hero_photo_url))
}

/** Completeness score for ranking only. Prefers real photography. */
export function featuredTruckCompletenessScore(row: TruckScoreRow): number {
  let score = 0
  if (hasRealPhoto(row)) score += 3
  if (hasAboutText(row)) score += 1
  if (hasCuisine(row)) score += 1
  if (hasWebsiteOrInstagram(row)) score += 1
  if (hasPhoneOrEmail(row)) score += 1
  if (hasSpecialsOrOfferings(row)) score += 1
  if (row.catering) score += 1
  if (row.serving_today) score += 1
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

function cuisineHaystack(row: HomepageFeaturedTruckRow): string {
  const types = Array.isArray(row.cuisine_types) ? row.cuisine_types.join(" ") : ""
  const c = Array.isArray(row.cuisine) ? row.cuisine.join(" ") : (row.cuisine ?? "")
  return `${row.name ?? ""} ${c} ${types}`.toLowerCase()
}

const CUISINE_DIVERSITY_BUCKETS: { id: string; match: RegExp }[] = [
  {
    id: "latin",
    match: /taco|mexican|latin|burrito|quesadilla|colombian|cuban|tex-mex|pupusa|arepa/,
  },
  {
    id: "bbq",
    match: /bbq|barbecue|barbeque|smokehouse|brisket|pulled\s*pork|smoke\s*house/,
  },
  {
    id: "burgers",
    match: /burger|sandwich|smash|cheesesteak|american\s*\/\s*burgers|hot\s*dog/,
  },
  {
    id: "wings",
    match: /wing|chicken|comfort|soul|southern|cookout|fried/,
  },
  {
    id: "international",
    match:
      /asian|indian|mediterranean|italian(?!\s*ice)|pizza|caribbean|jamaican|thai|chinese|korean|greek|halal|vietnamese|filipino|japanese|ethiopian|fusion/,
  },
  {
    id: "dessert_drinks",
    match:
      /dessert|sweet|cookie|donut|doughnut|italian\s*ice|ice\s*cream|bakery|coffee|juice|smoothie|crepe|slush|snow\s*cone|gelato|candy|treat/,
  },
]

function isDessertBucketTruck(row: HomepageFeaturedTruckRow): boolean {
  const dessert = CUISINE_DIVERSITY_BUCKETS.find((b) => b.id === "dessert_drinks")
  return Boolean(dessert?.match.test(cuisineHaystack(row)))
}

function toFeaturedRow(r: TruckScoreRow): HomepageFeaturedTruckRow {
  return {
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
  }
}

/**
 * Pick up to `limit` trucks with cuisine variety (max one dessert).
 * Prefers photographed trucks. Used only to fill gaps when curated slugs are missing.
 */
export function selectBalancedFeaturedTrucks(
  ranked: HomepageFeaturedTruckRow[],
  limit = 6
): HomepageFeaturedTruckRow[] {
  if (ranked.length <= limit) return ranked.slice(0, limit)

  const photographed = ranked.filter(hasRealPhoto)
  const pool = photographed.length >= limit ? photographed : ranked

  const picked: HomepageFeaturedTruckRow[] = []
  const used = new Set<string>()
  let dessertCount = 0

  for (const bucket of CUISINE_DIVERSITY_BUCKETS) {
    if (picked.length >= limit) break
    if (bucket.id === "dessert_drinks" && dessertCount >= 1) continue
    const hit = pool.find((t) => !used.has(t.id) && bucket.match.test(cuisineHaystack(t)))
    if (hit) {
      picked.push(hit)
      used.add(hit.id)
      if (bucket.id === "dessert_drinks" || isDessertBucketTruck(hit)) dessertCount += 1
    }
  }

  for (const t of pool) {
    if (picked.length >= limit) break
    if (used.has(t.id)) continue
    if (isDessertBucketTruck(t) && dessertCount >= 1) continue
    picked.push(t)
    used.add(t.id)
    if (isDessertBucketTruck(t)) dessertCount += 1
  }

  return picked
}

const FETCH_CAP = 1000

/**
 * Homepage featured trucks: curated slug list first, balanced fallback for gaps.
 * Does not alter truck profile data.
 */
export async function fetchHomepageFeaturedTrucks(
  supabase: SupabaseClient,
  limit = 6
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
  const eligible = rows.filter((r) => !isExcludedFeaturedName(r.name))
  const bySlug = new Map(eligible.map((r) => [r.slug, r]))

  const curated: HomepageFeaturedTruckRow[] = []
  const usedIds = new Set<string>()

  for (const slug of HOMEPAGE_FEATURED_TRUCK_SLUGS) {
    if (curated.length >= limit) break
    const row = bySlug.get(slug)
    if (!row) continue
    curated.push(toFeaturedRow(row))
    usedIds.add(row.id)
  }

  if (curated.length >= limit) {
    return curated.slice(0, limit)
  }

  const remaining = eligible
    .filter((r) => !usedIds.has(r.id))
    .sort(compareFeaturedTrucks)
    .map(toFeaturedRow)

  const fillers = selectBalancedFeaturedTrucks(remaining, limit - curated.length)
  return [...curated, ...fillers].slice(0, limit)
}
