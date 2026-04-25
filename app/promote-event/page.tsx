import { Metadata } from "next"
import Link from "next/link"
import { Header } from "@/components/header"
import { Footer } from "@/components/footer"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { PromoteEventForm } from "@/components/forms/promote-event-form"
import { Megaphone } from "lucide-react"

export const metadata: Metadata = {
  title: "Promote Your Food Truck Event | FoodTruck CLT",
  description:
    "Submit a food truck rally, market, or festival in Charlotte to be considered for listing on FoodTruck CLT.",
}

export default function PromoteEventPage() {
  return (
    <main className="min-h-screen bg-background">
      <Header />

      <div className="pt-24 pb-16">
        <div className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8">
          <p className="text-sm text-muted-foreground mb-2">
            <Link href="/events" className="hover:text-foreground">
              ← Back to events
            </Link>
          </p>
          <div className="flex items-start gap-3 mb-6">
            <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
              <Megaphone className="h-5 w-5 text-primary" />
            </div>
            <div>
              <h1 className="font-display text-3xl md:text-4xl font-bold text-foreground">
                Promote Your Food Truck Event
              </h1>
              <p className="mt-3 text-muted-foreground text-pretty max-w-2xl">
                Share your food truck rally, brewery pop-up, market, neighborhood event, or festival with
                Charlotte&apos;s food truck community. Submit your event details below. Approved events may be
                listed on FoodTruckCLT and shared with our audience.
              </p>
            </div>
          </div>

          <p className="text-sm text-muted-foreground mb-8 rounded-md border border-border/80 bg-muted/30 px-4 py-3">
            This form is for <strong className="text-foreground">listing or promoting an event you already
            have</strong>. If you need to <strong className="text-foreground">hire food trucks</strong> for
            an event, use{" "}
            <Link href="/book-a-truck" className="text-primary font-medium hover:underline">
              Book a Truck
            </Link>{" "}
            instead.
          </p>

          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Event details</CardTitle>
            </CardHeader>
            <CardContent>
              <PromoteEventForm />
            </CardContent>
          </Card>
        </div>
      </div>

      <Footer />
    </main>
  )
}
