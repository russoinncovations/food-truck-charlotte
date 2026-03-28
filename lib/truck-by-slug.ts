import { getSupabase } from "@/lib/supabase";
import type { VendorType } from "@/lib/types";

export type TruckDetailRow = {
  slug: string;
  name: string;
  cuisine: string | null;
  vendor_type: string | null;
  description: string | null;
  service_areas: string | null;
  website: string | null;
  instagram: string | null;
  email: string | null;
  photo_url: string | null;
};

function normalizeVendorType(value: string | null | undefined): VendorType {
  if (value === "cart_tent") return "cart_tent";
  return "truck";
}

export type TruckDetail = {
  slug: string;
  name: string;
  cuisine: string;
  vendor_type: VendorType;
  description: string;
  serviceArea: string;
  photoUrl?: string;
  website: string | null;
  instagram: string | null;
  email: string | null;
};

function mapRow(row: TruckDetailRow): TruckDetail {
  const photo = (row.photo_url ?? "").trim();
  return {
    slug: row.slug,
    name: row.name,
    cuisine: (row.cuisine ?? "").trim() || "General",
    vendor_type: normalizeVendorType(row.vendor_type),
    description: (row.description ?? "").trim(),
    serviceArea: (row.service_areas ?? "").trim(),
    website: row.website?.trim() || null,
    instagram: row.instagram?.trim() || null,
    email: row.email?.trim() || null,
    ...(photo ? { photoUrl: photo } : {}),
  };
}

export async function fetchActiveTruckBySlug(slug: string): Promise<TruckDetail | null> {
  const client = getSupabase();
  if (!client) {
    return null;
  }

  const { data, error } = await client
    .from("trucks")
    .select("*")
    .eq("slug", slug)
    .eq("active", true)
    .maybeSingle();

  if (error) {
    console.error("[trucks] fetch by slug failed:", error.message);
    return null;
  }

  if (!data) {
    return null;
  }

  return mapRow(data as TruckDetailRow);
}
