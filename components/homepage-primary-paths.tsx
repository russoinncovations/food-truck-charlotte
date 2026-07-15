import Link from "next/link"
import { ArrowRight, CalendarPlus, Truck } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"

export function HomepagePrimaryPaths() {
  return (
    <section className="relative bg-background pb-4 pt-2 md:pb-8">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="grid gap-4 md:grid-cols-2 md:gap-6">
          <Card className="border-2 hover:border-primary/40 transition-colors">
            <CardContent className="flex h-full flex-col p-6 md:p-8">
              <div className="mb-4 inline-flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10">
                <CalendarPlus className="h-6 w-6 text-primary" />
              </div>
              <h2 className="font-display text-2xl font-bold text-foreground">Planning an Event?</h2>
              <p className="mt-2 text-sm text-muted-foreground leading-relaxed">
                Share your date, location, and guest count. FoodTruckCLT notifies local trucks that may be a fit.
              </p>
              <div className="mt-6 pt-2">
                <Button asChild className="w-full sm:w-auto">
                  <Link href="/book-a-truck" className="inline-flex items-center gap-2">
                    Submit an Event Request
                    <ArrowRight className="h-4 w-4" />
                  </Link>
                </Button>
              </div>
            </CardContent>
          </Card>

          <Card className="border-2 hover:border-primary/40 transition-colors">
            <CardContent className="flex h-full flex-col p-6 md:p-8">
              <div className="mb-4 inline-flex h-12 w-12 items-center justify-center rounded-xl bg-muted">
                <Truck className="h-6 w-6 text-primary" />
              </div>
              <h2 className="font-display text-2xl font-bold text-foreground">Own a Food Truck?</h2>
              <p className="mt-2 text-sm text-muted-foreground leading-relaxed">
                Join the directory, keep your profile current, and respond to event requests from Charlotte hosts.
              </p>
              <div className="mt-6 pt-2">
                <Button variant="outline" asChild className="w-full sm:w-auto">
                  <Link href="/vendor-login" className="inline-flex items-center gap-2">
                    Manage Your Truck Profile
                    <ArrowRight className="h-4 w-4" />
                  </Link>
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </section>
  )
}
