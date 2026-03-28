export type Cuisine =
  | "Tacos"
  | "Burgers"
  | "BBQ"
  | "Desserts"
  | "Wings"
  | "Caribbean"
  | "Soul Food"
  | "Coffee";

export type VendorType = "truck" | "cart_tent";

/** Fields needed for directory cards (static data or Supabase). */
export type FoodTruckListItem = {
  slug: string;
  name: string;
  cuisine: string;
  vendor_type: VendorType;
  description: string;
  serviceArea: string;
  /** Optional hero image (e.g. Supabase `photo_url`). */
  photoUrl?: string;
  /** From Supabase `catering`; omit/false = no badge on directory card. */
  catering?: boolean;
};

export type FoodTruck = {
  slug: string;
  name: string;
  cuisine: Cuisine;
  vendor_type: VendorType;
  description: string;
  serviceArea: string;
  shortBio: string;
  menuHighlights: string[];
  eventTypesServed: string[];
  featured?: boolean;
  catering?: boolean;
};

export type TruckEvent = {
  id: string;
  title: string;
  date: string;
  location: string;
  featuredTruckSlugs: string[];
  description: string;
  featured?: boolean;
};
