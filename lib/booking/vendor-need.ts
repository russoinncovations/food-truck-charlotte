/**
 * Host "vendor need" + specialty routing helpers.
 * No DB column — structured value is passed in memory; a labeled line is appended to notes.
 */

export const VENDOR_NEED = {
  MEAL: "meal",
  DESSERT: "dessert",
  COFFEE: "coffee",
  SNACKS: "snacks",
  MULTIPLE: "multiple",
} as const

export type VendorNeedValue = (typeof VENDOR_NEED)[keyof typeof VENDOR_NEED]

export const VENDOR_NEED_OPTIONS: { value: VendorNeedValue; label: string }[] = [
  { value: VENDOR_NEED.MEAL, label: "Meal / main food truck" },
  { value: VENDOR_NEED.DESSERT, label: "Dessert / ice cream / sweet treats" },
  { value: VENDOR_NEED.COFFEE, label: "Coffee / drinks" },
  { value: VENDOR_NEED.SNACKS, label: "Snacks / specialty vendor" },
  { value: VENDOR_NEED.MULTIPLE, label: "Open to multiple types" },
]

const VENDOR_NEED_VALUES = new Set<string>(VENDOR_NEED_OPTIONS.map((o) => o.value))

export function isVendorNeedValue(raw: string | null | undefined): raw is VendorNeedValue {
  return Boolean(raw && VENDOR_NEED_VALUES.has(raw))
}

export function vendorNeedLabel(value: VendorNeedValue): string {
  return VENDOR_NEED_OPTIONS.find((o) => o.value === value)?.label ?? value
}

export function parseVendorNeedValue(raw: string | null | undefined): VendorNeedValue | null {
  const v = (raw ?? "").trim()
  return isVendorNeedValue(v) ? v : null
}

/** Prefixed line persisted in additional_notes for ops visibility. */
export function mergeVendorNeedIntoNotes(
  additionalNotes: string | null | undefined,
  vendorNeed: VendorNeedValue
): string {
  const line = `Vendor need: ${vendorNeedLabel(vendorNeed)}`
  const base = (additionalNotes ?? "").trim()
  // Avoid duplicating if already present (e.g. resubmit / double merge).
  if (base.includes("Vendor need:")) {
    return base
  }
  return base ? `${base}\n\n${line}` : line
}

export type SpecialtyTruckProfile = {
  id?: string
  name?: string | null
  vendor_type?: string | null
  cuisine?: string | null
  cuisine_types?: string[] | null
}

function norm(s: string): string {
  return s.trim().toLowerCase()
}

/** Flatten truck identity text for specialty detection. */
export function truckProfileText(truck: SpecialtyTruckProfile): string {
  const parts: string[] = []
  if (truck.name?.trim()) parts.push(truck.name)
  if (truck.vendor_type?.trim()) parts.push(truck.vendor_type)
  if (truck.cuisine?.trim()) parts.push(truck.cuisine)
  for (const c of truck.cuisine_types ?? []) {
    if (String(c).trim()) parts.push(String(c))
  }
  return parts.join(" ").toLowerCase()
}

const DESSERT_VENDOR_PATTERN =
  /\bdesserts?\b|\bsweets?\b|\bice\s*cream\b|\bfrozen\s*treats?\b|\bfrozen\s*desserts?\b|\bitalian\s*ice\b|\bshaved\s*ice\b|\bcupcakes?\b|\bdonuts?\b|\bdoughnuts?\b|\bpastr(?:y|ies)\b|\bbakery\b|\bcookies?\b|\bchurros?\b|\bchocolate\b|\bcandy\b|\bslush(?:ie|y|ies)?\b|\bgelato\b|\bdessert_cart\b/

const COFFEE_VENDOR_PATTERN =
  /\bcoffee\b|\bespresso\b|\blatte\b|\bcold\s*brew\b|\bcafe\b|\bcoffee_cart\b/

const BEVERAGE_VENDOR_PATTERN =
  /\bbeverage_vendor\b|\bbeverages?\b|\bdrinks?\b|\blemonade\b|\btea\b|\bjuice\b|\bsmoothies?\b|\bmocktails?\b|\brefreshments?\b|\bboba\b/

const MEAL_CUISINE_PATTERN =
  /\bmexican\b|\btacos?\b|\bbbq\b|\bsmokehouse\b|\bsmoked\b|\bamerican\b|\bburgers?\b|\basian\b|\bfusion\b|\bsouthern\b|\bsoul\b|\bpizza\b|\bseafood\b|\bmediterranean\b|\bvegan\b|\bvegetarian\b|\bindian\b|\bcurry\b|\bwings?\b|\bchicken\b|\bsandwich(?:es)?\b|\bwraps?\b|\blatin\b|\bcomfort\b|\bentree\b|\bentrees\b|\bcatering\b|\bgrill\b|\bstreet\s*food\b/

const SNACK_VENDOR_PATTERN =
  /\bsnacks?\b|\bspecialty\b|\bpretzel\b|\bpopcorn\b|\bchips?\b|\bnuts?\b|\bcandy\b|\btreats?\b/

const DESSERT_REQUEST_PATTERN =
  /\bdesserts?\b|\bsweets?\b|\bice\s*cream\b|\bfrozen\s*treats?\b|\bfrozen\s*desserts?\b|\bsweet\s*treats?\b|\bafter[-\s]?meal\s*desserts?\b|\bparty\s*desserts?\b|\bdessert\s*trucks?\b|\bice\s*cream\s*trucks?\b|\bcupcakes?\b|\bcookies?\b|\bdonuts?\b|\bdoughnuts?\b|\bpastr(?:y|ies)\b|\bbakery\b|\bchurros?\b|\bitalian\s*ice\b|\bshaved\s*ice\b|\bslush(?:ie|y|ies)?\b/

const COFFEE_REQUEST_PATTERN =
  /\bcoffee\b|\bespresso\b|\blatte\b|\bbreakfast\b|\bbrunch\b|\bdrinks?\b|\bbeverages?\b/

const BEVERAGE_REQUEST_PATTERN =
  /\bdrinks?\b|\bbeverages?\b|\blemonade\b|\btea\b|\bjuice\b|\bsmoothies?\b|\bmocktails?\b|\brefreshments?\b/

export function truckHasMealCuisineSignals(truck: SpecialtyTruckProfile): boolean {
  const text = truckProfileText(truck)
  if (MEAL_CUISINE_PATTERN.test(text)) return true
  // Primary browse labels that are clearly meal-oriented
  for (const c of truck.cuisine_types ?? []) {
    const n = norm(String(c))
    if (
      n.includes("mexican") ||
      n.includes("bbq") ||
      n.includes("american") ||
      n.includes("asian") ||
      n.includes("southern") ||
      n.includes("soul") ||
      n.includes("pizza") ||
      n.includes("seafood") ||
      n.includes("mediterranean") ||
      n.includes("vegetarian") ||
      n.includes("vegan") ||
      n.includes("comfort") ||
      n.includes("latin") ||
      n.includes("caribbean") ||
      n.includes("indian")
    ) {
      return true
    }
  }
  const cuisine = norm(truck.cuisine ?? "")
  if (
    cuisine &&
    !DESSERT_VENDOR_PATTERN.test(cuisine) &&
    !COFFEE_VENDOR_PATTERN.test(cuisine) &&
    !BEVERAGE_VENDOR_PATTERN.test(cuisine) &&
    cuisine !== "other" &&
    cuisine !== "desserts / sweets" &&
    cuisine !== "coffee / drinks"
  ) {
    // Unclassified single cuisine often means a meal truck
    if (MEAL_CUISINE_PATTERN.test(cuisine)) return true
  }
  return false
}

export function isDessertSpecialtyVendor(truck: SpecialtyTruckProfile): boolean {
  const text = truckProfileText(truck)
  const vt = norm(truck.vendor_type ?? "")
  if (vt === "dessert_cart") return true
  return DESSERT_VENDOR_PATTERN.test(text)
}

export function isCoffeeSpecialtyVendor(truck: SpecialtyTruckProfile): boolean {
  const text = truckProfileText(truck)
  const vt = norm(truck.vendor_type ?? "")
  if (vt === "coffee_cart") return true
  return COFFEE_VENDOR_PATTERN.test(text)
}

export function isBeverageSpecialtyVendor(truck: SpecialtyTruckProfile): boolean {
  const text = truckProfileText(truck)
  const vt = norm(truck.vendor_type ?? "")
  if (vt === "beverage_vendor") return true
  // Beverage signals without being primarily a meal truck; coffee carts counted separately
  if (vt === "coffee_cart") return false
  return BEVERAGE_VENDOR_PATTERN.test(text) && !MEAL_CUISINE_PATTERN.test(text)
}

/** Dessert vendor with no meal cuisine — protect from general meal fan-out. */
export function isDessertOnlyVendor(truck: SpecialtyTruckProfile): boolean {
  return isDessertSpecialtyVendor(truck) && !truckHasMealCuisineSignals(truck)
}

export function isCoffeeOnlyVendor(truck: SpecialtyTruckProfile): boolean {
  if (!isCoffeeSpecialtyVendor(truck)) return false
  if (truckHasMealCuisineSignals(truck)) return false
  // Pure coffee/drinks browse label
  return true
}

export function isBeverageOnlyVendor(truck: SpecialtyTruckProfile): boolean {
  if (isDessertOnlyVendor(truck) || isCoffeeOnlyVendor(truck)) return false
  return isBeverageSpecialtyVendor(truck) && !truckHasMealCuisineSignals(truck)
}

export function isSnackSpecialtyVendor(truck: SpecialtyTruckProfile): boolean {
  const text = truckProfileText(truck)
  if (isDessertOnlyVendor(truck) || isCoffeeOnlyVendor(truck) || isBeverageOnlyVendor(truck)) {
    return SNACK_VENDOR_PATTERN.test(text)
  }
  return SNACK_VENDOR_PATTERN.test(text) && !truckHasMealCuisineSignals(truck)
}

export type BroadcastRequestSignals = {
  vendorNeed: VendorNeedValue | null
  cuisines: string[] | null | undefined
  requestText: string | null | undefined
}

function combinedRequestText(signals: BroadcastRequestSignals): string {
  const parts: string[] = []
  if (signals.vendorNeed) parts.push(vendorNeedLabel(signals.vendorNeed))
  for (const c of signals.cuisines ?? []) parts.push(String(c))
  if (signals.requestText?.trim()) parts.push(signals.requestText)
  return parts.join(" ").toLowerCase()
}

export function requestMatchesDessertSpecialty(signals: BroadcastRequestSignals): boolean {
  if (signals.vendorNeed === VENDOR_NEED.DESSERT) return true
  const text = combinedRequestText(signals)
  if (DESSERT_REQUEST_PATTERN.test(text)) return true
  for (const c of signals.cuisines ?? []) {
    const n = norm(String(c))
    if (n.includes("dessert") || n.includes("sweet") || n.includes("ice cream")) return true
  }
  return false
}

export function requestMatchesCoffeeSpecialty(signals: BroadcastRequestSignals): boolean {
  if (signals.vendorNeed === VENDOR_NEED.COFFEE) return true
  const text = combinedRequestText(signals)
  return COFFEE_REQUEST_PATTERN.test(text)
}

export function requestMatchesBeverageSpecialty(signals: BroadcastRequestSignals): boolean {
  if (signals.vendorNeed === VENDOR_NEED.COFFEE) return true
  if (signals.vendorNeed === VENDOR_NEED.SNACKS) {
    // snacks need alone is not a beverage match
  }
  const text = combinedRequestText(signals)
  return BEVERAGE_REQUEST_PATTERN.test(text)
}

function truckLabelsMatchRequest(
  truck: SpecialtyTruckProfile,
  signals: BroadcastRequestSignals
): boolean {
  const profile = truckProfileText(truck)
  const tokens = new Set<string>()
  for (const c of signals.cuisines ?? []) {
    for (const part of String(c).toLowerCase().split(/[^a-z0-9]+/)) {
      if (part.length >= 3) tokens.add(part)
    }
  }
  const req = (signals.requestText ?? "").toLowerCase()
  for (const part of req.split(/[^a-z0-9]+/)) {
    if (part.length >= 3) tokens.add(part)
  }
  if (tokens.size === 0) return false
  for (const t of tokens) {
    if (profile.includes(t)) return true
  }
  return false
}

/**
 * Specialty protection + vendor-need scoping for open/cuisine broadcasts.
 * Call after format + cuisine_match token filters.
 */
export function truckPassesSpecialtyRoutingGate(
  truck: SpecialtyTruckProfile,
  signals: BroadcastRequestSignals,
  opts?: {
    requestType?: "open_request" | "cuisine_match"
    /** True when cuisine_match token filter already kept this truck. */
    passedCuisineTokenMatch?: boolean
  }
): boolean {
  const vendorNeed = signals.vendorNeed ?? VENDOR_NEED.MULTIPLE
  const dessertMatch = requestMatchesDessertSpecialty(signals)
  const coffeeMatch = requestMatchesCoffeeSpecialty(signals)
  const beverageMatch = requestMatchesBeverageSpecialty(signals)

  const dessertOnly = isDessertOnlyVendor(truck)
  const coffeeOnly = isCoffeeOnlyVendor(truck)
  const beverageOnly = isBeverageOnlyVendor(truck)
  const dessertSpecialty = isDessertSpecialtyVendor(truck)
  const coffeeSpecialty = isCoffeeSpecialtyVendor(truck)
  const beverageSpecialty = isBeverageSpecialtyVendor(truck) || coffeeSpecialty
  const snackSpecialty = isSnackSpecialtyVendor(truck)

  // Core specialty protection: never send unrelated general meal requests to specialty-only vendors.
  if (dessertOnly && !dessertMatch) return false
  if (coffeeOnly && !coffeeMatch) return false
  if (beverageOnly && !beverageMatch) return false

  switch (vendorNeed) {
    case VENDOR_NEED.MEAL:
      // Specialty-only already excluded unless matched above.
      return true

    case VENDOR_NEED.DESSERT:
      if (dessertSpecialty || dessertOnly) return dessertMatch
      // Unrelated meal-only: only if cuisine_match already included them.
      if (opts?.requestType === "cuisine_match" && opts.passedCuisineTokenMatch) return true
      return false

    case VENDOR_NEED.COFFEE:
      if (coffeeSpecialty || beverageSpecialty || coffeeOnly || beverageOnly) {
        return coffeeMatch || beverageMatch
      }
      if (opts?.requestType === "cuisine_match" && opts.passedCuisineTokenMatch) return true
      return false

    case VENDOR_NEED.SNACKS:
      if (snackSpecialty || dessertSpecialty || coffeeSpecialty || beverageSpecialty) {
        return truckLabelsMatchRequest(truck, signals) || dessertMatch || coffeeMatch || beverageMatch
      }
      // No full-directory blast for snacks need.
      return truckLabelsMatchRequest(truck, signals)

    case VENDOR_NEED.MULTIPLE:
      // Meal trucks OK; specialty-only only when clearly matched (already enforced above).
      if (dessertOnly || coffeeOnly || beverageOnly) {
        return (
          (dessertOnly && dessertMatch) ||
          (coffeeOnly && coffeeMatch) ||
          (beverageOnly && beverageMatch)
        )
      }
      return true

    default:
      return true
  }
}
