/**
 * Client-safe filter helpers for the public /trucks directory.
 * Uses existing truck profile fields only — no schema changes.
 *
 * Cuisine matching priority:
 * 1. High — cuisine_types labels + cuisine field
 * 2. Medium — tagline / short_description / today_specials (only if structured is empty/unhelpful)
 * 3. Low — description / full_description / name (only if structured + medium are empty)
 *
 * Browse filters are intentionally broad — a truck may match multiple.
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

/** Simplified host-facing cuisine filters for /trucks. */
export const CUISINE_FILTER_OPTIONS = [
  { value: "american", label: "American / Comfort" },
  { value: "bbq", label: "BBQ" },
  { value: "mexican_latin", label: "Mexican / Latin" },
  { value: "caribbean", label: "Caribbean / Jamaican" },
  { value: "asian_indian", label: "Asian / Indian" },
  { value: "mediterranean", label: "Mediterranean / Middle Eastern" },
  { value: "italian", label: "Pizza / Italian" },
  { value: "soul", label: "Southern / Soul Food" },
  { value: "seafood", label: "Seafood" },
  { value: "breakfast", label: "Breakfast / Brunch" },
  { value: "coffee", label: "Coffee / Drinks" },
  { value: "desserts", label: "Desserts / Sweets" },
  { value: "vegan_healthy", label: "Vegan / Vegetarian / Healthy" },
  { value: "other", label: "Other" },
] as const

export type CuisineFilterValue = (typeof CUISINE_FILTER_OPTIONS)[number]["value"]

export type CuisineCategoryValue = Exclude<CuisineFilterValue, "other">

/** Older URL param values → current broad filters. */
const LEGACY_CUISINE_PARAM_ALIASES: Record<string, CuisineFilterValue> = {
  burgers: "american",
  chicken: "american",
  tacos: "mexican_latin",
  latin: "mexican_latin",
  asian: "asian_indian",
  indian: "asian_indian",
  african: "other",
  vegan_veg: "vegan_healthy",
  healthy: "vegan_healthy",
  "american-comfort": "american",
  "mexican-latin": "mexican_latin",
  "asian-indian": "asian_indian",
  "vegan-healthy": "vegan_healthy",
}

/**
 * Exact vendor-profile / signup cuisine_types labels → filter categories.
 * These are the strings trucks actually store (see dashboard profile CUISINE_OPTIONS).
 */
const KNOWN_CUISINE_TYPE_CATEGORIES: Record<string, CuisineCategoryValue[]> = {
  "mexican / tacos": ["mexican_latin"],
  "bbq / smokehouse": ["bbq"],
  "american / burgers": ["american"],
  "asian fusion": ["asian_indian"],
  "southern / soul food": ["soul"],
  "desserts / sweets": ["desserts"],
  pizza: ["italian"],
  seafood: ["seafood"],
  mediterranean: ["mediterranean"],
  "vegetarian / vegan": ["vegan_healthy"],
  "indian / curry": ["asian_indian"],
  "latin / colombian": ["mexican_latin"],
  caribbean: ["caribbean"],
  "wings / chicken": ["american"],
  "sandwiches / wraps": ["american"],
  "snow cones / slushies": ["desserts"],
  "juice / smoothies": ["coffee", "vegan_healthy"],
  "crepes / waffles": ["desserts", "breakfast"],
}

/** Strong beverage signals only — never match on bare "drinks" / "slush". */
const COFFEE_STRONG_PATTERN =
  /\bcoffee\b|\bespresso\b|\bcafe\b|\blatte\b|\bcold\s*brew\b|\bbeverages?\b|\blemonade\b|\bboba\b|\btea\b|\bsmoothies?\b|\bjuices?\b/

/** Keyword patterns for free-text cuisine signals (after negative-guard preprocessing). */
const CUISINE_PATTERNS: Record<CuisineCategoryValue, RegExp> = {
  american:
    /\bamerican\b|\bcomfort\s*food\b|\bdiner\b|\bhot\s*dogs?\b|\bmac\s*(?:and|&)\s*cheese\b|\bburgers?\b|\bsandwiches?\b|\bsubs?\b|\bsmash\b|\bphilly\b|\bcheesesteaks?\b|\bwraps?\b|\bchickens?\b|\bwings?\b|\btenders?\b|\bnuggets?\b/,
  bbq: /\bbbq\b|\bbarbecue\b|\bbarbeque\b|\bsmokehouse\b|\bsmoked\s*meats?\b|\bbrisket\b|\bpulled\s*pork\b|\bribs?\b/,
  mexican_latin:
    /\btacos?\b|\bmexican\b|\bburritos?\b|\bquesadillas?\b|\bnachos?\b|\belote\b|\bbirria\b|\btex[\s-]?mex\b|\blatin(?:o|a)?\b|\blatin\s*american\b|\bcuban\b|\bpuerto\s*rican\b|\bcolombian\b|\bvenezuelan\b|\bperuvian\b|\bbrazilian\b|\bargentin(?:a|ean|ian)?\b|\barepas?\b|\bempanadas?\b|\bpupusas?\b|\bsalvadoran\b|\bdominican\b|\bchurros?\b/,
  caribbean:
    /\bcaribbean\b|\bjamaican\b|\bjamaica\b|\bjerk\b|\btrinidad(?:ian)?\b|\bhaitian\b|\bbajan\b|\bbarbados\b|\bisland\s*(?:cuisine|food|eats|flavou?r)/,
  asian_indian:
    /\basian\b|\bchinese\b|\bjapanese\b|\bkorean\b|\bthai\b|\bvietnamese\b|\bfilipino\b|\bsushi\b|\bramen\b|\bpho\b|\bteriyaki\b|\bbao\b|\bpoke\s*bowls?\b|\bindian\b|\bcurry\b|\btikka\b|\bnaan\b|\btandoori\b|\bbiryani\b|\bmasala\b|\bdosa\b|\bsamosa\b|\bpakistani\b|\bsouth\s*asian\b/,
  mediterranean:
    /\bmediterranean\b|\bmiddle\s*east(?:ern)?\b|\bfalafel\b|\bgyros?\b|\bshawarma\b|\bhummus\b|\blebanese\b|\bgreek\b|\bturkish\b|\bhalal\b|\bkebab\b|\bpita\b/,
  // "Italian" alone is allowed only when not "Italian ice" (stripped in preprocess).
  italian: /\bpizza\b|\bpasta\b|\bstromboli\b|\bcalzone\b|\bitalian\b/,
  soul: /\bsoul\s*food\b|\bsouthern\b|\bcreole\b|\bcajun\b|\bgumbo\b|\bcollards?\b|\bfried\s*chicken\b/,
  seafood:
    /\bseafood\b|\bfish\b|\bshrimp\b|\bcrab\b|\blobster\b|\boysters?\b|\bcrawfish\b|\bclam\b/,
  breakfast:
    /\bbreakfast\b|\bbrunch\b|\bpancakes?\b|\bwaffles?\b|\bomelets?\b|\bomelettes?\b|\bbiscuits?\b/,
  coffee: COFFEE_STRONG_PATTERN,
  desserts:
    /\bdesserts?\b|\bsweets?\b|\bice\s*cream\b|\bitalian_ice_dessert\b|\bcannoli\b|\bchurros?\b|\bcookies?\b|\bcupcakes?\b|\bbrownies?\b|\bcrepes?\b|\bsnow\s*cones?\b|\bshaved\s*ice\b|\bslush(?:ie|y|ies)?\b|\bdonuts?\b|\bdoughnuts?\b|\bbakery\b|\bpastr(?:y|ies)\b|\bcakes?\b|\bcandy\b|\bgelato\b/,
  vegan_healthy:
    /\bvegan\b|\bvegetarian\b|\bplant[\s-]?based\b|\bhealthy\b|\bbowls?\b|\bsalads?\b|\bacai\b|\bsmoothie\s*bowls?\b|\bgrain\s*bowls?\b|\bpoke\s*bowls?\b|\bsmoothies?\b|\bjuices?\b|\bfresh\s*juice\b/,
}

const CATEGORY_VALUES = CUISINE_FILTER_OPTIONS.map((o) => o.value).filter(
  (v): v is CuisineCategoryValue => v !== "other"
)

const UNHELPFUL_STRUCTURED = /^(other|food\s*truck|event\s*catering|catering|vendor|n\/?a|none|various|mixed)?$/

/**
 * Vendor format options derived from existing `trucks.vendor_type` values only.
 * Signup / seed values: food_truck, food_trailer, cart_tent, truck.
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

function structuredCuisineText(t: DirectoryFilterTruck): string {
  return normalizeCuisineText([t.cuisine, ...(t.cuisine_types ?? [])].filter(Boolean).join(" "))
}

function mediumCuisineText(t: DirectoryFilterTruck): string {
  return normalizeCuisineText(
    [t.tagline, t.short_description, t.today_specials].filter(Boolean).join(" ")
  )
}

function lowCuisineText(t: DirectoryFilterTruck): string {
  return normalizeCuisineText(
    [t.description, t.full_description, t.name].filter(Boolean).join(" ")
  )
}

/**
 * Text actually used for cuisine category matching (respects source priority).
 * Prefer structured fields; short profile copy only when structured is empty/unhelpful;
 * name/long description only as last resort.
 */
export function truckCuisineHaystack(t: DirectoryFilterTruck): string {
  const structured = structuredCuisineText(t)
  if (structured && !isUnhelpfulStructuredText(structured)) {
    const fromStructured = categoriesFromText(structured)
    if (fromStructured.size > 0 || categoriesFromKnownTypes(t.cuisine_types).size > 0) {
      return structured
    }
  }
  if (structured && categoriesFromKnownTypes(t.cuisine_types).size > 0) {
    return structured
  }
  const medium = mediumCuisineText(t)
  if (medium) return medium
  return lowCuisineText(t)
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

function isUnhelpfulStructuredText(text: string): boolean {
  if (!text.trim()) return true
  if (UNHELPFUL_STRUCTURED.test(text)) return true
  const tokens = text.split(/\s+/).filter(Boolean)
  if (tokens.length > 0 && tokens.every((tok) => tok === "other")) return true
  return false
}

function preprocessCuisineText(raw: string): string {
  return normalizeCuisineText(raw)
    // Italian ice / Italian ices / Italian ice cream → dessert, not Pizza / Italian.
    .replace(/\bitalian\s+ices?(?:\s*cream)?\b/g, "italian_ice_dessert")
}

/**
 * Broad multi-filter expansions: hosts may reasonably search related categories.
 */
function expandBroadFilterCategories(cats: Set<CuisineCategoryValue>, raw: string): void {
  const text = preprocessCuisineText(raw)
  if (!text.trim()) return

  // Donuts → Desserts + Breakfast
  if (/\bdonuts?\b|\bdoughnuts?\b/.test(text)) {
    cats.add("desserts")
    cats.add("breakfast")
  }

  // Coffee / espresso (not lemonade/boba/tea alone) → Coffee + Breakfast
  if (/\bcoffee\b|\bespresso\b|\bcafe\b|\blatte\b|\bcold\s*brew\b/.test(text)) {
    cats.add("coffee")
    cats.add("breakfast")
  }

  // Crepes / waffles → Breakfast + Desserts
  if (/\bcrepes?\b|\bwaffles?\b/.test(text)) {
    cats.add("breakfast")
    cats.add("desserts")
  }

  // Smoothies / juice → Coffee / Drinks + Vegan / Vegetarian / Healthy
  if (/\bsmoothies?\b|\bjuices?\b/.test(text)) {
    cats.add("coffee")
    cats.add("vegan_healthy")
  }

  // Churros → Desserts + Mexican / Latin
  if (/\bchurros?\b/.test(text)) {
    cats.add("desserts")
    cats.add("mexican_latin")
  }
}

function categoriesFromText(raw: string): Set<CuisineCategoryValue> {
  const out = new Set<CuisineCategoryValue>()
  const text = preprocessCuisineText(raw)
  if (!text.trim()) return out

  for (const value of CATEGORY_VALUES) {
    if (CUISINE_PATTERNS[value].test(text)) out.add(value)
  }
  expandBroadFilterCategories(out, text)
  return out
}

function hasHelpfulStructuredCuisine(t: DirectoryFilterTruck): boolean {
  if (categoriesFromKnownTypes(t.cuisine_types).size > 0) return true
  const structured = structuredCuisineText(t)
  if (!structured || isUnhelpfulStructuredText(structured)) return false
  return categoriesFromText(structured).size > 0
}

/**
 * All cuisine categories a truck matches. A truck may match multiple when strong data supports it.
 * Empty set means no confident match → belongs under "Other".
 */
export function getMatchingCuisineCategories(t: DirectoryFilterTruck): CuisineCategoryValue[] {
  const known = categoriesFromKnownTypes(t.cuisine_types)
  const structured = structuredCuisineText(t)
  const fromStructuredText = structured ? categoriesFromText(structured) : new Set<CuisineCategoryValue>()

  const high = new Set<CuisineCategoryValue>([...known, ...fromStructuredText])
  if (hasHelpfulStructuredCuisine(t)) {
    expandBroadFilterCategories(high, structured)
    return CATEGORY_VALUES.filter((c) => high.has(c))
  }

  const medium = mediumCuisineText(t)
  if (medium) {
    const fromMedium = categoriesFromText(medium)
    return CATEGORY_VALUES.filter((c) => fromMedium.has(c))
  }

  const low = lowCuisineText(t)
  if (low) {
    const fromLow = categoriesFromText(low)
    return CATEGORY_VALUES.filter((c) => fromLow.has(c))
  }

  return []
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
  if (!normalized) return format === "food_truck"
  return aliases.has(normalized)
}

export function isValidCuisineFilter(value: string | null | undefined): value is CuisineFilterValue {
  return Boolean(value && CUISINE_FILTER_OPTIONS.some((o) => o.value === value))
}

/** Accept current filter values plus legacy URL params from earlier /trucks filter versions. */
export function resolveCuisineFilterParam(
  value: string | null | undefined
): CuisineFilterValue | "" {
  if (!value) return ""
  if (isValidCuisineFilter(value)) return value
  return LEGACY_CUISINE_PARAM_ALIASES[value] ?? ""
}

export function isValidVendorFormatFilter(
  value: string | null | undefined
): value is VendorFormatFilterValue {
  return Boolean(value && VENDOR_FORMAT_FILTER_OPTIONS.some((o) => o.value === value))
}
