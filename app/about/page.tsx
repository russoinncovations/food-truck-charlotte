import { Metadata } from "next"
import Link from "next/link"
import { Header } from "@/components/header"
import { Footer } from "@/components/footer"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"

export const metadata: Metadata = {
  title: "About | FoodTruck CLT",
  description:
    "Charlotte's original food truck platform — built by the community, for the community.",
}

export default function AboutPage() {
  return (
    <main className="min-h-screen bg-background">
      <Header />

      <div className="pt-24 pb-16">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          {/* Hero */}
          <section className="mb-16 md:mb-20 text-center max-w-3xl mx-auto">
            <h1 className="font-display text-3xl sm:text-4xl md:text-5xl font-bold text-foreground tracking-tight">
              Built by the community, for the community.
            </h1>
            <p className="mt-4 text-lg text-muted-foreground leading-relaxed">
              Charlotte&apos;s original food truck platform — born from a 35,000-member Facebook group
            </p>
          </section>

          {/* Story */}
          <section className="max-w-3xl mx-auto mb-16 md:mb-20">
            <div className="space-y-6 text-muted-foreground leading-relaxed">
              <p>
                FoodTruck CLT started in 2020 during the pandemic as a simple Facebook group — an
                effort to help small businesses find their people during one of the hardest years on
                record.
              </p>
              <p>Today we&apos;re 35,000 strong. And honestly? You all blew me away.</p>
              <p>
                I&apos;ve watched this community grow into the go-to resource for Charlotte food
                lovers. I&apos;ve read every &apos;where&apos;s a good taco truck?&apos; and every
                &apos;I need a truck for my wedding.&apos; I&apos;ve seen trucks find their people
                here. I&apos;ve seen neighborhoods discover vendors they never knew existed.
              </p>
              <p>
                But I&apos;ve also seen the challenges. Posts get buried. Trucks are hard to find.
                Events get missed. And with hundreds of posts and comments coming in every week —
                while constantly fighting spam and scams to keep this group safe — the good ones
                fall through the cracks. Real trucks. Real events. Real opportunities. Lost in the
                noise.
              </p>
              <p>So I got to work.</p>
              <p>
                Find Charlotte food trucks, carts, and tents in one place. Discover local events
                worth showing up for. Request catering without the runaround. If you&apos;re a
                vendor — list yourself free in 5 minutes.
              </p>
              <p>
                This is just phase one. I have a lot more in store — better tools, more visibility
                for vendors, and ways to make Charlotte&apos;s food scene even easier to navigate.
              </p>
              <p>This group built this. Now let&apos;s fill it.</p>
            </div>
            <p className="mt-10 font-medium text-foreground">— Nicole Russo, Founder</p>
          </section>

          {/* Stats */}
          <section className="mb-16 md:mb-20">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 md:gap-6">
              <Card className="border-primary/15 bg-primary/5">
                <CardContent className="p-6 text-center">
                  <p className="font-display text-2xl md:text-3xl font-bold text-foreground">
                    35,000+ Members
                  </p>
                </CardContent>
              </Card>
              <Card className="border-primary/15 bg-primary/5">
                <CardContent className="p-6 text-center">
                  <p className="font-display text-2xl md:text-3xl font-bold text-foreground">
                    Since 2020
                  </p>
                </CardContent>
              </Card>
              <Card className="border-primary/15 bg-primary/5">
                <CardContent className="p-6 text-center">
                  <p className="font-display text-2xl md:text-3xl font-bold text-foreground">
                    Free to Use
                  </p>
                </CardContent>
              </Card>
            </div>
          </section>

          {/* CTA */}
          <section className="rounded-2xl border border-primary/20 bg-primary/5 px-6 py-10 md:px-10 md:py-12 text-center max-w-3xl mx-auto">
            <h2 className="font-display text-2xl md:text-3xl font-bold text-foreground">
              Do you run a Charlotte food truck?
            </h2>
            <p className="mt-4 text-muted-foreground leading-relaxed max-w-xl mx-auto">
              List yourself free on the site — I want every single one here.
            </p>
            <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-3">
              <Button
                className="w-full sm:w-auto bg-[#D94F1E] text-white hover:bg-[#b8441a]"
                size="lg"
                asChild
              >
                <Link href="/list-your-truck">List Your Truck</Link>
              </Button>
              <Button variant="outline" size="lg" className="w-full sm:w-auto" asChild>
                <Link href="/trucks">Find Trucks</Link>
              </Button>
            </div>
          </section>
        </div>
      </div>

      <Footer />
    </main>
  )
}
