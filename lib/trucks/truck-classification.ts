/**
 * Manual truck classification for browse accuracy.
 * Uses existing columns only: cuisine (primary), cuisine_types (tags), vendor_type (setup).
 */

/** Simplified host-facing cuisine filters for /trucks (and manual editors). */
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

/** Browse-aligned cuisine labels stored in `trucks.cuisine` / `trucks.cuisine_types`. */
export const BROWSE_CUISINE_LABELS = CUISINE_FILTER_OPTIONS.filter((o) => o.value !== "other").map(
  (o) => o.label
)

export const BROWSE_CUISINE_LABEL_WITH_OTHER = CUISINE_FILTER_OPTIONS.map((o) => o.label)

/** Map browse/public filter labels → category values. */
export const BROWSE_CUISINE_LABEL_TO_CATEGORY: Record<string, CuisineCategoryValue[]> = {
  "american / comfort": ["american"],
  "american / comfort food": ["american"],
  bbq: ["bbq"],
  "mexican / latin": ["mexican_latin"],
  "caribbean / jamaican": ["caribbean"],
  "jamaican / caribbean": ["caribbean"],
  "asian / indian": ["asian_indian"],
  "mediterranean / middle eastern": ["mediterranean"],
  "pizza / italian": ["italian"],
  "italian / pizza": ["italian"],
  "southern / soul food": ["soul"],
  "soul food / southern": ["soul"],
  seafood: ["seafood"],
  "breakfast / brunch": ["breakfast"],
  "coffee / drinks": ["coffee"],
  "desserts / sweets": ["desserts"],
  "vegan / vegetarian / healthy": ["vegan_healthy"],
  "vegan / vegetarian": ["vegan_healthy"],
  "healthy / bowls": ["vegan_healthy"],
}

/**
 * Exact vendor-profile / signup cuisine_types labels → filter categories.
 * Kept for trucks not yet cleaned up to browse labels.
 */
export const KNOWN_CUISINE_TYPE_CATEGORIES: Record<string, CuisineCategoryValue[]> = {
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

/** Detailed vendor setup values stored in `trucks.vendor_type`. */
export const VENDOR_SETUP_EDIT_OPTIONS = [
  { value: "food_truck", label: "Food truck" },
  { value: "food_trailer", label: "Food trailer" },
  { value: "food_cart", label: "Food cart" },
  { value: "tent_booth", label: "Tent / booth" },
  { value: "coffee_cart", label: "Coffee cart" },
  { value: "dessert_cart", label: "Dessert cart" },
  { value: "beverage_vendor", label: "Beverage vendor" },
  { value: "catering_setup", label: "Catering setup" },
  { value: "other", label: "Other" },
] as const

export type VendorSetupEditValue = (typeof VENDOR_SETUP_EDIT_OPTIONS)[number]["value"]

/** Public /trucks vendor setup filter (simpler buckets). */
export const PUBLIC_VENDOR_FORMAT_FILTER_OPTIONS = [
  { value: "food_truck", label: "Food truck" },
  { value: "food_trailer", label: "Food trailer" },
  { value: "cart_tent", label: "Cart / tent / booth" },
  { value: "catering_setup", label: "Catering setup" },
  { value: "other", label: "Other" },
] as const

export type PublicVendorFormatFilterValue =
  (typeof PUBLIC_VENDOR_FORMAT_FILTER_OPTIONS)[number]["value"]

const PUBLIC_VENDOR_FORMAT_ALIASES: Record<PublicVendorFormatFilterValue, Set<string>> = {
  food_truck: new Set(["truck", "food_truck", "foodtruck", "food-truck"]),
  food_trailer: new Set(["food_trailer", "trailer", "food-trailer", "foodtrailer"]),
  cart_tent: new Set([
    "cart_tent",
    "cart/tent",
    "cart-tent",
    "cart",
    "tent",
    "booth",
    "tent_booth",
    "food_cart",
    "coffee_cart",
    "dessert_cart",
    "beverage_vendor",
    "cart_tent_booth",
  ]),
  catering_setup: new Set(["catering_setup", "catering", "catering-setup"]),
  other: new Set(["other"]),
}

/** Legacy signup/seed values → edit form value. */
const VENDOR_SETUP_LEGACY_TO_EDIT: Record<string, VendorSetupEditValue> = {
  truck: "food_truck",
  food_truck: "food_truck",
  foodtruck: "food_truck",
  "food-truck": "food_truck",
  food_trailer: "food_trailer",
  trailer: "food_trailer",
  cart_tent: "tent_booth",
  "cart/tent": "tent_booth",
  "cart-tent": "tent_booth",
  cart: "food_cart",
  tent: "tent_booth",
  booth: "tent_booth",
  tent_booth: "tent_booth",
  food_cart: "food_cart",
  coffee_cart: "coffee_cart",
  dessert_cart: "dessert_cart",
  beverage_vendor: "beverage_vendor",
  catering_setup: "catering_setup",
  catering: "catering_setup",
  other: "other",
}

/** Detailed vendor cuisine_types → browse label (for form defaults). */
const DETAILED_TAG_TO_BROWSE_LABEL: Record<string, string> = {
  "mexican / tacos": "Mexican / Latin",
  "bbq / smokehouse": "BBQ",
  "american / burgers": "American / Comfort",
  "asian fusion": "Asian / Indian",
  "southern / soul food": "Southern / Soul Food",
  "desserts / sweets": "Desserts / Sweets",
  pizza: "Pizza / Italian",
  seafood: "Seafood",
  mediterranean: "Mediterranean / Middle Eastern",
  "vegetarian / vegan": "Vegan / Vegetarian / Healthy",
  "indian / curry": "Asian / Indian",
  "latin / colombian": "Mexican / Latin",
  caribbean: "Caribbean / Jamaican",
  "wings / chicken": "American / Comfort",
  "sandwiches / wraps": "American / Comfort",
  "snow cones / slushies": "Desserts / Sweets",
  "juice / smoothies": "Coffee / Drinks",
  "crepes / waffles": "Breakfast / Brunch",
}

export function normalizeLabelKey(raw: string): string {
  return raw.toLowerCase().replace(/\s+/g, " ").trim()
}

export function normalizeVendorTypeKey(raw: string | null | undefined): string {
  return (raw ?? "").trim().toLowerCase().replace(/\s+/g, "_")
}

export function categoriesFromExactManualLabel(raw: string): CuisineCategoryValue[] {
  const key = normalizeLabelKey(raw)
  if (!key || key === "other" || key === "general") return []
  const fromBrowse = BROWSE_CUISINE_LABEL_TO_CATEGORY[key]
  if (fromBrowse) return [...fromBrowse]
  const fromKnown = KNOWN_CUISINE_TYPE_CATEGORIES[key]
  if (fromKnown) return [...fromKnown]
  return []
}

/**
 * Categories from manually curated structured fields only (exact label maps).
 * Empty → caller should use automatic text/pattern fallback.
 */
export function categoriesFromManualClassification(
  cuisine: string | null | undefined,
  cuisineTypes: string[] | null | undefined
): CuisineCategoryValue[] {
  const out = new Set<CuisineCategoryValue>()
  for (const c of categoriesFromExactManualLabel(cuisine ?? "")) {
    out.add(c)
  }
  // cuisine may be comma-joined from older approval flow
  if (cuisine && /[,;]/.test(cuisine)) {
    for (const part of cuisine.split(/[,;]/)) {
      for (const c of categoriesFromExactManualLabel(part.trim())) out.add(c)
    }
  }
  for (const t of cuisineTypes ?? []) {
    for (const c of categoriesFromExactManualLabel(String(t))) out.add(c)
  }
  return CUISINE_FILTER_OPTIONS.map((o) => o.value).filter(
    (v): v is CuisineCategoryValue => v !== "other" && out.has(v)
  )
}

export function hasManualCuisineClassification(
  cuisine: string | null | undefined,
  cuisineTypes: string[] | null | undefined
): boolean {
  if (normalizeLabelKey(cuisine ?? "") === "other") return true
  return categoriesFromManualClassification(cuisine, cuisineTypes).length > 0
}

export function isValidVendorSetupEditValue(
  value: string | null | undefined
): value is VendorSetupEditValue {
  return Boolean(value && VENDOR_SETUP_EDIT_OPTIONS.some((o) => o.value === value))
}

export function resolveVendorSetupForEdit(
  raw: string | null | undefined
): VendorSetupEditValue | "" {
  if (!raw?.trim()) return ""
  const key = raw.trim().toLowerCase().replace(/\s+/g, "_")
  return VENDOR_SETUP_LEGACY_TO_EDIT[key] ?? (isValidVendorSetupEditValue(key) ? key : "")
}

export function matchesPublicVendorFormat(
  truckVendorType: string | null | undefined,
  format: string | null | undefined
): boolean {
  if (!format) return true
  const bucket = format as PublicVendorFormatFilterValue
  const aliases = PUBLIC_VENDOR_FORMAT_ALIASES[bucket]
  if (!aliases) return true
  const key = normalizeVendorTypeKey(truckVendorType)
  if (!key) return bucket === "food_truck"
  return aliases.has(key)
}

export function isValidPublicVendorFormatFilter(
  value: string | null | undefined
): value is PublicVendorFormatFilterValue {
  return Boolean(value && PUBLIC_VENDOR_FORMAT_FILTER_OPTIONS.some((o) => o.value === value))
}

export function browseLabelForStoredTag(raw: string): string | null {
  const key = normalizeLabelKey(raw)
  if (!key || key === "other" || key === "general") return null
  const browseHit = BROWSE_CUISINE_LABEL_WITH_OTHER.find((l) => normalizeLabelKey(l) === key)
  if (browseHit && browseHit !== "Other") return browseHit
  return DETAILED_TAG_TO_BROWSE_LABEL[key] ?? null
}

/** Map cuisine field + cuisine_types to browse labels for form defaults. */
export function browseLabelsFromStoredCuisine(
  cuisine: string | null | undefined,
  cuisineTypes: string[] | null | undefined
): { primary: string; additional: string[] } {
  const typeLabels = new Set<string>()

  for (const t of cuisineTypes ?? []) {
    const browse = browseLabelForStoredTag(String(t))
    if (browse) typeLabels.add(browse)
  }

  const cuisineTrim = (cuisine ?? "").trim()
  let primary = ""
  if (cuisineTrim) {
    const direct = browseLabelForStoredTag(cuisineTrim)
    if (direct) {
      primary = direct
    } else {
      for (const part of cuisineTrim.split(/[,;]/)) {
        const browse = browseLabelForStoredTag(part.trim())
        if (browse) {
          primary = browse
          break
        }
      }
    }
  }

  if (!primary && typeLabels.size > 0) {
    primary = [...typeLabels][0] ?? ""
  }

  const additional = [...typeLabels].filter((l) => l !== primary)
  return { primary, additional }
}

export function isValidBrowseCuisineLabel(label: string): boolean {
  return BROWSE_CUISINE_LABEL_WITH_OTHER.some((l) => normalizeLabelKey(l) === normalizeLabelKey(label))
}
