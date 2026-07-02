import type { Metadata } from "next"
import Link from "next/link"
import { Header } from "@/components/header"
import { Footer } from "@/components/footer"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { CheckCircle, ArrowRight, Calendar, MapPin, Hash } from "lucide-react"

export const metadata: Metadata = {
  title: "Event Request Submitted | Food Truck CLT",
  description: "Your event request has been submitted successfully.",
}

function formatDisplayDate(dateStr: string | undefined): string {
  if (!dateStr?.trim()) return "—"
  const d = new Date(`${dateStr.trim()}T12:00:00`)
  if (Number.isNaN(d.getTime())) return dateStr
  return d.toLocaleDateString("en-US", {
    weekday: "short",
    month: "long",
    day: "numeric",
    year: "numeric",
  })
}

export default async function BookingSuccessPage({
  searchParams,
}: {
  searchParams: Promise<{ id?: string; date?: string; location?: string }>
}) {
  const { id, date, location } = await searchParams
  const reference = id?.trim() ? id.trim().slice(0, 8).toUpperCase() : null

  return (
    <main className="min-h-screen bg-background">
      <Header />

      <section className="pt-24 pb-16 md:pt-32 md:pb-24">
        <div className="mx-auto max-w-2xl px-4 sm:px-6 lg:px-8">
          <Card className="text-center">
            <CardContent className="py-12 px-6">
              <div className="mx-auto w-16 h-16 rounded-full bg-green-100 flex items-center justify-center mb-6">
                <CheckCircle className="h-8 w-8 text-green-600" />
              </div>

              <h1 className="font-display text-3xl font-bold text-foreground mb-3">
                Your Event Request Is In
              </h1>

              <p className="text-muted-foreground mb-8 max-w-lg mx-auto leading-relaxed">
                FoodTruckCLT is notifying relevant local trucks based on your event details. Interested trucks may
                contact you directly.
              </p>

              {(reference || date || location) && (
                <div className="bg-muted/50 rounded-lg p-5 mb-8 text-left space-y-3">
                  {reference ? (
                    <div className="flex items-start gap-3">
                      <Hash className="h-5 w-5 text-primary shrink-0 mt-0.5" />
                      <div>
                        <p className="text-xs font-medium text-muted-foreground">Event reference</p>
                        <p className="font-mono text-sm font-semibold text-foreground">{reference}</p>
                      </div>
                    </div>
                  ) : null}
                  {date ? (
                    <div className="flex items-start gap-3">
                      <Calendar className="h-5 w-5 text-primary shrink-0 mt-0.5" />
                      <div>
                        <p className="text-xs font-medium text-muted-foreground">Event date</p>
                        <p className="text-sm text-foreground">{formatDisplayDate(date)}</p>
                      </div>
                    </div>
                  ) : null}
                  {location?.trim() ? (
                    <div className="flex items-start gap-3">
                      <MapPin className="h-5 w-5 text-primary shrink-0 mt-0.5" />
                      <div>
                        <p className="text-xs font-medium text-muted-foreground">Location</p>
                        <p className="text-sm text-foreground">{location.trim()}</p>
                      </div>
                    </div>
                  ) : null}
                </div>
              )}

              <div className="bg-muted/50 rounded-lg p-6 mb-8 text-left">
                <h2 className="font-semibold text-foreground mb-4">What happens next</h2>
                <ol className="space-y-3 list-decimal list-inside text-sm text-muted-foreground">
                  <li>Local trucks review your request based on date, location, and event needs.</li>
                  <li>Available trucks indicate interest through FoodTruckCLT.</li>
                  <li>You connect directly with interested trucks to confirm details and payment terms.</li>
                </ol>
              </div>

              <p className="text-xs text-muted-foreground mb-8 max-w-lg mx-auto">
                FoodTruckCLT does not handle payment, contracting, or booking negotiation. Please verify event details
                with each truck before committing.
              </p>

              <div className="flex flex-col sm:flex-row gap-3 justify-center">
                <Button asChild>
                  <Link href="/">
                    Back to Home
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Link>
                </Button>
                <Button variant="outline" asChild>
                  <Link href="/map">Find Food Trucks</Link>
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </section>

      <Footer />
    </main>
  )
}
