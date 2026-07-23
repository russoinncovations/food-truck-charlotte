import Link from "next/link"
import { Button } from "@/components/ui/button"
import { ArrowRight } from "lucide-react"

const stats = [
  { value: "35,700+", label: "Community members" },
  { value: "102,000+", label: "Post views in the last 28 days" },
  { value: "100+", label: "Local trucks listed" },
  { value: "35+", label: "Events connected through the platform" },
] as const

/**
 * Editorial community social proof — placed directly under the hero.
 * Uses Facebook Group Insights + platform totals; understated, not a SaaS stats strip.
 */
export function HomepageCommunityProof() {
  return (
    <section
      aria-labelledby="community-proof-heading"
      className="border-b border-border/60 bg-[#faf6f2] py-12 md:py-16"
    >
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="max-w-2xl">
          <div className="flex items-center gap-3">
            <span className="h-px w-8 bg-primary" aria-hidden />
            <p className="text-[0.7rem] font-semibold uppercase tracking-[0.18em] text-primary">
              Built from Charlotte&apos;s food truck community
            </p>
          </div>

          <h2
            id="community-proof-heading"
            className="mt-4 font-display text-3xl font-bold tracking-tight text-foreground md:text-4xl"
          >
            Real local demand. Organized in one place.
          </h2>

          <p className="mt-4 text-base leading-7 text-muted-foreground md:text-lg md:leading-8">
            FoodTruckCLT grew from a 35,000+ member local community where booking requests are among
            the most active conversations. The platform gives hosts and local trucks a clearer, more
            organized way to connect.
          </p>
        </div>

        <ul
          className="mt-10 grid grid-cols-2 gap-px overflow-hidden border border-border/60 bg-border/60 md:mt-12 lg:grid-cols-4"
          aria-label="Community and platform highlights"
        >
          {stats.map((stat) => (
            <li
              key={stat.label}
              className="bg-[#faf6f2] px-4 py-6 text-left sm:px-6 sm:py-7"
            >
              <p className="font-display text-3xl font-bold tracking-tight text-foreground tabular-nums sm:text-4xl">
                {stat.value}
              </p>
              <p className="mt-2 text-sm leading-snug text-muted-foreground">{stat.label}</p>
            </li>
          ))}
        </ul>

        <p className="mt-5 max-w-3xl text-xs leading-relaxed text-muted-foreground sm:text-[0.8rem]">
          Community data from Food Truck Charlotte Facebook Group Insights, June 25–July 22, 2026.
          Platform totals are updated periodically.
        </p>

        <div className="mt-8 flex flex-col items-start gap-4 sm:flex-row sm:items-center sm:gap-6">
          <Button asChild size="lg" className="h-12 rounded-sm px-7">
            <Link href="/book-a-truck" className="flex items-center gap-2">
              Book a Truck
              <ArrowRight className="h-4 w-4" aria-hidden />
            </Link>
          </Button>
          <Link
            href="/list-your-truck"
            className="text-sm font-medium text-foreground underline decoration-primary decoration-1 underline-offset-[0.35em] transition-colors hover:text-primary"
          >
            List Your Truck
          </Link>
        </div>
      </div>
    </section>
  )
}
