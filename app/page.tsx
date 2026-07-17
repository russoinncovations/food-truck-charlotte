import { Header } from "@/components/header"
import { Hero } from "@/components/hero"
import { HomepageProofStrip } from "@/components/homepage-proof-strip"
import { HowItWorks } from "@/components/how-it-works"
import { FeaturedTrucks } from "@/components/featured-trucks"
import { HomepageUseCases } from "@/components/homepage-use-cases"
import { MapPreviewClient } from "@/components/map-preview-client"
import { HomepageTestimonials } from "@/components/homepage-testimonials"
import { VendorCTA } from "@/components/vendor-cta"
import { Footer } from "@/components/footer"
import { createClient } from "@/lib/supabase/server"
import { fetchMapEventMarkers, filterMapEventsForRealtimePins } from "@/lib/events/map-event-markers"
import { getMapPageTruckPinRows, getMapSidebarAllListedTruckRows } from "@/lib/map/map-page-truck-rows"
import { fetchHomepageFeaturedTrucks } from "@/lib/trucks/homepage-featured-trucks"
import { countPublicDirectoryTrucks } from "@/lib/trucks/public-directory"

export default async function Home() {
  const supabase = await createClient()
  const directoryTruckCount = await countPublicDirectoryTrucks(supabase)

  const liveTruckRows = await getMapPageTruckPinRows(supabase)
  const allListedTruckRows = await getMapSidebarAllListedTruckRows(supabase)

  const featuredTrucks = await fetchHomepageFeaturedTrucks(supabase, 6)

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
      <HomepageProofStrip />
      <HowItWorks />
      <FeaturedTrucks trucks={featuredTrucks} />
      <HomepageUseCases />
      <MapPreviewClient
        liveTruckRows={liveTruckRows}
        allListedTruckRows={allListedTruckRows}
        mapPinEvents={mapPinEvents}
      />
      <HomepageTestimonials />
      <VendorCTA directoryTruckCount={directoryTruckCount} />
      <Footer />
    </main>
  )
}
