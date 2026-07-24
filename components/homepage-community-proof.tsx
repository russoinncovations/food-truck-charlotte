import Link from "next/link"
import { Button } from "@/components/ui/button"
import { ArrowRight } from "lucide-react"

const stats = [
  { value: "35,700+", label: "Community members" },
  { value: "200,000+", label: "Average monthly community post views" },
  { value: "100+", label: "Local trucks listed" },
] as const

/**
 * Editorial community social proof — placed directly under the hero.
 */
export function HomepageCommunityProof() {
  return (
    <section
      aria-labelledby="community-proof-heading"
      className="border-b border-border/60 bg-[#faf6f2] py-12 md:py-16"
    >
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="max-w-2xl">
          <div className="flex items-start gap-3">
            <span className="mt-3 hidden h-8 w-px shrink-0 bg-primary sm:block" aria-hidden />
            <h2
              id="community-proof-heading"
              className="font-display text-3xl font-bold tracking-tight text-foreground md:text-4xl"
            >
              Built from Charlotte&apos;s food truck community.
            </h2>
          </div>

          <p className="mt-4 text-base leading-7 text-muted-foreground md:text-lg md:leading-8">
            FoodTruckCLT started as a Facebook group created to support local food trucks. Today,
            that community includes 35,000+ members and 100+ listed trucks, giving hosts a more
            organized way to request vendors and helping trucks discover new opportunities.
          </p>
        </div>

        <ul
          className="mt-10 grid grid-cols-1 gap-px overflow-hidden border border-border/60 bg-border/60 sm:grid-cols-3 md:mt-12"
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
          Community statistics from Food Truck Charlotte Facebook Group Insights. Totals are updated
          periodically.
        </p>

        <div className="mt-8 flex flex-col items-start gap-4 sm:flex-row sm:items-center sm:gap-6">
          <Button asChild size="lg" className="h-12 rounded-sm px-7">
            <Link href="/book-a-truck" className="flex items-center gap-2">
              Request Food Trucks
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
