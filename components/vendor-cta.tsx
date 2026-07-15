import Link from "next/link"
import { Button } from "@/components/ui/button"
import {
  ArrowRight,
  CheckCircle2,
  LayoutDashboard,
  MapPin,
  Megaphone,
  Store,
} from "lucide-react"

const ownerBenefits = [
  "Claim and maintain your truck profile so hosts can find you",
  "Receive relevant event requests that match your cuisine and service area",
  "Promote upcoming stops and public events from your dashboard",
  "Show live on the map when you are serving",
]

export function VendorCTA({ directoryTruckCount }: { directoryTruckCount: number }) {
  return (
    <section className="border-y bg-card py-14 md:py-20">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="grid items-center gap-10 lg:grid-cols-[1.1fr_0.9fr]">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.22em] text-primary">
              For food truck owners
            </p>
            <h2 className="mt-3 font-display text-3xl font-bold leading-tight tracking-tight text-foreground md:text-4xl">
              Get found. Get requested. Stay visible.
            </h2>
            <p className="mt-4 max-w-xl text-base leading-7 text-muted-foreground md:text-lg md:leading-8">
              FoodTruckCLT helps Charlotte trucks claim their profile, receive relevant host
              requests, promote upcoming stops, and show live when serving — then you connect
              with hosts directly.
            </p>

            <ul className="mt-8 grid gap-3">
              {ownerBenefits.map((benefit) => (
                <li key={benefit} className="flex items-start gap-3">
                  <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-primary" />
                  <span className="text-sm leading-6 text-foreground">{benefit}</span>
                </li>
              ))}
            </ul>

            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <Button asChild size="lg">
                <Link href="/list-your-truck" className="flex items-center justify-center gap-2">
                  Claim Your Profile
                  <ArrowRight className="h-4 w-4" />
                </Link>
              </Button>
              <Button variant="outline" size="lg" asChild>
                <Link href="/dashboard" className="flex items-center justify-center gap-2">
                  <LayoutDashboard className="h-4 w-4" />
                  Vendor Dashboard
                </Link>
              </Button>
            </div>
          </div>

          <div className="relative overflow-hidden rounded-2xl border bg-background p-6 shadow-sm md:p-8">
            <div className="mb-6 flex items-center justify-between gap-4">
              <div className="inline-flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10 text-primary">
                <Store className="h-6 w-6" />
              </div>
              <div className="text-right">
                <p className="font-display text-3xl font-bold tabular-nums text-foreground">
                  {directoryTruckCount}
                </p>
                <p className="text-xs text-muted-foreground">Trucks listed</p>
              </div>
            </div>

            <div className="space-y-4">
              <div className="flex items-start gap-3 rounded-xl bg-muted/50 p-4">
                <Megaphone className="mt-0.5 h-5 w-5 shrink-0 text-primary" />
                <div>
                  <p className="text-sm font-semibold text-foreground">Promote your stops</p>
                  <p className="mt-1 text-sm text-muted-foreground">
                    Share upcoming service nights and events so hungry Charlotte finds you.
                  </p>
                </div>
              </div>
              <div className="flex items-start gap-3 rounded-xl bg-muted/50 p-4">
                <MapPin className="mt-0.5 h-5 w-5 shrink-0 text-primary" />
                <div>
                  <p className="text-sm font-semibold text-foreground">Show live when serving</p>
                  <p className="mt-1 text-sm text-muted-foreground">
                    Check in so your truck appears on the live map while you are open.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
