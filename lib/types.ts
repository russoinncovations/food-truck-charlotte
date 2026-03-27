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
