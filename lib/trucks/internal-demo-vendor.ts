import type { SupabaseClient } from "@supabase/supabase-js"

/** Internal-only test vendor: hidden from public directory but receives broadcast booking opportunities. */
export const INTERNAL_DEMO_VENDOR_NAME = "FoodTruckCLT Demo Vendor"
/** Must match `trucks.email` for the demo vendor row (not booking_email or application email). */
export const INTERNAL_DEMO_VENDOR_EMAIL = "evolvebtc@gmail.com"

export function isInternalDemoVendorTruck(row: {
  name?: string | null
  email?: string | null
}): boolean {
  const name = String(row.name ?? "").trim()
  const email = String(row.email ?? "").trim().toLowerCase()
  if (name === INTERNAL_DEMO_VENDOR_NAME) return true
  if (email === INTERNAL_DEMO_VENDOR_EMAIL.toLowerCase()) return true
  return false
}

/**
 * Active listing used for opportunity fan-out only (may have `show_in_directory = false`).
 */
export async function fetchInternalDemoVendorTruckId(supabase: SupabaseClient): Promise<string | null> {
  const [byName, byEmail] = await Promise.all([
    supabase
      .from("trucks")
      .select("id")
      .eq("is_active", true)
      .eq("status", "active")
      .eq("name", INTERNAL_DEMO_VENDOR_NAME)
      .maybeSingle(),
    supabase
      .from("trucks")
      .select("id")
      .eq("is_active", true)
      .eq("status", "active")
      .ilike("email", INTERNAL_DEMO_VENDOR_EMAIL)
      .maybeSingle(),
  ])

  if (byName.error) {
    console.error("[demo-vendor] lookup by name:", byName.error)
  }
  if (byEmail.error) {
    console.error("[demo-vendor] lookup by email:", byEmail.error)
  }

  const idFromName = byName.data?.id as string | undefined
  const idFromEmail = byEmail.data?.id as string | undefined
  if (idFromName) return idFromName
  if (idFromEmail) return idFromEmail
  return null
}
