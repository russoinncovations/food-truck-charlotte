import { Metadata } from "next"
import { Header } from "@/components/header"
import { Footer } from "@/components/footer"

export const metadata: Metadata = {
  title: "Privacy Policy | FoodTruck CLT",
  description:
    "How FoodTruck CLT collects, uses, and protects your information when you use our directory and request forms.",
}

export default function PrivacyPage() {
  return (
    <main className="min-h-screen bg-background">
      <Header />

      <div className="pt-24 pb-16">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <article className="max-w-3xl mx-auto">
            <header className="mb-10 md:mb-12">
              <h1 className="font-display text-3xl sm:text-4xl font-bold text-foreground tracking-tight">
                Privacy Policy
              </h1>
              <p className="mt-3 text-muted-foreground">Last updated April 2026</p>
            </header>

            <div className="space-y-10 text-muted-foreground leading-relaxed">
              <section>
                <h2 className="font-display text-xl font-semibold text-foreground mb-3">
                  Information We Collect
                </h2>
                <p>
                  Contact information you provide when submitting a booking request or vendor
                  application (name, email, phone). Usage data such as pages visited and time on
                  site.
                </p>
              </section>

              <section>
                <h2 className="font-display text-xl font-semibold text-foreground mb-3">
                  How We Use Your Information
                </h2>
                <p>
                  To connect event hosts with food truck vendors. To process vendor applications and
                  booking requests. To send transactional emails related to your request.
                </p>
              </section>

              <section>
                <h2 className="font-display text-xl font-semibold text-foreground mb-3">
                  We Do Not
                </h2>
                <p>
                  Sell your personal information to third parties. Use your data for advertising
                  purposes.
                </p>
              </section>

              <section>
                <h2 className="font-display text-xl font-semibold text-foreground mb-3">
                  Third-Party Services
                </h2>
                <p>
                  This site uses Supabase for data storage and Resend for email delivery. Both are
                  subject to their own privacy policies.
                </p>
              </section>

              <section>
                <h2 className="font-display text-xl font-semibold text-foreground mb-3">
                  Contact
                </h2>
                <p>
                  Questions? Email us at{" "}
                  <a
                    href="mailto:hello@foodtruckclt.com"
                    className="text-primary font-medium underline-offset-4 hover:underline"
                  >
                    hello@foodtruckclt.com
                  </a>
                  .
                </p>
              </section>
            </div>
          </article>
        </div>
      </div>

      <Footer />
    </main>
  )
}
