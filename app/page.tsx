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
import { getMapPageTruckPinRows } from "@/lib/map/map-page-truck-rows"
import { countPublicDirectoryTrucks } from "@/lib/trucks/public-directory"

export default async function Home() {
  const supabase = await createClient()
  const upcomingEventCount = await countUpcomingPublicEvents(supabase)
  const directoryTruckCount = await countPublicDirectoryTrucks(supabase)

  const displayTrucks = await getMapPageTruckPinRows(supabase)

  let sidebarMapEvents: Awaited<ReturnType<typeof fetchMapEventMarkers>> = []
  try {
    sidebarMapEvents = await fetchMapEventMarkers(supabase)
  } catch (error) {
    console.error("[map] fetchMapEventMarkers failed", error)
  }
  const mapPinEvents = filterMapEventsForRealtimePins(sidebarMapEvents)

  return (
    <main className="min-h-screen bg-background">
      <Header />
      <Hero upcomingEventCount={upcomingEventCount} directoryTruckCount={directoryTruckCount} />
      <FeaturedTrucks />
      <MapPreviewClient
        trucks={displayTrucks}
        sidebarMapEvents={sidebarMapEvents}
        mapPinEvents={mapPinEvents}
      />
      <EventsSection />
      <VendorCTA directoryTruckCount={directoryTruckCount} />
      <Footer />
    </main>
  )
}
