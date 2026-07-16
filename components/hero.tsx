import Image from "next/image"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { ArrowRight, Truck } from "lucide-react"

type HeroProps = {
  directoryTruckCount: number
}

export function Hero({ directoryTruckCount }: HeroProps) {
  return (
    <section className="relative overflow-hidden bg-foreground pt-16 text-primary-foreground">
      <div className="absolute inset-0">
        <Image
          src="/images/hero-truck.jpg"
          alt="Charlotte food truck at an event"
          fill
          className="object-cover opacity-40"
          priority
        />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(197,58,42,0.4),transparent_34rem)]" />
        <div className="absolute inset-0 bg-gradient-to-b from-foreground/88 via-foreground/82 to-background" />
      </div>

      <div className="relative mx-auto max-w-7xl px-4 pb-16 pt-20 sm:px-6 md:pb-20 md:pt-24 lg:px-8">
        <div className="max-w-3xl">
          <p className="mb-5 font-display text-2xl font-bold tracking-tight sm:text-3xl">
            <span className="text-primary-foreground">FoodTruck</span>
            <span className="text-primary">CLT</span>
          </p>

          <h1 className="font-display text-[2.15rem] font-bold leading-[1.1] tracking-tight text-primary-foreground sm:text-4xl lg:text-5xl">
            Request the right food trucks for your Charlotte event.
          </h1>

          <p className="mt-6 max-w-2xl text-base leading-7 text-primary-foreground/80 md:text-lg md:leading-8">
            Submit one request and connect directly with local food trucks available for schools,
            neighborhoods, breweries, corporate events, private parties, and community gatherings.
          </p>

          <div className="mt-8 flex flex-col gap-3 sm:flex-row">
            <Button size="lg" asChild className="h-14 px-7">
              <Link href="/book-a-truck" className="flex items-center justify-center gap-2">
                Request a Food Truck
                <ArrowRight className="h-4 w-4" />
              </Link>
            </Button>
            <Button
              size="lg"
              variant="secondary"
              asChild
              className="h-14 bg-primary-foreground text-foreground hover:bg-primary-foreground/90"
            >
              <Link href="/trucks" className="flex items-center justify-center gap-2">
                <Truck className="h-5 w-5" />
                Browse Trucks
              </Link>
            </Button>
          </div>

          <p className="mt-6 max-w-2xl text-sm leading-6 text-primary-foreground/70">
            Powered by Charlotte&apos;s largest food truck community · No booking commission · Connect
            directly with trucks
          </p>

          <p className="mt-4 text-sm text-primary-foreground/55">
            <span className="font-medium text-primary-foreground/75 tabular-nums">{directoryTruckCount}</span>{" "}
            local trucks
            <span className="mx-2 text-primary-foreground/30">·</span>
            <span className="font-medium text-primary-foreground/75">35K+</span> community members
            <span className="mx-2 text-primary-foreground/30">·</span>
            No booking commission
          </p>
        </div>
      </div>
    </section>
  )
}
