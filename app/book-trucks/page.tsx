import { Metadata } from "next"
import Link from "next/link"
import { Header } from "@/components/header"
import { Footer } from "@/components/footer"
import { BookingForm } from "@/components/booking-form"
import { CheckCircle2, Clock, Truck, MessageSquare } from "lucide-react"
import { createClient } from "@/lib/supabase/server"

export const metadata: Metadata = {
  title: "Book a Food Truck | Food Truck CLT",
  description: "Book food trucks for your Charlotte event. Corporate events, weddings, private parties, and more. Free to request, no commitment.",
}

const benefits = [
  {
    icon: Truck,
    title: "90+ trucks to choose from",
    description: "Access to Charlotte's largest network of vetted food trucks",
  },
  {
    icon: MessageSquare,
    title: "One request, multiple options",
    description: "We reach out to trucks on your behalf and bring you options",
  },
  {
    icon: Clock,
    title: "Quick response time",
    description: "Most requests get responses within 24-48 hours",
  },
  {
    icon: CheckCircle2,
    title: "No commitment required",
    description: "Free to submit, no obligation until you confirm",
  },
]

export default async function BookTrucksPage() {
  const supabase = await createClient()
  const { data: directoryTrucks } = await supabase
    .from("trucks")
    .select("id, name")
    .eq("show_in_directory", true)
    .order("name", { ascending: true })

  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      <main className="pt-24 pb-16">
        {/* Hero Section */}
        <div className="bg-gradient-to-b from-primary/5 to-background">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-12">
            <div className="text-center max-w-2xl mx-auto mb-8">
              <h1 className="font-display text-3xl sm:text-4xl font-bold text-foreground mb-4">
                Book food trucks for your event
              </h1>
              <p className="text-lg text-muted-foreground">
                Tell us about your event and we&apos;ll connect you with the perfect trucks. 
                Free to request, no commitment until you&apos;re ready.
              </p>
            </div>

            {/* Benefits */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 max-w-4xl mx-auto mb-12">
              {benefits.map((benefit) => (
                <div key={benefit.title} className="text-center p-4">
                  <div className="inline-flex items-center justify-center w-10 h-10 rounded-full bg-primary/10 text-primary mb-3">
                    <benefit.icon className="h-5 w-5" />
                  </div>
                  <h3 className="text-sm font-medium text-foreground mb-1">{benefit.title}</h3>
                  <p className="text-xs text-muted-foreground">{benefit.description}</p>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Form Section */}
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <BookingForm directoryTrucks={directoryTrucks ?? []} />
        </div>

        {/* FAQ / Trust Section */}
        <div className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8 mt-16">
          <div className="bg-muted/30 rounded-2xl p-6 sm:p-8">
            <h2 className="font-display text-xl font-semibold text-foreground mb-4">
              How it works
            </h2>
            <ol className="space-y-4">
              <li className="flex gap-4">
                <span className="flex-shrink-0 w-6 h-6 rounded-full bg-primary text-primary-foreground text-sm font-medium flex items-center justify-center">
                  1
                </span>
                <div>
                  <p className="font-medium text-foreground">Submit your request</p>
                  <p className="text-sm text-muted-foreground">
                    Fill out the form above with your event details. Takes about 2 minutes.
                  </p>
                </div>
              </li>
              <li className="flex gap-4">
                <span className="flex-shrink-0 w-6 h-6 rounded-full bg-primary text-primary-foreground text-sm font-medium flex items-center justify-center">
                  2
                </span>
                <div>
                  <p className="font-medium text-foreground">We find matching trucks</p>
                  <p className="text-sm text-muted-foreground">
                    We reach out to trucks that match your preferences and are available on your date.
                  </p>
                </div>
              </li>
              <li className="flex gap-4">
                <span className="flex-shrink-0 w-6 h-6 rounded-full bg-primary text-primary-foreground text-sm font-medium flex items-center justify-center">
                  3
                </span>
                <div>
                  <p className="font-medium text-foreground">Review your options</p>
                  <p className="text-sm text-muted-foreground">
                    We&apos;ll email you with interested trucks, their menus, and pricing.
                  </p>
                </div>
              </li>
              <li className="flex gap-4">
                <span className="flex-shrink-0 w-6 h-6 rounded-full bg-primary text-primary-foreground text-sm font-medium flex items-center justify-center">
                  4
                </span>
                <div>
                  <p className="font-medium text-foreground">Book directly with the truck</p>
                  <p className="text-sm text-muted-foreground">
                    Once you pick a truck, you&apos;ll work with them directly to finalize details.
                  </p>
                </div>
              </li>
            </ol>

            <div className="mt-6 pt-6 border-t border-border">
              <p className="text-sm text-muted-foreground">
                Questions? Reach out to us at{" "}
                <Link href="mailto:hello@foodtruckclt.com" className="text-primary hover:underline">
                  hello@foodtruckclt.com
                </Link>{" "}
                or in our{" "}
                <Link href="https://facebook.com/groups/foodtruckclt" className="text-primary hover:underline" target="_blank">
                  Facebook group
                </Link>
                .
              </p>
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  )
}
