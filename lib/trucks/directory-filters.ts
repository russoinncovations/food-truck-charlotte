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

/** Patterns matched against cuisine + cuisine_types (and keyword haystack fallback). */
const CUISINE_PATTERNS: Record<Exclude<CuisineFilterValue, "other">, RegExp> = {
  american: /\bamerican\b|comfort\s*food|diner|hot\s*dog|mac\s*and\s*cheese|comfort/,
  bbq: /\bbbq\b|barbecue|barbeque|smokehouse|\bsmoke\b|brisket|pulled\s*pork/,
  burgers: /\bburger|\bsandwich|smash|philly|cheesesteak/,
  chicken: /\bchicken\b|\bwings?\b|tenders?|nugget/,
  tacos: /\btacos?\b|mexican|burrito|quesadilla|nachos?|elote|birria/,
  latin: /\blatin\b|colombian|venezuelan|peruvian|brazilian|argentin|arepa|empanada|pupusa/,
  caribbean: /\bcaribbean\b|jamaican|\bjerk\b|island|trinidad|haitian|cuban/,
  soul: /\bsoul\b|southern|creole|cajun|gumbo|collard|fried\s*chicken/,
  seafood: /\bseafood\b|\bfish\b|shrimp|crab|lobster|oyster|poke/,
  asian: /\basian\b|chinese|japanese|korean|thai|vietnamese|filipino|sushi|ramen|pho|teriyaki|bao/,
  indian: /\bindian\b|curry|tikka|naan|tandoori|biryani/,
  mediterranean: /\bmediterranean\b|middle\s*east|falafel|gyro|shawarma|hummus|lebanese|greek|turkish/,
  italian: /\bitalian\b|\bpizza\b|pasta|gelato/,
  african: /\bafrican\b|ethiopian|nigerian|ghanaian|senegalese|west\s*african/,
  breakfast: /\bbreakfast\b|\bbrunch\b|pancake|waffle|omelet|biscuit/,
  coffee: /\bcoffee\b|espresso|\bcafe\b|latte|cold\s*brew|beverage|drinks?/,
  desserts: /\bdesserts?\b|\bsweets?\b|ice\s*cream|cookie|cupcake|brownie|crepe|sno\s*cone|slush|smoothie|bakery/,
  vegan_veg: /\bvegan\b|vegetarian|plant[\s-]?based/,
  healthy: /\bhealthy\b|\bbowls?\b|salad|acai|smoothie\s*bowl|grain\s*bowl|poke\s*bowl/,
}

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

export function truckCuisineHaystack(t: DirectoryFilterTruck): string {
  const types = (t.cuisine_types ?? []).join(" ")
  return `${t.cuisine ?? ""} ${types}`.toLowerCase()
}

/** Keyword search across name, descriptions, cuisine, and menu/service notes. */
export function truckKeywordHaystack(t: DirectoryFilterTruck): string {
  return [
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
    .toLowerCase()
}

export function matchesKeyword(t: DirectoryFilterTruck, query: string): boolean {
  const q = query.trim().toLowerCase()
  if (!q) return true
  return truckKeywordHaystack(t).includes(q)
}

export function matchesCuisineCategory(
  t: DirectoryFilterTruck,
  cuisine: string | null | undefined
): boolean {
  if (!cuisine) return true
  const hay = truckCuisineHaystack(t)
  if (!hay.trim()) {
    // No cuisine data: only show under "Other" when that filter is selected.
    return cuisine === "other"
  }
  if (cuisine === "other") {
    return !Object.values(CUISINE_PATTERNS).some((re) => re.test(hay))
  }
  const pattern = CUISINE_PATTERNS[cuisine as Exclude<CuisineFilterValue, "other">]
  if (!pattern) return true
  return pattern.test(hay)
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
