import { Metadata } from "next"
import { notFound } from "next/navigation"
import { Header } from "@/components/header"
import { Footer } from "@/components/footer"
import { TruckProfileView } from "@/components/trucks/truck-profile-view"
import { createClient } from "@/lib/supabase/server"
import { fetchUpcomingPublicStopsForTruck } from "@/lib/schedule/scheduled-stop-map"
import { PUBLIC_LISTED_TRUCK_EQ } from "@/lib/trucks/public-listed-truck-query"
import { getTruckDisplayImage } from "@/lib/trucks/truck-display-image"
import {
  aboutTextFromRow,
  cuisineTagsFromRow,
  parseMenuHighlights,
  serviceAreaLabelFromRow,
  type TruckProfileData,
  type TruckProfilePhoto,
} from "@/lib/trucks/truck-profile-helpers"

interface Props {
  params: Promise<{ slug: string }>
}

const TRUCK_PROFILE_SELECT =
  "id, name, slug, tagline, short_description, description, full_description, cuisine, cuisine_types, base_city, service_areas, website, instagram, facebook, phone, booking_phone, serving_today, today_location, street_address, price_range, photo_url, hero_photo_url, today_specials, catering"

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug: rawSlug } = await params
  const slug = (rawSlug ?? "").trim()
  if (!slug) {
    return { title: "Truck Not Found | FoodTruck CLT" }
  }

  const supabase = await createClient()
  const { data: truck, error } = await supabase
    .from("trucks")
    .select("name, short_description, description, full_description, tagline, cuisine_types")
    .eq("slug", slug)
    .eq("show_in_directory", PUBLIC_LISTED_TRUCK_EQ.show_in_directory)
    .eq("is_active", PUBLIC_LISTED_TRUCK_EQ.is_active)
    .eq("status", PUBLIC_LISTED_TRUCK_EQ.status)
    .maybeSingle()

  if (error || !truck) {
    return { title: "Truck Not Found | FoodTruck CLT" }
  }

  const description =
    aboutTextFromRow(truck as Record<string, unknown>) ??
    (typeof truck.tagline === "string" ? truck.tagline : "") ??
    ""

  const truckNameMeta =
    typeof truck.name === "string" && truck.name.trim() ? truck.name.trim() : "Food truck"

  return {
    title: `${truckNameMeta} | FoodTruck CLT`,
    description: description || `${truckNameMeta} — Charlotte food truck on FoodTruckCLT`,
  }
}

export default async function TruckProfilePage({ params }: Props) {
  const { slug: rawSlug } = await params
  const slug = (rawSlug ?? "").trim()
  if (!slug) {
    notFound()
  }

  const supabase = await createClient()
  const { data: truck, error } = await supabase
    .from("trucks")
    .select(TRUCK_PROFILE_SELECT)
    .eq("slug", slug)
    .eq("show_in_directory", PUBLIC_LISTED_TRUCK_EQ.show_in_directory)
    .eq("is_active", PUBLIC_LISTED_TRUCK_EQ.is_active)
    .eq("status", PUBLIC_LISTED_TRUCK_EQ.status)
    .maybeSingle()

  if (error || !truck) {
    if (error) console.error("[trucks/slug]", slug, error.message)
    notFound()
  }

  const row = truck as Record<string, unknown>
  const truckId = String(row.id ?? "").trim()
  if (!truckId) notFound()

  const name =
    typeof row.name === "string" && row.name.trim()
      ? row.name.trim()
      : slug.replace(/-/g, " ").replace(/\b\w/g, (c) => c.toUpperCase())

  const rawPhone = typeof row.phone === "string" ? row.phone.trim() : ""
  const rawBooking = typeof row.booking_phone === "string" ? row.booking_phone.trim() : ""

  const upcomingStops = await fetchUpcomingPublicStopsForTruck(supabase, truckId, 8)
  const menuHighlights = parseMenuHighlights(
    row.today_specials as string | null,
    upcomingStops.map((s) => s.menu_note)
  )

  let galleryPhotos: TruckProfilePhoto[] = []
  const { data: photoRows } = await supabase
    .from("truck_photos")
    .select("id, photo_url, alt_text")
    .eq("truck_id", truckId)
    .order("sort_order", { ascending: true })
    .limit(9)

  if (photoRows?.length) {
    galleryPhotos = photoRows.map((p) => ({
      id: String(p.id),
      photo_url: String(p.photo_url),
      alt_text: (p.alt_text as string | null) ?? null,
    }))
  }

  const profile: TruckProfileData = {
    id: truckId,
    name,
    slug,
    tagline: (row.tagline as string | null) ?? null,
    cuisineTags: cuisineTagsFromRow(row as { cuisine_types?: string[] | null; cuisine?: string | null }),
    serviceAreaLabel: serviceAreaLabelFromRow(row as { base_city?: string | null; service_areas?: string | null }),
    priceRange: (row.price_range as string | null) ?? null,
    aboutText: aboutTextFromRow(row),
    menuHighlights,
    hasMenuData: menuHighlights.length > 0,
    servingToday: row.serving_today === true,
    todayLocation: (row.today_location as string | null) ?? null,
    streetAddress: (row.street_address as string | null) ?? null,
    website: (row.website as string | null) ?? null,
    instagram: (row.instagram as string | null) ?? null,
    facebook: (row.facebook as string | null) ?? null,
    phone: rawPhone || rawBooking || null,
    heroImageUrl: getTruckDisplayImage(
      truckId,
      row.photo_url as string | null,
      row.hero_photo_url as string | null
    ),
    galleryPhotos,
    upcomingStops,
    catering: row.catering === true,
  }

  return (
    <>
      <Header />
      <TruckProfileView profile={profile} />
      <Footer />
    </>
  )
}
