import { type FoodTruck } from "@/lib/data"
import { easternDateStringToday } from "@/lib/events/public-events"
import { isValidTruckMapCoordinates } from "@/lib/location/truck-map-coords"
import { isFreshManualLivePin } from "@/lib/serving/manual-live-pin"
import { getTruckDisplayImage, pickTruckMarkerImageUrl } from "@/lib/trucks/truck-display-image"

export type ServingTruckRow = {
  id: string
  name: string
  slug: string | null
  cuisine: string | string[] | null
  cuisine_types?: string[] | null
  latitude: number | string | null
  longitude: number | string | null
  serving_today: boolean | null
  serving_started_at?: string | null
  today_location: string | null
  street_address: string | null
  today_specials: string | null
  photo_url?: string | null
  hero_photo_url?: string | null
  logo_url?: string | null
  mapDisplaySource?: "live" | "scheduled" | "upcoming" | "listed"
  scheduledStartTime?: string | null
  scheduledEndTime?: string | null
  scheduledStopId?: string | null
  scheduledStopDate?: string | null
  scheduledMenuNote?: string | null
  scheduledIsPublic?: boolean | null
}

function buildScheduleFromRow(truck: ServingTruckRow): FoodTruck["schedule"] {
  if (!truck.scheduledStartTime) return []
  const lat = Number(truck.latitude)
  const lng = Number(truck.longitude)
  const start = String(truck.scheduledStartTime).slice(0, 5)
  const end = truck.scheduledEndTime ? String(truck.scheduledEndTime).slice(0, 5) : ""
  const date = truck.scheduledStopDate ?? easternDateStringToday()
  return [
    {
      id: truck.scheduledStopId ?? `map-slot-${truck.id}`,
      date,
      startTime: start,
      endTime: end,
      location: truck.today_location ?? "",
      address: truck.street_address ?? "",
      lat: Number.isFinite(lat) ? lat : 0,
      lng: Number.isFinite(lng) ? lng : 0,
      menuNote: truck.scheduledMenuNote ?? undefined,
      isPublic: truck.scheduledIsPublic ?? true,
    },
  ]
}

function cuisineLabelsForMap(truck: ServingTruckRow): string[] {
  const fromTypes = Array.isArray(truck.cuisine_types)
    ? truck.cuisine_types.map((x) => String(x ?? "").trim()).filter(Boolean)
    : []
  if (fromTypes.length > 0) return fromTypes
  const raw = truck.cuisine
  return Array.isArray(raw) ? raw.filter(Boolean).map(String) : raw ? [String(raw)] : []
}

export function mapRowsToMapTrucks(rows: ServingTruckRow[]): FoodTruck[] {
  return rows.map((truck) => {
    const lat = Number(truck.latitude)
    const lng = Number(truck.longitude)
    const hasMapPin = isValidTruckMapCoordinates(lat, lng)
    const cuisine = cuisineLabelsForMap(truck)
    const markerPhotoUrl = pickTruckMarkerImageUrl(truck.photo_url, truck.hero_photo_url, truck.logo_url)
    const fallbackSlug =
      truck.name
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/(^-|-$)/g, "") || truck.id
    const slug =
      truck.slug && String(truck.slug).trim() !== "" ? String(truck.slug).trim() : fallbackSlug

    const displaySource: "live" | "scheduled" | "upcoming" | "listed" =
      truck.mapDisplaySource ?? (isFreshManualLivePin(truck) ? "live" : "upcoming")
    const isOpen = displaySource === "live"
    const mapPinStatus: FoodTruck["mapPinStatus"] =
      displaySource === "live"
        ? "live"
        : displaySource === "scheduled"
          ? "scheduled"
          : "listed"

    const addressParts = [truck.today_location, truck.street_address].filter(Boolean).join(" · ") || ""
    const directoryLocationHint =
      displaySource === "listed" && !hasMapPin && addressParts.trim() !== "" ? addressParts : undefined

    return {
      id: truck.scheduledStopId ? `${truck.id}__${truck.scheduledStopId}` : truck.id,
      name: truck.name,
      slug,
      cuisine,
      description: "",
      image: getTruckDisplayImage(truck.id, truck.photo_url, truck.hero_photo_url),
      markerPhotoUrl,
      rating: 0,
      reviewCount: 0,
      priceRange: "$",
      isOpen,
      isFeatured: false,
      mapDisplaySource: displaySource,
      mapPinStatus,
      scheduledStopDate: truck.scheduledStopDate ?? undefined,
      scheduledStartTime: truck.scheduledStartTime ?? undefined,
      scheduledEndTime: truck.scheduledEndTime ?? undefined,
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
