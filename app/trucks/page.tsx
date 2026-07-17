import type { Metadata } from "next"
import { Header } from "@/components/header"
import { Footer } from "@/components/footer"
import { createClient } from "@/lib/supabase/server"
import { countPublicDirectoryTrucks } from "@/lib/trucks/public-directory"
import { PUBLIC_LISTED_TRUCK_EQ } from "@/lib/trucks/public-listed-truck-query"
import {
  isValidCuisineFilter,
  isValidVendorFormatFilter,
} from "@/lib/trucks/directory-filters"
import { TrucksDirectoryClient, type DirectoryTruckRow } from "@/components/trucks/trucks-directory-client"

export async function generateMetadata(): Promise<Metadata> {
  const supabase = await createClient()
  const n = await countPublicDirectoryTrucks(supabase)
  const suffix =
    n > 0 ? `Browse ${n} amazing food trucks serving Charlotte.` : `Growing list of Charlotte food trucks.`
  return {
    title: "Explore Charlotte Food Trucks | FoodTruck CLT",
    description: `Browse local vendors, cuisines, and book Charlotte-area food trucks. ${suffix}`,
  }
}

type SearchParams = Promise<{
  q?: string
  cuisine?: string
  format?: string
}>

export default async function TrucksPage({ searchParams }: { searchParams: SearchParams }) {
  const sp = await searchParams
  const supabase = await createClient()
  const { data: trucks } = await supabase
    .from("trucks")
    .select(
      "id, name, cuisine, cuisine_types, slug, serving_today, today_location, show_in_directory, photo_url, catering, vendor_type, description, short_description, full_description, today_specials, tagline"
    )
    .eq("show_in_directory", PUBLIC_LISTED_TRUCK_EQ.show_in_directory)
    .eq("status", PUBLIC_LISTED_TRUCK_EQ.status)
    .eq("is_active", PUBLIC_LISTED_TRUCK_EQ.is_active)
    .order("name")

  const rows: DirectoryTruckRow[] = (trucks ?? []).map((t) => ({
    id: t.id as string,
    name: t.name as string,
    slug: t.slug as string,
    cuisine: (t.cuisine as string | null) ?? null,
    cuisine_types: (t.cuisine_types as string[] | null) ?? null,
    serving_today: (t.serving_today as boolean | null) ?? null,
    today_location: (t.today_location as string | null) ?? null,
    photo_url: (t.photo_url as string | null) ?? null,
    catering: (t.catering as boolean | null) ?? null,
    vendor_type: (t.vendor_type as string | null) ?? null,
    description: (t.description as string | null) ?? null,
    short_description: (t.short_description as string | null) ?? null,
    full_description: (t.full_description as string | null) ?? null,
    today_specials: (t.today_specials as string | null) ?? null,
    tagline: (t.tagline as string | null) ?? null,
  }))

  const initialQuery = typeof sp.q === "string" ? sp.q : ""
  const initialCuisine = isValidCuisineFilter(sp.cuisine) ? sp.cuisine : ""
  const initialFormat = isValidVendorFormatFilter(sp.format) ? sp.format : ""

  return (
    <main className="min-h-screen bg-background">
      <Header />
      <TrucksDirectoryClient
        trucks={rows}
        initialQuery={initialQuery}
        initialCuisine={initialCuisine}
        initialFormat={initialFormat}
      />
      <Footer />
    </main>
  )
}
