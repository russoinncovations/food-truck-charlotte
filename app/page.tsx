import { Header } from "@/components/header"
import { Hero } from "@/components/hero"
import { FeaturedTrucks } from "@/components/featured-trucks"
import { MapPreviewClient } from "@/components/map-preview-client"
import { EventsSection } from "@/components/events-section"
import { VendorCTA } from "@/components/vendor-cta"
import { Footer } from "@/components/footer"
import { createClient } from "@/lib/supabase/server"
import { countUpcomingPublicEvents } from "@/lib/events/public-events"

export default async function Home() {
  const supabase = await createClient()
  const upcomingEventCount = await countUpcomingPublicEvents(supabase)

  return (
    <main className="min-h-screen bg-background">
      <Header />
      <Hero upcomingEventCount={upcomingEventCount} />
      <FeaturedTrucks />
      <MapPreviewClient />
      <EventsSection />
      <VendorCTA />
      <Footer />
    </main>
  )
}
