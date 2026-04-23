import { Header } from "@/components/header"
import { Hero } from "@/components/hero"
import { FeaturedTrucks } from "@/components/featured-trucks"
import { MapPreviewClient } from "@/components/map-preview-client"
import { EventsSection } from "@/components/events-section"
import { VendorCTA } from "@/components/vendor-cta"
import { Footer } from "@/components/footer"

export default function Home() {
  return (
    <main className="min-h-screen bg-background">
      <Header />
      <Hero />
      <FeaturedTrucks />
      <MapPreviewClient />
      <EventsSection />
      <VendorCTA />
      <Footer />
    </main>
  )
}
