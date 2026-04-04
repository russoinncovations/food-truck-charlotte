import { getSupabase } from "@/lib/supabase";
import type { FoodTruckListItem, VendorType } from "@/lib/types";

type TrucksRow = {
  slug: string;
  name: string;
  cuisine: string | null;
  vendor_type: string | null;
  description: string | null;
  service_areas: string | null;
  photo_url: string | null;
  catering: boolean | null;
  instagram: string | null;
  website: string | null;
  /** Present when `facebook` column exists on `trucks`. */
  facebook?: string | null;
};

function normalizeVendorType(value: string | null | undefined): VendorType {
  if (value === "cart_tent") return "cart_tent";
  return "truck";
}

function rowToListItem(row: TrucksRow): FoodTruckListItem {
  const photoUrl = (row.photo_url ?? "").trim();
  const instagram = row.instagram?.trim() || null;
  const facebook = row.facebook?.trim() || null;
  const website = row.website?.trim() || null;
  return {
    slug: row.slug,
    name: row.name,
    cuisine: (row.cuisine ?? "").trim() || "General",
    vendor_type: normalizeVendorType(row.vendor_type),
    description: (row.description ?? "").trim(),
    serviceArea: (row.service_areas ?? "").trim(),
    ...(photoUrl ? { photoUrl } : {}),
    ...(row.catering === true ? { catering: true } : {}),
    ...(instagram ? { instagram } : {}),
    ...(facebook ? { facebook } : {}),
    ...(website ? { website } : {}),
  };
}

/** Map raw `trucks` rows from Supabase into {@link FoodTruckListItem} for cards. */
export function toTruckListItems(rows: unknown): FoodTruckListItem[] {
  if (!Array.isArray(rows) || rows.length === 0) {
    return [];
  }
  return rows.map((row) => rowToListItem(row as TrucksRow));
}

/**
 * Fetches directory-listed trucks (active + show_in_directory) from Supabase (featured first, then oldest first).
 * Returns [] if the client is not configured, the query fails, or there are no rows (caller uses static fallback when empty).
 */
export async function fetchDirectoryTrucksFromSupabase(): Promise<FoodTruckListItem[]> {
  const supabase = getSupabase();
  if (!supabase) {
    return [];
  }

  const { data, error } = await supabase
    .from("trucks")
    .select("*")
    .eq("active", true)
    .eq("show_in_directory", true)
    .order("featured", { ascending: false })
    .order("created_at", { ascending: true });

  if (error) {
    console.error("[trucks] Supabase directory fetch failed:", error.message);
    return [];
  }

  if (!data?.length) {
    return [];
  }

  return (data as TrucksRow[]).map(rowToListItem);
}
