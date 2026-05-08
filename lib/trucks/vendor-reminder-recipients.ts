import type { SupabaseClient } from "@supabase/supabase-js"

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
    .eq("show_in_directory", true)
    .eq("status", "active")
    .eq("is_active", true)

  if (error) {
    console.error("[vendor-reminder] fetch trucks:", error)
    return { recipients: [], eligibleTruckCount: 0 }
  }

  const rows = data ?? []
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
