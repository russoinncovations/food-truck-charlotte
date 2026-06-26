import type { Metadata } from "next"
import { Header } from "@/components/header"
import { Footer } from "@/components/footer"
import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { BookingRequestForm } from "@/components/forms/booking-request-form"
import { Check } from "lucide-react"
import { createClient } from "@/lib/supabase/server"
import { countPublicDirectoryTrucks } from "@/lib/trucks/public-directory"

export async function generateMetadata(): Promise<Metadata> {
  const supabase = await createClient()
  const n = await countPublicDirectoryTrucks(supabase)
  const listingDescriptor =
    n > 0 ? `${n} active Charlotte food trucks on the platform.` : `Growing list of Charlotte food trucks.`
  return {
    title: "Book a Food Truck | Food Truck CLT",
    description: `Book food trucks for your next event in Charlotte. Corporate events, weddings, private parties, and more. ${listingDescriptor}`,
  }
}

export default async function BookATruckPage({
  searchParams,
}: {
  searchParams: Promise<{ truck?: string }>
}) {
  const { truck: truckParam } = await searchParams
  const preselectedTruckId = truckParam?.trim() || null

  const supabase = await createClient()
  const directoryCount = await countPublicDirectoryTrucks(supabase)

  const benefits = [
    directoryCount > 0
      ? `Access ${directoryCount} Charlotte food trucks listed on the platform`
      : `Growing list of Charlotte food vendors`,
    "Free to submit a request",
    "Relevant local trucks can respond directly",
    "Direct communication with vendors",
  ]
  const { data: directoryTrucks } = await supabase
    .from("trucks")
    .select("id, name")
    .eq("show_in_directory", true)
    .order("name", { ascending: true })

  return (
    <main className="min-h-screen bg-background">
      <Header />

      {/* Hero Section */}
      <section className="relative overflow-hidden bg-[#faf6f2] pt-24 pb-8 md:pt-28 md:pb-10">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 relative">
          <div className="text-center max-w-3xl mx-auto">
            <Badge variant="outline" className="mb-4 bg-background/70 text-xs font-semibold uppercase tracking-wide">
              Event Requests
            </Badge>
            <h1 className="font-display text-3xl md:text-5xl font-bold leading-tight text-foreground mb-4 text-balance">
              Connect With Food Trucks for Your Event
            </h1>
            <p className="text-base leading-7 text-muted-foreground mb-5 max-w-2xl mx-auto md:text-lg">
              Planning a corporate event, wedding, or private party? Share what you need and connect
              directly with Charlotte-area food trucks.
            </p>
            <div className="flex flex-wrap justify-center gap-x-5 gap-y-2 text-sm text-muted-foreground">
              {benefits.map((benefit, i) => (
                <div key={`benefit-${i}`} className="flex items-center gap-2">
                  <Check className="h-4 w-4 text-primary" />
                  <span>{benefit}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Form Section */}
      <section className="py-8 md:py-12">
        <div className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8">
          <Card className="border-2 border-primary/15 p-5 shadow-xl shadow-foreground/5 md:p-8">
            <BookingRequestForm
              directoryTrucks={directoryTrucks ?? []}
              preselectedTruckId={preselectedTruckId}
            />
          </Card>
        </div>
      </section>

      <Footer />
    </main>
  )
}
