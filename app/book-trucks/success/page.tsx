import { Metadata } from "next"
import Link from "next/link"
import { Header } from "@/components/header"
import { Footer } from "@/components/footer"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { CheckCircle2, Mail, Clock, ArrowRight, Home, Calendar } from "lucide-react"

export const metadata: Metadata = {
  title: "Request Submitted | Food Truck CLT",
  description: "Your food truck booking request has been submitted successfully.",
}

export default async function BookingSuccessPage({
  searchParams,
}: {
  searchParams: Promise<{ id?: string }>
}) {
  const { id } = await searchParams

  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      <main className="pt-24 pb-16">
        <div className="mx-auto max-w-2xl px-4 sm:px-6 lg:px-8">
          {/* Success Card */}
          <Card className="border-0 shadow-lg overflow-hidden">
            <div className="bg-gradient-to-r from-green-500 to-emerald-500 p-6 text-center">
              <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-white/20 mb-4">
                <CheckCircle2 className="h-10 w-10 text-white" />
              </div>
              <h1 className="text-2xl font-bold text-white mb-2">
                Request Submitted!
              </h1>
              <p className="text-white/90">
                We&apos;ve received your booking request
              </p>
              <p className="text-sm text-white/80 mt-4 max-w-lg mx-auto">
                FoodTruckCLT connects you with independent vendors. Please verify details and do not
                send payment until you&apos;re comfortable with the arrangement.
              </p>
            </div>

            <CardContent className="p-6 sm:p-8">
              {id && (
                <div className="bg-muted/50 rounded-lg p-4 mb-6 text-center">
                  <p className="text-sm text-muted-foreground mb-1">Reference Number</p>
                  <p className="font-mono text-lg font-semibold text-foreground">
                    {id.slice(0, 8).toUpperCase()}
                  </p>
                </div>
              )}

              <h2 className="text-lg font-semibold text-foreground mb-4">
                What happens next?
              </h2>

              <div className="space-y-4">
                <div className="flex gap-4">
                  <div className="flex-shrink-0 w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                    <Mail className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <p className="font-medium text-foreground">Check your email</p>
                    <p className="text-sm text-muted-foreground">
                      You&apos;ll receive a confirmation email with your request details shortly.
                    </p>
                  </div>
                </div>

                <div className="flex gap-4">
                  <div className="flex-shrink-0 w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                    <Clock className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <p className="font-medium text-foreground">We&apos;ll reach out to trucks</p>
                    <p className="text-sm text-muted-foreground">
                      Within 24-48 hours, we&apos;ll contact trucks that match your preferences.
                    </p>
                  </div>
                </div>

                <div className="flex gap-4">
                  <div className="flex-shrink-0 w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                    <Calendar className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <p className="font-medium text-foreground">Review your options</p>
                    <p className="text-sm text-muted-foreground">
                      We&apos;ll email you with interested trucks, their menus, and availability.
                    </p>
                  </div>
                </div>
              </div>

              <div className="mt-8 pt-6 border-t flex flex-col sm:flex-row gap-3">
                <Button asChild className="flex-1">
                  <Link href="/">
                    <Home className="h-4 w-4 mr-2" />
                    Back to Home
                  </Link>
                </Button>
                <Button variant="outline" asChild className="flex-1">
                  <Link href="/events">
                    Browse Events
                    <ArrowRight className="h-4 w-4 ml-2" />
                  </Link>
                </Button>
              </div>

              <div className="mt-6 text-center">
                <p className="text-sm text-muted-foreground">
                  Questions? Email us at{" "}
                  <Link href="mailto:hello@foodtruckclt.com" className="text-primary hover:underline">
                    hello@foodtruckclt.com
                  </Link>
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Additional Info */}
          <div className="mt-8 text-center">
            <h3 className="font-medium text-foreground mb-3">
              While you wait, explore what&apos;s happening in Charlotte
            </h3>
            <div className="flex flex-wrap justify-center gap-3">
              <Button variant="outline" size="sm" asChild>
                <Link href="/map">View Live Map</Link>
              </Button>
              <Button variant="outline" size="sm" asChild>
                <Link href="/trucks">Browse All Trucks</Link>
              </Button>
              <Button variant="outline" size="sm" asChild>
                <Link href="/events">Upcoming Events</Link>
              </Button>
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  )
}
