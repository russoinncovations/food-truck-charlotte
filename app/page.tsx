import { Header } from "@/components/header"
import { Hero } from "@/components/hero"
import { FeaturedTrucks } from "@/components/featured-trucks"
import { MapPreviewClient } from "@/components/map-preview-client"
import { EventsSection } from "@/components/events-section"
import { VendorCTA } from "@/components/vendor-cta"
import { Footer } from "@/components/footer"
import { createClient } from "@/lib/supabase/server"
import { countUpcomingPublicEvents } from "@/lib/events/public-events"
import { fetchMapEventMarkers } from "@/lib/events/map-event-markers"
import { getPublicMapLiveTruckRows } from "@/lib/map/load-map-display-trucks"

export default async function Home() {
  const supabase = await createClient()
  const upcomingEventCount = await countUpcomingPublicEvents(supabase)

  const displayTrucks = await getPublicMapLiveTruckRows(supabase)

  let mapEvents: Awaited<ReturnType<typeof fetchMapEventMarkers>> = []
  try {
    mapEvents = await fetchMapEventMarkers(supabase)
  } catch (error) {
    console.error("[map] fetchMapEventMarkers failed", error)
  }

  return (
    <main className="min-h-screen bg-background">
      <Header />
      <Hero upcomingEventCount={upcomingEventCount} />
      <FeaturedTrucks />
      <MapPreviewClient trucks={displayTrucks} mapEvents={mapEvents} />
      <EventsSection />
      <VendorCTA />
      <Footer />
    </main>
  )
}
