import type { SupabaseClient } from "@supabase/supabase-js"
import { normalizeVendorEmailKey } from "@/lib/trucks/canonical-vendor-email"

/** Internal-only test vendor: hidden from public directory but receives broadcast booking opportunities. */
export const INTERNAL_DEMO_VENDOR_NAME = "FoodTruckCLT Demo Vendor"
/** Known demo vendor login addresses (production may use icloud; dev may use gmail). */
export const INTERNAL_DEMO_VENDOR_EMAILS = [
  "evolvebtc@gmail.com",
  "evolvebtc@icloud.com",
] as const
/** @deprecated Use INTERNAL_DEMO_VENDOR_EMAILS — kept for imports that expect a single constant. */
export const INTERNAL_DEMO_VENDOR_EMAIL = INTERNAL_DEMO_VENDOR_EMAILS[0]

export function isInternalDemoVendorTruck(row: {
  name?: string | null
  email?: string | null
}): boolean {
  const name = String(row.name ?? "").trim()
  if (name === INTERNAL_DEMO_VENDOR_NAME) return true
  const email = normalizeVendorEmailKey(row.email)
  if (!email) return false
  return INTERNAL_DEMO_VENDOR_EMAILS.some((e) => email === e.toLowerCase())
}

/**
 * Active listing used for opportunity fan-out only (may have `show_in_directory = false`).
 */
export async function fetchInternalDemoVendorTruckId(supabase: SupabaseClient): Promise<string | null> {
  const byName = await supabase
    .from("trucks")
    .select("id")
    .eq("is_active", true)
    .eq("status", "active")
    .eq("name", INTERNAL_DEMO_VENDOR_NAME)
    .maybeSingle()

  if (byName.error) {
    console.error("[demo-vendor] lookup by name:", byName.error)
  }
  if (byName.data?.id) {
    return byName.data.id as string
  }

  for (const email of INTERNAL_DEMO_VENDOR_EMAILS) {
    const byEmail = await supabase
      .from("trucks")
      .select("id")
      .eq("is_active", true)
      .eq("status", "active")
      .ilike("email", email)
      .maybeSingle()
    if (byEmail.error) {
      console.error("[demo-vendor] lookup by email:", byEmail.error)
    }
    if (byEmail.data?.id) {
      return byEmail.data.id as string
    }
  }

  return null
}
