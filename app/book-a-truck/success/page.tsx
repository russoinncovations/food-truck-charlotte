import { Metadata } from "next"
import Link from "next/link"
import { Header } from "@/components/header"
import { Footer } from "@/components/footer"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { CheckCircle, ArrowRight, Calendar, Mail } from "lucide-react"

export const metadata: Metadata = {
  title: "Request Submitted | Food Truck CLT",
  description: "Your booking request has been submitted successfully.",
}

export default function BookingSuccessPage() {
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
              
              <h1 className="font-display text-3xl font-bold text-foreground mb-4">
                Request Submitted!
              </h1>
              
              <p className="text-muted-foreground mb-8 max-w-md mx-auto">
                Thank you for your booking request. We&apos;ve received your event details and 
                will be in touch within 1-2 business days.
              </p>

              <div className="bg-muted/50 rounded-lg p-6 mb-8 text-left">
                <h2 className="font-semibold text-foreground mb-4">What happens next?</h2>
                <ul className="space-y-3">
                  <li className="flex items-start gap-3">
                    <Mail className="h-5 w-5 text-primary shrink-0 mt-0.5" />
                    <span className="text-sm text-muted-foreground">
                      You&apos;ll receive a confirmation email with your request details
                    </span>
                  </li>
                  <li className="flex items-start gap-3">
                    <Calendar className="h-5 w-5 text-primary shrink-0 mt-0.5" />
                    <span className="text-sm text-muted-foreground">
                      Our team will review your request and match you with available trucks
                    </span>
                  </li>
                  <li className="flex items-start gap-3">
                    <CheckCircle className="h-5 w-5 text-primary shrink-0 mt-0.5" />
                    <span className="text-sm text-muted-foreground">
                      We&apos;ll send you truck recommendations to choose from
                    </span>
                  </li>
                </ul>
              </div>

              <div className="flex flex-col sm:flex-row gap-3 justify-center">
                <Button asChild>
                  <Link href="/trucks">
                    Browse Trucks
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Link>
                </Button>
                <Button variant="outline" asChild>
                  <Link href="/events">View Events</Link>
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
