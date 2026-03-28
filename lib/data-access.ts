import { trucks } from "@/data/trucks";

export function getTruckBySlug(slug: string) {
  return trucks.find((truck) => truck.slug === slug);
}

export function getTruckNames(slugs: string[]) {
  return slugs
    .map((slug) => trucks.find((truck) => truck.slug === slug)?.name)
    .filter((name): name is string => Boolean(name));
}

export const featuredTrucks = trucks.filter((truck) => truck.featured);
