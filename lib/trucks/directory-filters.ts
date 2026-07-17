/**
 * Client-safe filter helpers for the public /trucks directory.
 * Uses existing truck profile fields only — no schema changes.
 */

export type DirectoryFilterTruck = {
  name: string
  cuisine: string | null
  cuisine_types: string[] | null
  description?: string | null
  short_description?: string | null
  full_description?: string | null
  today_specials?: string | null
  tagline?: string | null
  vendor_type?: string | null
  catering?: boolean | null
}

export const CUISINE_FILTER_OPTIONS = [
  { value: "american", label: "American / Comfort Food" },
  { value: "bbq", label: "BBQ" },
  { value: "burgers", label: "Burgers / Sandwiches" },
  { value: "chicken", label: "Chicken / Wings" },
  { value: "tacos", label: "Tacos / Mexican" },
  { value: "latin", label: "Latin American" },
  { value: "caribbean", label: "Jamaican / Caribbean" },
  { value: "soul", label: "Soul Food / Southern" },
  { value: "seafood", label: "Seafood" },
  { value: "asian", label: "Asian" },
  { value: "indian", label: "Indian" },
  { value: "mediterranean", label: "Mediterranean / Middle Eastern" },
  { value: "italian", label: "Italian / Pizza" },
  { value: "african", label: "African" },
  { value: "breakfast", label: "Breakfast / Brunch" },
  { value: "coffee", label: "Coffee / Drinks" },
  { value: "desserts", label: "Desserts / Sweets" },
  { value: "vegan_veg", label: "Vegan / Vegetarian" },
  { value: "healthy", label: "Healthy / Bowls" },
  { value: "other", label: "Other" },
] as const

export type CuisineFilterValue = (typeof CUISINE_FILTER_OPTIONS)[number]["value"]

export type CuisineCategoryValue = Exclude<CuisineFilterValue, "other">

/**
 * Exact vendor-profile / signup cuisine_types labels → filter categories.
 * These are the strings trucks actually store (see dashboard profile CUISINE_OPTIONS).
 */
const KNOWN_CUISINE_TYPE_CATEGORIES: Record<string, CuisineCategoryValue[]> = {
  "mexican / tacos": ["tacos"],
  "bbq / smokehouse": ["bbq"],
  "american / burgers": ["american", "burgers"],
  "asian fusion": ["asian"],
  "southern / soul food": ["soul"],
  "desserts / sweets": ["desserts"],
  pizza: ["italian"],
  seafood: ["seafood"],
  mediterranean: ["mediterranean"],
  "vegetarian / vegan": ["vegan_veg"],
  "indian / curry": ["indian"],
  "latin / colombian": ["latin"],
  caribbean: ["caribbean"],
  "wings / chicken": ["chicken"],
  "sandwiches / wraps": ["burgers"],
  "snow cones / slushies": ["desserts"],
  "juice / smoothies": ["healthy", "coffee"],
  "crepes / waffles": ["desserts", "breakfast"],
}

/** Keyword patterns for free-text cuisine / profile signals. */
const CUISINE_PATTERNS: Record<CuisineCategoryValue, RegExp> = {
  american:
    /\bamerican\b|\bcomfort\s*food\b|\bdiner\b|\bhot\s*dogs?\b|\bmac\s*(?:and|&)\s*cheese\b|\bcomfort\b/,
  bbq: /\bbbq\b|\bbarbecue\b|\bbarbeque\b|\bsmokehouse\b|\bsmoked?\b|\bsmoked\s*meats?\b|\bbrisket\b|\bpulled\s*pork\b|\bribs?\b/,
  burgers:
    /\bburgers?\b|\bsandwiches?\b|\bsubs?\b|\bsmash\b|\bphilly\b|\bcheesesteaks?\b|\bwraps?\b/,
  chicken: /\bchickens?\b|\bwings?\b|\btenders?\b|\bnuggets?\b/,
  tacos:
    /\btacos?\b|\bmexican\b|\bburritos?\b|\bquesadillas?\b|\bnachos?\b|\belote\b|\bbirria\b|\btex[\s-]?mex\b/,
  latin:
    /\blatin(?:o|a)?\b|\blatin\s*american\b|\bcuban\b|\bpuerto\s*rican\b|\bcolombian\b|\bvenezuelan\b|\bperuvian\b|\bbrazilian\b|\bargentin(?:a|ean|ian)?\b|\barepas?\b|\bempanadas?\b|\bpupusas?\b|\bsalvadoran\b|\bdominican\b/,
  caribbean:
    /\bcaribbean\b|\bjamaican\b|\bjamaica\b|\bjerk\b|\btrinidad(?:ian)?\b|\bhaitian\b|\bbajan\b|\bbarbados\b|\bisland\s*(?:cuisine|food|eats|flavou?r)/,
  soul: /\bsoul\s*food\b|\bsoul\b|\bsouthern\b|\bcreole\b|\bcajun\b|\bgumbo\b|\bcollards?\b|\bfried\s*chicken\b/,
  seafood:
    /\bseafood\b|\bfish\b|\bshrimp\b|\bcrab\b|\blobster\b|\boysters?\b|\bcrawfish\b|\bclam\b|\bpoke\b(?!\s*bowl)/,
  asian:
    /\basian\b|\bchinese\b|\bjapanese\b|\bkorean\b|\bthai\b|\bvietnamese\b|\bfilipino\b|\bsushi\b|\bramen\b|\bpho\b|\bteriyaki\b|\bbao\b|\bbubble\s*tea\b|\bpoke\s*bowl\b/,
  indian:
    /\bindian\b|\bcurry\b|\btikka\b|\bnaan\b|\btandoori\b|\bbiryani\b|\bmasala\b|\bdosa\b|\bsamosa\b|\bpakistani\b|\bsouth\s*asian\b/,
  mediterranean:
    /\bmediterranean\b|\bmiddle\s*east(?:ern)?\b|\bfalafel\b|\bgyros?\b|\bshawarma\b|\bhummus\b|\blebanese\b|\bgreek\b|\bturkish\b|\bhalal\b|\bkebab\b|\bpita\b/,
  italian: /\bitalian\b|\bpizza\b|\bpasta\b|\bgelato\b|\bstromboli\b|\bcalzone\b/,
  african:
    /\bafrican\b|\bethiopian\b|\bnigerian\b|\bghanaian\b|\bsenegalese\b|\bwest\s*african\b|\binjera\b|\bjollof\b/,
  breakfast:
    /\bbreakfast\b|\bbrunch\b|\bpancakes?\b|\bwaffles?\b|\bomelets?\b|\bomelettes?\b|\bbiscuits?\b|\beggs?\b/,
  coffee:
    /\bcoffee\b|\bespresso\b|\bcafe\b|\blatte\b|\bcold\s*brew\b|\bbeverages?\b|\bdrinks?\b|\blemonade\b|\bboba\b|\btea\b|\bsmoothies?\b|\bjuice\b|\bslush(?:ie|y)?\b/,
  desserts:
    /\bdesserts?\b|\bsweets?\b|\bice\s*cream\b|\bcookies?\b|\bcupcakes?\b|\bbrownies?\b|\bcrepes?\b|\bsnow\s*cones?\b|\bshaved\s*ice\b|\bdonuts?\b|\bdoughnuts?\b|\bbakery\b|\bpastr(?:y|ies)\b|\bcake\b|\bcandy\b/,
  vegan_veg: /\bvegan\b|\bvegetarian\b|\bplant[\s-]?based\b/,
  healthy:
    /\bhealthy\b|\bbowls?\b|\bsalads?\b|\bacai\b|\bsmoothie\s*bowls?\b|\bgrain\s*bowls?\b|\bpoke\s*bowls?\b|\bsmoothies?\b|\bjuice\b|\bfresh\s*juice\b/,
}

const CATEGORY_VALUES = Object.keys(CUISINE_PATTERNS) as CuisineCategoryValue[]

/**
 * Vendor format options derived from existing `trucks.vendor_type` values only.
 * Signup / seed values: food_truck, food_trailer, cart_tent, truck.
 * Skipped (no reliable distinct values): coffee cart, dessert cart, beverage vendor, catering setup.
 */
export const VENDOR_FORMAT_FILTER_OPTIONS = [
  { value: "food_truck", label: "Food truck" },
  { value: "food_trailer", label: "Food trailer" },
  { value: "cart_tent", label: "Cart / tent / booth" },
] as const

export type VendorFormatFilterValue = (typeof VENDOR_FORMAT_FILTER_OPTIONS)[number]["value"]

const VENDOR_FORMAT_ALIASES: Record<VendorFormatFilterValue, Set<string>> = {
  food_truck: new Set(["truck", "food_truck", "foodtruck", "food-truck"]),
  food_trailer: new Set(["food_trailer", "trailer", "food-trailer", "foodtrailer"]),
  cart_tent: new Set([
    "cart_tent",
    "cart/tent",
    "cart-tent",
    "cart",
    "tent",
    "booth",
    "cart_tent_booth",
  ]),
}

export function normalizeVendorType(raw: string | null | undefined): string {
  return (raw ?? "").trim().toLowerCase().replace(/\s+/g, "_")
}

/** Normalize free text for keyword matching (lowercase, unify separators). */
export function normalizeCuisineText(raw: string): string {
  return raw
    .toLowerCase()
    .replace(/[_]+/g, " ")
    .replace(/[\/|,;&]+/g, " ")
    .replace(/\s+/g, " ")
    .trim()
}

function knownTypeKey(raw: string): string {
  return raw.toLowerCase().replace(/\s+/g, " ").trim()
}

/**
 * Primary cuisine signals: structured cuisine fields.
 * Secondary: short profile copy / menu notes (helps when cuisine fields are sparse).
 * Full long descriptions are included only as a last-resort signal.
 */
export function truckCuisineHaystack(t: DirectoryFilterTruck): string {
  const primary = normalizeCuisineText(
    [t.cuisine, ...(t.cuisine_types ?? [])].filter(Boolean).join(" ")
  )
  const secondary = normalizeCuisineText(
    [t.tagline, t.short_description, t.today_specials].filter(Boolean).join(" ")
  )
  const combined = [primary, secondary].filter(Boolean).join(" ")
  if (combined) return combined

  // Last resort when structured cuisine + short profile fields are empty.
  return normalizeCuisineText(
    [t.description, t.full_description, t.name].filter(Boolean).join(" ")
  )
}

/** Keyword search across name, descriptions, cuisine, and menu/service notes. */
export function truckKeywordHaystack(t: DirectoryFilterTruck): string {
  return normalizeCuisineText(
    [
      t.name,
      t.tagline,
      t.cuisine,
      ...(t.cuisine_types ?? []),
      t.description,
      t.short_description,
      t.full_description,
      t.today_specials,
    ]
      .filter(Boolean)
      .join(" ")
  )
}

export function matchesKeyword(t: DirectoryFilterTruck, query: string): boolean {
  const q = normalizeCuisineText(query)
  if (!q) return true
  return truckKeywordHaystack(t).includes(q)
}

function categoriesFromKnownTypes(types: string[] | null | undefined): Set<CuisineCategoryValue> {
  const out = new Set<CuisineCategoryValue>()
  for (const raw of types ?? []) {
    const mapped = KNOWN_CUISINE_TYPE_CATEGORIES[knownTypeKey(String(raw))]
    if (!mapped) continue
    for (const c of mapped) out.add(c)
  }
  return out
}

function categoriesFromPatterns(haystack: string): Set<CuisineCategoryValue> {
  const out = new Set<CuisineCategoryValue>()
  if (!haystack.trim()) return out
  for (const value of CATEGORY_VALUES) {
    if (CUISINE_PATTERNS[value].test(haystack)) out.add(value)
  }
  return out
}

/**
 * All cuisine categories a truck matches. A truck may match multiple.
 * Empty set means no confident match → belongs under "Other".
 */
export function getMatchingCuisineCategories(t: DirectoryFilterTruck): CuisineCategoryValue[] {
  const fromKnown = categoriesFromKnownTypes(t.cuisine_types)
  const hay = truckCuisineHaystack(t)
  const fromPatterns = categoriesFromPatterns(hay)

  // Also pattern-match raw cuisine string alone (covers free-text `cuisine` field).
  const cuisineOnly = normalizeCuisineText(t.cuisine ?? "")
  const fromCuisineField = categoriesFromPatterns(cuisineOnly)

  const merged = new Set<CuisineCategoryValue>([
    ...fromKnown,
    ...fromPatterns,
    ...fromCuisineField,
  ])
  return CATEGORY_VALUES.filter((c) => merged.has(c))
}

export function matchesCuisineCategory(
  t: DirectoryFilterTruck,
  cuisine: string | null | undefined
): boolean {
  if (!cuisine) return true
  const matched = getMatchingCuisineCategories(t)
  if (cuisine === "other") {
    return matched.length === 0
  }
  return matched.includes(cuisine as CuisineCategoryValue)
}

export function matchesVendorFormat(
  t: DirectoryFilterTruck,
  format: string | null | undefined
): boolean {
  if (!format) return true
  const aliases = VENDOR_FORMAT_ALIASES[format as VendorFormatFilterValue]
  if (!aliases) return true
  const normalized = normalizeVendorType(t.vendor_type)
  // Schema default is truck; treat empty as food truck only when filtering that format.
  if (!normalized) return format === "food_truck"
  return aliases.has(normalized)
}

export function isValidCuisineFilter(value: string | null | undefined): value is CuisineFilterValue {
  return Boolean(value && CUISINE_FILTER_OPTIONS.some((o) => o.value === value))
}

export function isValidVendorFormatFilter(
  value: string | null | undefined
): value is VendorFormatFilterValue {
  return Boolean(value && VENDOR_FORMAT_FILTER_OPTIONS.some((o) => o.value === value))
}
