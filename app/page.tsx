import { Header } from "@/components/header"
import { Hero } from "@/components/hero"
import { HomepagePrimaryPaths } from "@/components/homepage-primary-paths"
import { FeaturedTrucks } from "@/components/featured-trucks"
import { MapPreviewClient } from "@/components/map-preview-client"
import { EventsSection } from "@/components/events-section"
import { Footer } from "@/components/footer"
import { createClient } from "@/lib/supabase/server"
import { fetchMapEventMarkers, filterMapEventsForRealtimePins } from "@/lib/events/map-event-markers"
import { getMapPageTruckPinRows, getMapSidebarAllListedTruckRows } from "@/lib/map/map-page-truck-rows"
import { fetchHomepageFeaturedTrucks } from "@/lib/trucks/homepage-featured-trucks"

export default async function Home() {
  const supabase = await createClient()

  const liveTruckRows = await getMapPageTruckPinRows(supabase)
  const allListedTruckRows = await getMapSidebarAllListedTruckRows(supabase)

  const featuredTrucks = await fetchHomepageFeaturedTrucks(supabase)

  let mapPinEvents: Awaited<ReturnType<typeof fetchMapEventMarkers>> = []
  try {
    const markerRows = await fetchMapEventMarkers(supabase)
    mapPinEvents = filterMapEventsForRealtimePins(markerRows)
  } catch (error) {
    console.error("[map] fetchMapEventMarkers failed", error)
  }

  return (
    <main className="min-h-screen bg-background">
      <Header />
      <Hero />
      <HomepagePrimaryPaths />
      <FeaturedTrucks trucks={featuredTrucks} />
      <MapPreviewClient
        liveTruckRows={liveTruckRows}
        allListedTruckRows={allListedTruckRows}
        mapPinEvents={mapPinEvents}
      />
      <EventsSection />
      <Footer />
    </main>
  )
}
