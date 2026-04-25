import type { SupabaseClient } from "@supabase/supabase-js"

export function slugFromEventTitle(title: string): string {
  const base = title
    .toLowerCase()
    .trim()
    .replace(/\s+/g, "-")
    .replace(/[^a-z0-9-]/g, "")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "")
  return base || `event-${Date.now()}`
}

/** Reserve a unique `events.slug` using the service-role client. */
export async function nextUniqueEventSlug(admin: SupabaseClient, title: string): Promise<string> {
  const base = slugFromEventTitle(title)
  let slug = base
  for (let i = 0; i < 5; i++) {
    const { data: existing } = await admin.from("events").select("id").eq("slug", slug).maybeSingle()
    if (!existing) return slug
    slug = `${base}-${Math.random().toString(36).slice(2, 8)}`
  }
  return `${base}-${Date.now()}`
}
