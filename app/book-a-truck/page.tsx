import { Metadata } from "next"
import { Header } from "@/components/header"
import { Footer } from "@/components/footer"
import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { BookingRequestForm } from "@/components/forms/booking-request-form"
import { Check } from "lucide-react"

export const metadata: Metadata = {
  title: "Book a Food Truck | Food Truck CLT",
  description: "Book food trucks for your next event in Charlotte. Corporate events, weddings, private parties, and more.",
}

const benefits = [
  "Access to 90+ verified Charlotte food trucks",
  "Free to submit a request",
  "We match you with available trucks",
  "Direct communication with vendors",
]

export default function BookATruckPage() {
  return (
    <main className="min-h-screen bg-background">
      <Header />

      {/* Hero Section */}
      <section className="relative pt-24 pb-12 md:pt-32 md:pb-16 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-primary/5 to-transparent" />
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 relative">
          <div className="text-center max-w-3xl mx-auto">
            <Badge className="mb-4">Event Planning</Badge>
            <h1 className="font-display text-4xl md:text-5xl font-bold text-foreground mb-6 text-balance">
              Book Food Trucks for Your Event
            </h1>
            <p className="text-lg text-muted-foreground mb-6 max-w-2xl mx-auto">
              Planning a corporate event, wedding, or private party? Tell us about your event and 
              we&apos;ll connect you with the perfect food trucks.
            </p>
            <div className="flex flex-wrap justify-center gap-x-6 gap-y-2 text-sm text-muted-foreground">
              {benefits.map((benefit) => (
                <div key={benefit} className="flex items-center gap-2">
                  <Check className="h-4 w-4 text-primary" />
                  <span>{benefit}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Form Section */}
      <section className="py-12 md:py-16">
        <div className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8">
          <Card className="p-6 md:p-8">
            <BookingRequestForm />
          </Card>
        </div>
      </section>

      <Footer />
    </main>
  )
}
