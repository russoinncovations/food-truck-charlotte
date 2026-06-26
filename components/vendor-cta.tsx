import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import {
  ArrowRight,
  CheckCircle2,
  LayoutDashboard,
  Megaphone,
  Store,
  Truck,
} from "lucide-react"

const vendorBenefits = [
  "Show your truck in the Charlotte directory",
  "Share schedule updates and live map presence",
  "Receive direct inquiries from customers and hosts",
  "Use the vendor dashboard to keep your profile current",
]

const hostBenefits = [
  "Share the basics: date, time, location, guest count, and cuisine fit",
  "Relevant local trucks can review the request and respond directly",
  "Trucks handle their own pricing, availability, contracts, payments, and service",
  "FoodTruckCLT does not manage staffing, permits, logistics, or the event",
]

export function VendorCTA({ directoryTruckCount }: { directoryTruckCount: number }) {
  return (
    <section className="border-y bg-card py-14 md:py-20">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="mb-8 max-w-3xl">
          <p className="text-sm font-semibold uppercase tracking-[0.22em] text-primary">Direct connections</p>
          <h2 className="mt-3 font-display text-3xl font-bold leading-tight tracking-tight text-foreground md:text-4xl">
            Event hosts and truck owners meet here, then work directly together.
          </h2>
          <p className="mt-4 text-base leading-7 text-muted-foreground md:text-lg md:leading-8">
            FoodTruckCLT connects hosts and local trucks directly. Trucks handle their own pricing,
            availability, contracts, payments, and service.
          </p>
        </div>

        <div className="grid gap-6 lg:grid-cols-[1.08fr_0.92fr]">
          <Card className="relative overflow-hidden border-2 border-primary/20 bg-background shadow-xl shadow-foreground/5">
            <CardContent className="p-6 md:p-8">
              <div className="mb-6 inline-flex h-14 w-14 items-center justify-center rounded-2xl bg-primary text-primary-foreground">
                <Megaphone className="h-7 w-7" />
              </div>

              <h3 className="font-display text-2xl font-bold text-foreground md:text-3xl">
                Planning an event?
              </h3>
              <p className="mt-4 text-muted-foreground leading-7">
                Post an event request once. Local trucks that fit the request can respond directly so you can
                compare options and continue the conversation with the vendors themselves.
              </p>

              <ul className="mt-8 grid gap-3">
                {hostBenefits.map((benefit) => (
                  <li key={benefit} className="flex items-center gap-3">
                    <CheckCircle2 className="h-5 w-5 text-primary shrink-0" />
                    <span className="text-sm leading-6 text-foreground">{benefit}</span>
                  </li>
                ))}
              </ul>

              <div className="mt-8 flex flex-col gap-3 sm:flex-row">
                <Button asChild size="lg" className="flex-1">
                  <Link href="/book-a-truck" className="flex items-center justify-center gap-2">
                    Post an Event Request
                    <ArrowRight className="h-4 w-4" />
                  </Link>
                </Button>
                <Button variant="outline" size="lg" asChild className="flex-1">
                  <Link href="/trucks">Browse Trucks</Link>
                </Button>
              </div>

              <p className="mt-5 text-xs leading-5 text-muted-foreground">
                FoodTruckCLT is a direct-connection platform, not an event planner, staffing service,
                payment processor, permitting service, or logistics manager.
              </p>
            </CardContent>
            <div className="absolute -right-16 -top-16 h-44 w-44 rounded-full bg-primary/10" />
          </Card>

          <Card className="relative overflow-hidden border bg-background">
            <CardContent className="p-6 md:p-8">
              <div className="mb-6 flex items-center justify-between gap-4">
                <div className="inline-flex h-14 w-14 items-center justify-center rounded-2xl bg-muted">
                  <Truck className="h-7 w-7 text-primary" />
                </div>
                <div className="rounded-2xl border bg-card px-4 py-3 text-right">
                  <p className="font-display text-2xl font-bold text-foreground">{directoryTruckCount}</p>
                  <p className="text-xs text-muted-foreground">Trucks listed</p>
                </div>
              </div>

              <h3 className="font-display text-2xl font-bold text-foreground md:text-3xl">
                Own a food truck?
              </h3>
              <p className="mt-4 text-muted-foreground leading-7">
                Get your truck discovered by Charlotte customers, keep your profile useful, and make it easier
                for hosts to reach you directly.
              </p>

              <ul className="mt-8 grid gap-3">
                {vendorBenefits.map((benefit) => (
                  <li key={benefit} className="flex items-center gap-3">
                    <CheckCircle2 className="h-5 w-5 text-primary shrink-0" />
                    <span className="text-sm leading-6 text-foreground">{benefit}</span>
                  </li>
                ))}
              </ul>

              <div className="mt-8 flex flex-col gap-3">
                <Button asChild size="lg">
                  <Link href="/list-your-truck" className="flex items-center justify-center gap-2">
                    List Your Truck
                    <ArrowRight className="h-4 w-4" />
                  </Link>
                </Button>
                <Button variant="outline" size="lg" asChild>
                  <Link href="/dashboard" className="flex items-center justify-center gap-2">
                    <LayoutDashboard className="h-4 w-4" />
                    Vendor Dashboard
                  </Link>
                </Button>
              </div>
            </CardContent>
            <Store className="absolute -bottom-8 -right-8 h-32 w-32 text-primary/5" />
          </Card>
        </div>
      </div>
    </section>
  )
}
