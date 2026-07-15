import type { Metadata } from "next"
import { Header } from "@/components/header"
import { Footer } from "@/components/footer"
import { Card } from "@/components/ui/card"
import { BookingRequestForm } from "@/components/forms/booking-request-form"
import { createClient } from "@/lib/supabase/server"
import { countPublicDirectoryTrucks } from "@/lib/trucks/public-directory"

export async function generateMetadata(): Promise<Metadata> {
  const supabase = await createClient()
  const n = await countPublicDirectoryTrucks(supabase)
  const listingDescriptor =
    n > 0 ? `${n} active Charlotte food trucks on the platform.` : `Growing list of Charlotte food trucks.`
  return {
    title: "Book Food Trucks for Your Event | Food Truck CLT",
    description: `Submit an event request and connect with Charlotte food trucks. ${listingDescriptor}`,
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

  const { data: directoryTrucks } = await supabase
    .from("trucks")
    .select("id, name")
    .eq("show_in_directory", true)
    .order("name", { ascending: true })

  return (
    <main className="min-h-screen bg-background">
      <Header />

      <section className="relative pt-24 pb-8 md:pt-32 md:pb-10 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-primary/5 to-transparent" />
        <div className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8 relative text-center">
          <h1 className="font-display text-4xl md:text-5xl font-bold text-foreground mb-4 text-balance">
            Book Food Trucks for Your Event
          </h1>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto leading-relaxed">
            Share a few details about your event and FoodTruckCLT will notify local trucks that may be a fit.
            Interested trucks can contact you directly.
          </p>
          <p className="mt-3 text-sm text-muted-foreground">No account required.</p>
        </div>
      </section>

      <section className="py-8 md:py-12">
        <div className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8">
          <Card className="p-6 md:p-8">
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
