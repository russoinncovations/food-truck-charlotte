import Link from "next/link"
import { Button } from "@/components/ui/button"
import { ArrowRight, Check } from "lucide-react"

const ownerBenefits = [
  "Claim and maintain your truck profile so hosts can find you",
  "Receive relevant event requests that match your cuisine and service area",
  "Promote upcoming stops and public events from your dashboard",
  "Show live on the map when you are serving",
]

const platformBenefits = [
  "Promote upcoming stops",
  "Show live when serving",
]

/**
 * Editorial invitation for truck owners — metric + benefit rows, no dashboard mockup.
 */
export function VendorCTA({ directoryTruckCount }: { directoryTruckCount: number }) {
  const listedCount = directoryTruckCount > 0 ? directoryTruckCount : 96

  return (
    <section className="border-t border-border/60 bg-[#faf6f2] py-12 md:py-16">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="grid gap-12 lg:grid-cols-2 lg:gap-16 lg:items-start">
          {/* Left: copy + checklist + CTAs */}
          <div>
            <div className="flex items-center gap-3">
              <span className="h-px w-8 bg-primary" aria-hidden />
              <p className="text-[0.7rem] font-semibold uppercase tracking-[0.18em] text-primary">
                For food truck owners
              </p>
            </div>

            <h2 className="mt-4 font-display text-3xl font-bold leading-tight tracking-tight text-foreground md:text-4xl">
              Claim your truck profile and get found by Charlotte event hosts.
            </h2>

            <p className="mt-4 max-w-xl text-base leading-7 text-muted-foreground md:text-lg md:leading-8">
              Keep your profile current, promote upcoming stops, and receive relevant food truck
              requests as the platform grows.
            </p>

            <ul className="mt-8 space-y-3">
              {ownerBenefits.map((benefit) => (
                <li key={benefit} className="flex items-start gap-3">
                  <Check
                    className="mt-0.5 h-4 w-4 shrink-0 text-primary"
                    strokeWidth={2.5}
                    aria-hidden
                  />
                  <span className="text-sm leading-6 text-foreground">{benefit}</span>
                </li>
              ))}
            </ul>

            <div className="mt-9 flex flex-col items-start gap-4 sm:flex-row sm:items-center sm:gap-6">
              <Button asChild size="lg" className="h-12 rounded-sm px-7">
                <Link href="/list-your-truck" className="flex items-center justify-center gap-2">
                  Create or claim your profile
                  <ArrowRight className="h-4 w-4" />
                </Link>
              </Button>
              <Link
                href="/dashboard"
                className="text-sm font-medium text-foreground underline decoration-primary decoration-1 underline-offset-[0.35em] transition-colors hover:text-primary"
              >
                Vendor Dashboard →
              </Link>
            </div>
          </div>

          {/* Right: editorial metric + simple benefit rows */}
          <div className="border-t border-border/70 pt-8 lg:border-l lg:border-t-0 lg:pl-12 lg:pt-0">
            <div className="flex items-start gap-4">
              <span className="mt-2 hidden h-16 w-px shrink-0 bg-primary sm:block" aria-hidden />
              <div>
                <p className="font-display text-6xl font-bold leading-none tracking-tight text-foreground tabular-nums md:text-7xl">
                  {listedCount}
                </p>
                <p className="mt-3 text-sm font-medium tracking-wide text-muted-foreground">
                  Charlotte-area trucks listed
                </p>
              </div>
            </div>

            <ul className="mt-10 border-t border-border/70">
              {platformBenefits.map((benefit) => (
                <li
                  key={benefit}
                  className="border-b border-border/70 py-4 font-display text-lg font-semibold tracking-tight text-foreground md:text-xl"
                >
                  {benefit}
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </section>
  )
}
