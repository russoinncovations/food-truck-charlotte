import type { SupabaseClient } from "@supabase/supabase-js"
import { PUBLIC_LISTED_TRUCK_EQ } from "@/lib/trucks/public-listed-truck-query"
import { isInternalDemoVendorTruck } from "@/lib/trucks/internal-demo-vendor"

export type VendorReminderRecipient = {
  id: string
  name: string
  email: string
}

export function isPlausibleVendorEmail(email: string | null | undefined): boolean {
  const t = (email ?? "").trim()
  if (t.length < 5) return false
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(t)
}

/**
 * Directory-visible active trucks, deduped by email (one reminder per inbox).
 * Skipped = eligible trucks minus unique valid emails (reported separately when sending).
 */
export async function fetchVendorReminderRecipients(
  supabase: SupabaseClient
): Promise<{ recipients: VendorReminderRecipient[]; eligibleTruckCount: number }> {
  const { data, error } = await supabase
    .from("trucks")
    .select("id, name, email")
    .eq("show_in_directory", PUBLIC_LISTED_TRUCK_EQ.show_in_directory)
    .eq("status", PUBLIC_LISTED_TRUCK_EQ.status)
    .eq("is_active", PUBLIC_LISTED_TRUCK_EQ.is_active)

  if (error) {
    console.error("[vendor-reminder] fetch trucks:", error)
    return { recipients: [], eligibleTruckCount: 0 }
  }

  const rows = (data ?? []).filter((row) => !isInternalDemoVendorTruck(row as { name?: string; email?: string }))
  const eligibleTruckCount = rows.length
  const seenEmail = new Set<string>()
  const recipients: VendorReminderRecipient[] = []

  for (const row of rows) {
    const email = (row.email as string | null | undefined)?.trim()
    if (!email || !isPlausibleVendorEmail(email)) continue
    const key = email.toLowerCase()
    if (seenEmail.has(key)) continue
    seenEmail.add(key)
    recipients.push({
      id: row.id as string,
      name: String((row as { name: string | null }).name ?? "").trim() || "there",
      email,
    })
  }

  return { recipients, eligibleTruckCount }
}

/**
 * Recipients for the “profile + live pin” bulk reminder: active directory trucks, non-test names,
 * non-empty email, deduped by email (one send per inbox).
 */
export async function fetchVendorProfileReminderRecipients(
  supabase: SupabaseClient
): Promise<{ recipients: VendorReminderRecipient[]; eligibleTruckCount: number }> {
  const { data, error } = await supabase
    .from("trucks")
    .select("id, name, email")
    .eq("show_in_directory", PUBLIC_LISTED_TRUCK_EQ.show_in_directory)
    .eq("status", PUBLIC_LISTED_TRUCK_EQ.status)
    .eq("is_active", PUBLIC_LISTED_TRUCK_EQ.is_active)
    .not("email", "is", null)
    .neq("email", "")

  if (error) {
    console.error("[vendor-profile-reminder] fetch trucks:", error)
    return { recipients: [], eligibleTruckCount: 0 }
  }

  type Row = { id: string; name: string | null; email: string | null }

  const rows = ((data ?? []) as Row[]).filter((row) => !isInternalDemoVendorTruck(row))

  const eligibleRows: Row[] = []
  for (const row of rows) {
    const nameRaw = String(row.name ?? "").trim()
    if (nameRaw.toLowerCase().includes("test")) continue
    const email = (row.email ?? "").trim()
    if (!email || !isPlausibleVendorEmail(email)) continue
    eligibleRows.push(row)
  }

  const eligibleTruckCount = eligibleRows.length
  const seenEmail = new Set<string>()
  const recipients: VendorReminderRecipient[] = []

  for (const row of eligibleRows) {
    const email = (row.email ?? "").trim()
    const key = email.toLowerCase()
    if (seenEmail.has(key)) continue
    seenEmail.add(key)
    const nameRaw = String(row.name ?? "").trim()
    recipients.push({
      id: row.id,
      name: nameRaw || "there",
      email,
    })
  }

  return { recipients, eligibleTruckCount }
}
