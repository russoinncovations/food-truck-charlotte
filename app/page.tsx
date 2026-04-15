import { Header } from "@/components/header"
import { Hero } from "@/components/hero"
import { FeaturedTrucks } from "@/components/featured-trucks"
import { MapPreview } from "@/components/map-preview"
import { EventsSection } from "@/components/events-section"
import { VendorCTA } from "@/components/vendor-cta"
import { Newsletter } from "@/components/newsletter"
import { Footer } from "@/components/footer"

export default function Home() {
  return (
    <main className="min-h-screen bg-background">
      <Header />
      <Hero />
      <FeaturedTrucks />
      <MapPreview />
      <EventsSection />
      <VendorCTA />
      <Newsletter />
      <Footer />
    </main>
  )
}
