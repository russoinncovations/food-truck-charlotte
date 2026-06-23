import type { SupabaseClient } from "@supabase/supabase-js"
import { normalizeVendorEmailKey } from "@/lib/trucks/canonical-vendor-email"

/** Admin-only internal test targets — not selectable on public booking forms. */
export type InternalTestRecipientId = "demo_vendor" | "official_test_truck"

export const DEFAULT_INTERNAL_TEST_RECIPIENT_ID: InternalTestRecipientId = "demo_vendor"

export type InternalTestRecipientConfig = {
  id: InternalTestRecipientId
  label: string
  name: string
  email: string
}

export const INTERNAL_TEST_RECIPIENTS: Record<InternalTestRecipientId, InternalTestRecipientConfig> = {
  demo_vendor: {
    id: "demo_vendor",
    label: "FoodTruckCLT Demo Vendor",
    name: "FoodTruckCLT Demo Vendor",
    email: "evolvebtc@icloud.com",
  },
  official_test_truck: {
    id: "official_test_truck",
    label: "Official Test Truck",
    name: "Official Test Truck",
    email: "evolvebtc@gmail.com",
  },
}

export const INTERNAL_TEST_RECIPIENT_LIST = Object.values(INTERNAL_TEST_RECIPIENTS)

/** @deprecated Use INTERNAL_TEST_RECIPIENTS.demo_vendor.name */
export const INTERNAL_DEMO_VENDOR_NAME = INTERNAL_TEST_RECIPIENTS.demo_vendor.name

/** @deprecated Use INTERNAL_TEST_RECIPIENTS.demo_vendor.email */
export const INTERNAL_DEMO_VENDOR_EMAIL = INTERNAL_TEST_RECIPIENTS.demo_vendor.email

export function parseInternalTestRecipientId(
  raw: string | null | undefined
): InternalTestRecipientId {
  const v = String(raw ?? "").trim()
  if (v === "official_test_truck") return "official_test_truck"
  return "demo_vendor"
}

export function internalTestRecipientConfig(
  id: InternalTestRecipientId
): InternalTestRecipientConfig {
  return INTERNAL_TEST_RECIPIENTS[id]
}

export function truckMatchesInternalTestRecipient(
  recipientId: InternalTestRecipientId,
  row: { name?: string | null; email?: string | null }
): boolean {
  const config = INTERNAL_TEST_RECIPIENTS[recipientId]
  const name = String(row.name ?? "").trim()
  if (name === config.name) return true
  return normalizeVendorEmailKey(row.email) === normalizeVendorEmailKey(config.email)
}

export function isInternalDemoVendorTruck(row: {
  name?: string | null
  email?: string | null
}): boolean {
  return truckMatchesInternalTestRecipient("demo_vendor", row)
}

export function isOfficialTestTruck(row: {
  name?: string | null
  email?: string | null
}): boolean {
  return truckMatchesInternalTestRecipient("official_test_truck", row)
}

export function isInternalTestTruck(row: {
  name?: string | null
  email?: string | null
}): boolean {
  return isInternalDemoVendorTruck(row) || isOfficialTestTruck(row)
}

async function fetchActiveTruckIdByName(
  supabase: SupabaseClient,
  name: string
): Promise<string | null> {
  const { data, error } = await supabase
    .from("trucks")
    .select("id")
    .eq("is_active", true)
    .eq("status", "active")
    .eq("name", name)
    .maybeSingle()

  if (error) {
    console.error("[internal-test-recipient] lookup by name:", name, error)
  }
  return data?.id ? String(data.id) : null
}

async function fetchActiveTruckIdByEmail(
  supabase: SupabaseClient,
  email: string
): Promise<string | null> {
  const { data, error } = await supabase
    .from("trucks")
    .select("id")
    .eq("is_active", true)
    .eq("status", "active")
    .ilike("email", email)
    .maybeSingle()

  if (error) {
    console.error("[internal-test-recipient] lookup by email:", email, error)
  }
  return data?.id ? String(data.id) : null
}

/** Resolves one allowed admin internal-test recipient truck (must be active). */
export async function fetchInternalTestRecipientTruckId(
  supabase: SupabaseClient,
  recipientId: InternalTestRecipientId
): Promise<string | null> {
  const config = INTERNAL_TEST_RECIPIENTS[recipientId]
  const byName = await fetchActiveTruckIdByName(supabase, config.name)
  if (byName) return byName
  return fetchActiveTruckIdByEmail(supabase, config.email)
}

/** Both internal test trucks — used for admin open-request fan-out only. */
export async function fetchAllInternalTestRecipientTruckIds(
  supabase: SupabaseClient
): Promise<string[]> {
  const ids: string[] = []
  for (const recipient of INTERNAL_TEST_RECIPIENT_LIST) {
    const id = await fetchInternalTestRecipientTruckId(supabase, recipient.id)
    if (id) ids.push(id)
  }
  return [...new Set(ids)]
}

/** @deprecated Use fetchInternalTestRecipientTruckId(supabase, "demo_vendor") */
export async function fetchInternalDemoVendorTruckId(
  supabase: SupabaseClient
): Promise<string | null> {
  return fetchInternalTestRecipientTruckId(supabase, "demo_vendor")
}
