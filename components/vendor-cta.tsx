import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { 
  Truck, 
  Calendar, 
  TrendingUp, 
  Users, 
  CheckCircle2, 
  ArrowRight,
  Building2,
  PartyPopper
} from "lucide-react"

const vendorBenefits = [
  "Post your schedule so customers can find you",
  "Show up in search when people look for trucks",
  "Get contacted directly for private events",
  "Free to list - no subscription fees",
]

const hostBenefits = [
  "Browse 90+ trucks by cuisine and availability",
  "See real reviews from Charlotte customers",
  "Contact trucks directly - no middleman",
  "Great for breweries, offices, and private parties",
]

export function VendorCTA() {
  return (
    <section className="py-16 md:py-24">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="grid md:grid-cols-2 gap-6">
          {/* For Truck Owners */}
          <Card className="relative overflow-hidden border-2 hover:border-primary/50 transition-colors">
            <CardContent className="p-8">
              {/* Icon */}
              <div className="mb-6 inline-flex h-14 w-14 items-center justify-center rounded-xl bg-primary/10">
                <Truck className="h-7 w-7 text-primary" />
              </div>

              <h3 className="font-display text-2xl font-bold text-foreground mb-2">
                Own a food truck?
              </h3>
              <p className="text-muted-foreground mb-6">
                List your truck so Charlotte customers can find you. Post your schedule, 
                get booking requests, and grow your following.
              </p>

              {/* Benefits */}
              <ul className="space-y-3 mb-8">
                {vendorBenefits.map((benefit) => (
                  <li key={benefit} className="flex items-center gap-3">
                    <CheckCircle2 className="h-5 w-5 text-primary shrink-0" />
                    <span className="text-sm text-foreground">{benefit}</span>
                  </li>
                ))}
              </ul>

              {/* Stats */}
              <div className="flex gap-6 mb-8 pb-8 border-b">
                <div>
                  <p className="text-2xl font-bold text-foreground">90+</p>
                  <p className="text-sm text-muted-foreground">Trucks listed</p>
                </div>
                <div>
                  <p className="text-2xl font-bold text-foreground">35K</p>
                  <p className="text-sm text-muted-foreground">Community members</p>
                </div>
                <div>
                  <p className="text-2xl font-bold text-foreground">Free</p>
                  <p className="text-sm text-muted-foreground">Always</p>
                </div>
              </div>

              {/* CTA */}
              <div className="flex flex-col sm:flex-row gap-3">
                <Button asChild className="flex-1">
                  <Link href="/list-your-truck" className="flex items-center justify-center gap-2">
                    List Your Truck
                    <ArrowRight className="h-4 w-4" />
                  </Link>
                </Button>
                <Button variant="outline" asChild className="flex-1">
                  <Link href="/dashboard">Vendor Dashboard</Link>
                </Button>
              </div>
            </CardContent>

            {/* Background decoration */}
            <div className="absolute top-0 right-0 -mt-8 -mr-8 h-32 w-32 rounded-full bg-primary/5" />
          </Card>

          {/* For Event Hosts */}
          <Card className="relative overflow-hidden border-2 hover:border-accent/50 transition-colors">
            <CardContent className="p-8">
              {/* Icon */}
              <div className="mb-6 inline-flex h-14 w-14 items-center justify-center rounded-xl bg-accent/20">
                <PartyPopper className="h-7 w-7 text-accent" />
              </div>

              <h3 className="font-display text-2xl font-bold text-foreground mb-2">
                Booking trucks for an event?
              </h3>
              <p className="text-muted-foreground mb-6">
                Browse trucks by cuisine and check their availability. 
                Perfect for breweries, corporate events, HOAs, and private parties.
              </p>

              {/* Benefits */}
              <ul className="space-y-3 mb-8">
                {hostBenefits.map((benefit) => (
                  <li key={benefit} className="flex items-center gap-3">
                    <CheckCircle2 className="h-5 w-5 text-accent shrink-0" />
                    <span className="text-sm text-foreground">{benefit}</span>
                  </li>
                ))}
              </ul>

              {/* Event Types */}
              <div className="flex flex-wrap gap-2 mb-8 pb-8 border-b">
                {[
                  { icon: Building2, label: "Corporate" },
                  { icon: Users, label: "HOA / Community" },
                  { icon: PartyPopper, label: "Private Party" },
                  { icon: Calendar, label: "Recurring" },
                ].map((type) => (
                  <div
                    key={type.label}
                    className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-muted text-sm"
                  >
                    <type.icon className="h-4 w-4 text-muted-foreground" />
                    <span>{type.label}</span>
                  </div>
                ))}
              </div>

              {/* CTA */}
              <div className="flex flex-col sm:flex-row gap-3">
                <Button asChild className="flex-1 bg-accent text-accent-foreground hover:bg-accent/90">
                  <Link href="/book-trucks" className="flex items-center justify-center gap-2">
                    Book Trucks for Event
                    <ArrowRight className="h-4 w-4" />
                  </Link>
                </Button>
                <Button variant="outline" asChild className="flex-1">
                  <Link href="/events">Browse Events</Link>
                </Button>
              </div>
            </CardContent>

            {/* Background decoration */}
            <div className="absolute top-0 right-0 -mt-8 -mr-8 h-32 w-32 rounded-full bg-accent/10" />
          </Card>
        </div>
      </div>
    </section>
  )
}
