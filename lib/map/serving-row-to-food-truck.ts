import { type FoodTruck } from "@/lib/data"
import { isValidTruckMapCoordinates } from "@/lib/location/truck-map-coords"

export type ServingTruckRow = {
  id: string
  name: string
  slug: string | null
  cuisine: string | string[] | null
  latitude: number | string | null
  longitude: number | string | null
  serving_today: boolean | null
  today_location: string | null
  street_address: string | null
  today_specials: string | null
}

export function mapRowsToMapTrucks(rows: ServingTruckRow[]): FoodTruck[] {
  return rows.map((truck) => {
    const lat = Number(truck.latitude)
    const lng = Number(truck.longitude)
    const hasMapPin = isValidTruckMapCoordinates(lat, lng)
    const cuisine = Array.isArray(truck.cuisine)
      ? truck.cuisine
      : truck.cuisine
        ? [truck.cuisine]
        : []
    const fallbackSlug =
      truck.name
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/(^-|-$)/g, "") || truck.id
    const slug =
      truck.slug && String(truck.slug).trim() !== "" ? String(truck.slug).trim() : fallbackSlug

    return {
      id: truck.id,
      name: truck.name,
      slug,
      cuisine,
      description: "",
      image: "/images/truck-tacos.jpg",
      rating: 0,
      reviewCount: 0,
      priceRange: "$",
      isOpen: Boolean(truck.serving_today),
      isFeatured: false,
      location: hasMapPin
        ? {
            lat,
            lng,
            address: [truck.today_location, truck.street_address].filter(Boolean).join(" · ") || "",
          }
        : undefined,
      schedule: [],
      menu: [],
      socialLinks: {},
    }
  })
}
