import type { Metadata } from "next"
import Link from "next/link"
import { Header } from "@/components/header"
import { Footer } from "@/components/footer"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import {
  ResourcePartnerCard,
  ResourcePartnerPlaceholderCard,
} from "@/components/resources/resource-partner-card"
import {
  RESOURCE_CATEGORIES,
  RESOURCE_GUIDE_INQUIRY_MAILTO,
  RESOURCE_PARTNER_LISTINGS,
} from "@/lib/resources/resource-guide-data"
import { ArrowDown, Mail } from "lucide-react"

export const metadata: Metadata = {
  title: "FoodTruckCLT Local Resource Guide | Charlotte Food Truck Resources",
  description:
    "Find local Charlotte resources for food trucks, including commissary kitchens, repairs, cleaning, insurance, wraps, supplies, and truck-friendly venues.",
}

export default function ResourcesPage() {
  const hasLivePartners = RESOURCE_PARTNER_LISTINGS.length > 0

  return (
    <main className="min-h-screen bg-background">
      <Header />

      {/* Hero */}
      <section className="pt-28 pb-12 md:pt-32 md:pb-16 bg-gradient-to-b from-primary/5 to-background border-b border-border/60">
        <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8 text-center">
          <p className="text-sm font-medium uppercase tracking-wider text-primary mb-3">
            Charlotte-area vendor resources
          </p>
          <h1 className="font-display text-3xl sm:text-4xl md:text-5xl font-bold text-foreground tracking-tight text-balance">
            FoodTruckCLT Local Resource Guide
          </h1>
          <p className="mt-5 text-lg text-muted-foreground leading-relaxed max-w-2xl mx-auto">
            A growing guide to local businesses and services that help Charlotte-area food trucks
            operate, grow, stay compliant, and stay on the road.
          </p>
          <Button size="lg" className="mt-8" asChild>
            <Link href="#resource-guide-inquiry" className="inline-flex items-center gap-2">
              Interested in being listed?
              <ArrowDown className="h-4 w-4" />
            </Link>
          </Button>
        </div>
      </section>

      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-12 md:py-16 space-y-16 md:space-y-20">
        {/* Intro */}
        <section className="max-w-3xl">
          <div className="space-y-4 text-muted-foreground leading-relaxed">
            <p>
              Food truck owners are often looking for reliable local help, from commissary space and
              truck repairs to cleaning, insurance, wraps, supplies, and truck-friendly venues.
            </p>
            <p>
              The FoodTruckCLT Local Resource Guide is being built to make those resources easier to
              find in one organized place.
            </p>
          </div>
        </section>

        {/* Categories */}
        <section aria-labelledby="resource-categories-heading">
          <h2 id="resource-categories-heading" className="font-display text-2xl font-bold text-foreground mb-2">
            Resource categories
          </h2>
          <p className="text-muted-foreground mb-8 max-w-2xl">
            Browse by the kind of help vendors need most. Listings will roll out category by category.
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {RESOURCE_CATEGORIES.map((cat) => {
              const Icon = cat.icon
              return (
                <Card key={cat.id} className="border-border/80 hover:border-primary/30 transition-colors">
                  <CardContent className="p-5">
                    <div className="flex items-start gap-4">
                      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
                        <Icon className="h-5 w-5" aria-hidden />
                      </div>
                      <div>
                        <h3 className="font-semibold text-foreground leading-snug">{cat.title}</h3>
                        <p className="mt-1.5 text-sm text-muted-foreground leading-relaxed">
                          {cat.description}
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )
            })}
          </div>
        </section>

        {/* Founding partners */}
        <section aria-labelledby="founding-partners-heading">
          <h2 id="founding-partners-heading" className="font-display text-2xl font-bold text-foreground mb-2">
            Founding Resource Partners
          </h2>
          <p className="text-muted-foreground mb-8 max-w-2xl leading-relaxed">
            We&apos;re opening a limited first round of founding resource partner spots for businesses
            that support food trucks and mobile food vendors.
          </p>
          {hasLivePartners ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {RESOURCE_PARTNER_LISTINGS.map((partner) => (
                <ResourcePartnerCard key={`${partner.businessName}-${partner.category}`} partner={partner} />
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-3xl">
              <ResourcePartnerPlaceholderCard
                title="Founding partners coming soon"
                description="We're curating the first group of trusted local businesses for this guide."
              />
              <ResourcePartnerPlaceholderCard
                title="Interested in being included?"
                description="Reach out below to ask about founding resource partner spots."
              />
            </div>
          )}
        </section>

        {/* Inquiry */}
        <section
          id="resource-guide-inquiry"
          className="scroll-mt-28 rounded-2xl border border-primary/20 bg-primary/5 p-8 md:p-10"
          aria-labelledby="resource-inquiry-heading"
        >
          <h2 id="resource-inquiry-heading" className="font-display text-2xl font-bold text-foreground">
            Interested in being listed?
          </h2>
          <p className="mt-4 text-muted-foreground leading-relaxed max-w-2xl">
            If your business works with food trucks, mobile food vendors, or event hosts, we&apos;d love
            to hear from you.
          </p>
          <div className="mt-6 flex flex-col sm:flex-row sm:items-center gap-4">
            <Button size="lg" asChild>
              <a href={RESOURCE_GUIDE_INQUIRY_MAILTO} className="inline-flex items-center gap-2">
                <Mail className="h-4 w-4" />
                Ask about the Resource Guide
              </a>
            </Button>
            <p className="text-sm text-muted-foreground">
              Email FoodTruckCLT ·{" "}
              <a href={RESOURCE_GUIDE_INQUIRY_MAILTO} className="text-primary underline-offset-2 hover:underline">
                evolvebtc@gmail.com
              </a>
            </p>
          </div>
          <p className="mt-6 text-sm text-muted-foreground border-t border-primary/15 pt-6">
            Founding resource partner spots are limited while we build out the first version of the
            guide.
          </p>
          <p className="mt-2 text-xs text-muted-foreground">
            Founding partner details are available by request.
          </p>
        </section>
      </div>

      <Footer />
    </main>
  )
}
