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
};

function normalizeVendorType(value: string | null | undefined): VendorType {
  if (value === "cart_tent") return "cart_tent";
  return "truck";
}

function rowToListItem(row: TrucksRow): FoodTruckListItem {
  const photoUrl = (row.photo_url ?? "").trim();
  return {
    slug: row.slug,
    name: row.name,
    cuisine: (row.cuisine ?? "").trim() || "General",
    vendor_type: normalizeVendorType(row.vendor_type),
    description: (row.description ?? "").trim(),
    serviceArea: (row.service_areas ?? "").trim(),
    ...(photoUrl ? { photoUrl } : {}),
    ...(row.catering === true ? { catering: true } : {}),
  };
}

/**
 * Fetches active trucks from Supabase (featured first, then oldest first).
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
