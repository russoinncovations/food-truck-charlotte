import { Metadata } from "next"
import Link from "next/link"
import { Header } from "@/components/header"
import { Footer } from "@/components/footer"
import { Button } from "@/components/ui/button"
import { CheckCircle2 } from "lucide-react"

export const metadata: Metadata = {
  title: "Event Submitted | FoodTruck CLT",
  description: "Your event promotion request was received.",
}

export default function PromoteEventSuccessPage() {
  return (
    <main className="min-h-screen bg-background">
      <Header />
      <div className="pt-24 pb-20 px-4 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-lg text-center">
          <div className="inline-flex h-14 w-14 items-center justify-center rounded-full bg-emerald-500/15 mb-4">
            <CheckCircle2 className="h-7 w-7 text-emerald-600 dark:text-emerald-400" />
          </div>
          <h1 className="font-display text-2xl md:text-3xl font-bold text-foreground mb-3">
            Thanks — your event was submitted for review.
          </h1>
          <p className="text-muted-foreground mb-8">
            We&apos;ll review the details and may list approved events on FoodTruckCLT.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Button asChild>
              <Link href="/events">View public events</Link>
            </Button>
            <Button variant="outline" asChild>
              <Link href="/">Back to home</Link>
            </Button>
          </div>
        </div>
      </div>
      <Footer />
    </main>
  )
}
