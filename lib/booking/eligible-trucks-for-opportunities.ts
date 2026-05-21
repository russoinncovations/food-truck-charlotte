import type { SupabaseClient } from "@supabase/supabase-js"
import { PUBLIC_LISTED_TRUCK_EQ } from "@/lib/trucks/public-listed-truck-query"
import { fetchInternalDemoVendorTruckId } from "@/lib/trucks/internal-demo-vendor"

export type DirectoryTruckRow = {
  id: string
  vendor_type: string | null
  cuisine_types: string[] | null
  cuisine: string | null
}

function norm(s: string): string {
  return s.trim().toLowerCase()
}

function cuisineTokensFromBooking(cuisines: string[] | null | undefined): Set<string> {
  const out = new Set<string>()
  for (const c of cuisines ?? []) {
    const t = norm(String(c))
    if (t) out.add(t)
  }
  return out
}

function cuisineTokensFromTruck(truck: DirectoryTruckRow): Set<string> {
  const out = new Set<string>()
  for (const c of truck.cuisine_types ?? []) {
    const t = norm(String(c))
    if (t) out.add(t)
  }
  if (truck.cuisine?.trim()) {
    for (const part of truck.cuisine.split(/[,;/]/)) {
      const t = norm(part)
      if (t) out.add(t)
    }
  }
  return out
}

/** Host-selected vendor format vs truck.vendor_type (directory). */
export function truckMatchesBookingVendorType(
  truckVendorType: string | null | undefined,
  bookingVendorType: string | null | undefined
): boolean {
  const b = norm(bookingVendorType ?? "")
  if (!b || b === "any") return true
  const t = norm(truckVendorType ?? "truck")
  if (b === t) return true
  if ((b === "cart" || b === "tent") && (t === "cart_tent" || t === "cart/tent" || t === "cart-tent")) {
    return true
  }
  return false
}

export function truckMatchesBookingCuisines(
  truck: DirectoryTruckRow,
  bookingCuisines: string[] | null | undefined
): boolean {
  const wanted = cuisineTokensFromBooking(bookingCuisines)
  if (wanted.size === 0) return true
  const have = cuisineTokensFromTruck(truck)
  for (const w of wanted) {
    if (have.has(w)) return true
  }
  return false
}

/**
 * Loads public-listed trucks and returns IDs eligible for open / cuisine broadcast opportunities.
 * Does not email vendors — only scopes which trucks get a dashboard row.
 */
export async function fetchEligibleTruckIdsForBroadcast(
  supabase: SupabaseClient,
  opts: {
    requestType: "open_request" | "cuisine_match"
    cuisines: string[] | null | undefined
    vendorType: string | null | undefined
  }
): Promise<string[]> {
  const { data: trucks, error } = await supabase
    .from("trucks")
    .select("id, vendor_type, cuisine_types, cuisine")
    .eq("show_in_directory", PUBLIC_LISTED_TRUCK_EQ.show_in_directory)
    .eq("is_active", PUBLIC_LISTED_TRUCK_EQ.is_active)
    .eq("status", PUBLIC_LISTED_TRUCK_EQ.status)

  if (error) {
    console.error("[booking] eligible trucks fetch:", error)
    return []
  }

  const rows = (trucks ?? []) as DirectoryTruckRow[]
  const filtered = rows.filter((t) => {
    if (!truckMatchesBookingVendorType(t.vendor_type, opts.vendorType)) return false
    if (opts.requestType === "cuisine_match") {
      return truckMatchesBookingCuisines(t, opts.cuisines)
    }
    return true
  })

  const publicIds = filtered.map((t) => t.id as string)
  const demoId = await fetchInternalDemoVendorTruckId(supabase)
  if (!demoId) return publicIds

  const merged = new Set(publicIds)
  merged.add(demoId)
  return [...merged]
}
