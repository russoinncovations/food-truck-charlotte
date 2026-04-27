import { type FoodTruck } from "@/lib/data"
import { easternDateStringToday } from "@/lib/events/public-events"
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
  mapDisplaySource?: "live" | "upcoming" | "listed"
  scheduledStartTime?: string | null
  scheduledEndTime?: string | null
}

function buildScheduleFromRow(truck: ServingTruckRow): FoodTruck["schedule"] {
  if (!truck.scheduledStartTime) return []
  const lat = Number(truck.latitude)
  const lng = Number(truck.longitude)
  const start = String(truck.scheduledStartTime).slice(0, 5)
  const end = truck.scheduledEndTime ? String(truck.scheduledEndTime).slice(0, 5) : ""
  return [
    {
      id: `map-slot-${truck.id}`,
      date: easternDateStringToday(),
      startTime: start,
      endTime: end,
      location: truck.today_location ?? "",
      address: truck.street_address ?? "",
      lat: Number.isFinite(lat) ? lat : 0,
      lng: Number.isFinite(lng) ? lng : 0,
    },
  ]
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

    const displaySource: "live" | "upcoming" | "listed" =
      truck.mapDisplaySource ?? (truck.serving_today ? "live" : "upcoming")
    const isOpen = displaySource === "live"

    const addressParts = [truck.today_location, truck.street_address].filter(Boolean).join(" · ") || ""
    const directoryLocationHint =
      displaySource === "listed" && !hasMapPin && addressParts.trim() !== "" ? addressParts : undefined

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
      isOpen,
      isFeatured: false,
      mapDisplaySource: displaySource,
      location: hasMapPin
        ? {
            lat,
            lng,
            address: addressParts || "Charlotte area",
          }
        : undefined,
      directoryLocationHint,
      schedule: buildScheduleFromRow(truck),
      menu: [],
      socialLinks: {},
    }
  })
}
