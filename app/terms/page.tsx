import { Metadata } from "next"
import { Header } from "@/components/header"
import { Footer } from "@/components/footer"

export const metadata: Metadata = {
  title: "Terms of Service | FoodTruck CLT",
  description:
    "Terms governing your use of FoodTruck CLT as a directory and connection platform for Charlotte food trucks and events.",
}

export default function TermsPage() {
  return (
    <main className="min-h-screen bg-background">
      <Header />

      <div className="pt-24 pb-16">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <article className="max-w-3xl mx-auto">
            <header className="mb-10 md:mb-12">
              <h1 className="font-display text-3xl sm:text-4xl font-bold text-foreground tracking-tight">
                Terms of Service
              </h1>
              <p className="mt-3 text-muted-foreground">Last updated April 2026</p>
            </header>

            <div className="space-y-6 text-muted-foreground leading-relaxed">
              <p>
                By using FoodTruck CLT you agree to these terms. FoodTruck CLT is a directory and
                connection platform. We facilitate introductions between event hosts and food truck
                vendors but are not a party to any agreements made between them. We do not guarantee
                availability, quality, or completion of any bookings. Vendors are responsible for
                their own licensing, insurance, and compliance with local regulations. We reserve
                the right to remove any listing that violates community standards.
              </p>
              <p>
                FoodTruck CLT is not responsible for any disputes, damages, losses, or issues that
                arise between users.
              </p>
              <p>
                All communication, agreements, and payments are handled directly between customers
                and vendors. FoodTruck CLT does not process payments and is not responsible for any
                financial transactions.
              </p>
              <p>
                Users are encouraged to independently verify vendors, event details, and terms
                before entering into any agreement.
              </p>
              <p>
                Use of this platform is at your own discretion and risk.
              </p>
            </div>
          </article>
        </div>
      </div>

      <Footer />
    </main>
  )
}
