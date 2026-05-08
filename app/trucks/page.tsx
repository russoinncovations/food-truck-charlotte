import type { Metadata } from "next"
import { Header } from "@/components/header"
import { Footer } from "@/components/footer"
import { createClient } from "@/lib/supabase/server"
import { countPublicDirectoryTrucks } from "@/lib/trucks/public-directory"
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

export default async function TrucksPage() {
  const supabase = await createClient()
  const { data: trucks } = await supabase
    .from("trucks")
    .select("id, name, cuisine, cuisine_types, slug, serving_today, today_location, show_in_directory, photo_url, catering")
    .eq("show_in_directory", true)
    .eq("status", "active")
    .eq("is_active", true)
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
  }))

  return (
    <main className="min-h-screen bg-background">
      <Header />
      <TrucksDirectoryClient trucks={rows} />
      <Footer />
    </main>
  )
}
