import { Header } from "@/components/header"
import { Hero } from "@/components/hero"
import { FeaturedTrucks } from "@/components/featured-trucks"
import { MapPreviewClient } from "@/components/map-preview-client"
import { EventsSection } from "@/components/events-section"
import { VendorCTA } from "@/components/vendor-cta"
import { Footer } from "@/components/footer"
import { createClient } from "@/lib/supabase/server"
import { countUpcomingPublicEvents } from "@/lib/events/public-events"
import { fetchMapEventMarkers, filterMapEventsForRealtimePins } from "@/lib/events/map-event-markers"
import { getMapPageTruckPinRows, getMapSidebarAllListedTruckRows } from "@/lib/map/map-page-truck-rows"
import { countPublicDirectoryTrucks } from "@/lib/trucks/public-directory"

export default async function Home() {
  const supabase = await createClient()
  const upcomingEventCount = await countUpcomingPublicEvents(supabase)
  const directoryTruckCount = await countPublicDirectoryTrucks(supabase)

  const liveTruckRows = await getMapPageTruckPinRows(supabase)
  const allListedTruckRows = await getMapSidebarAllListedTruckRows(supabase)

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
      <Hero upcomingEventCount={upcomingEventCount} directoryTruckCount={directoryTruckCount} />
      <FeaturedTrucks />
      <MapPreviewClient
        liveTruckRows={liveTruckRows}
        allListedTruckRows={allListedTruckRows}
        mapPinEvents={mapPinEvents}
      />
      <EventsSection />
      <VendorCTA directoryTruckCount={directoryTruckCount} />
      <Footer />
    </main>
  )
}
