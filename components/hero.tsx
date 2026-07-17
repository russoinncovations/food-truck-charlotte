import Image from "next/image"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { ArrowRight, Truck } from "lucide-react"
import { HOMEPAGE_IMAGES } from "@/lib/homepage/homepage-images"

export function Hero() {
  return (
    <section className="relative min-h-[min(92vh,52rem)] overflow-hidden bg-foreground pt-16 text-primary-foreground">
      <div className="absolute inset-0">
        <Image
          src={HOMEPAGE_IMAGES.hero}
          alt="Charlotte food truck festival with trucks, guests, and the city skyline at dusk"
          fill
          className="object-cover object-[center_35%]"
          priority
          sizes="100vw"
        />
        {/* Keep the photo visible — darken mainly where copy sits */}
        <div className="absolute inset-0 bg-gradient-to-r from-foreground/92 via-foreground/65 to-foreground/20 sm:via-foreground/55 sm:to-foreground/10" />
        <div className="absolute inset-0 bg-gradient-to-t from-background via-transparent to-foreground/35" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(197,58,42,0.22),transparent_30rem)]" />
      </div>

      <div className="relative mx-auto flex min-h-[min(76vh,44rem)] max-w-7xl flex-col justify-end px-4 pb-16 pt-24 sm:px-6 md:pb-20 md:pt-28 lg:px-8">
        <div className="max-w-2xl">
          <p className="mb-5 font-display text-2xl font-bold tracking-tight sm:text-3xl">
            <span className="text-primary-foreground">FoodTruck</span>
            <span className="text-primary">CLT</span>
          </p>

          <h1 className="font-display text-[2.15rem] font-bold leading-[1.1] tracking-tight text-primary-foreground sm:text-4xl lg:text-5xl">
            Request the right food trucks for your Charlotte event.
          </h1>

          <p className="mt-6 max-w-xl text-base leading-7 text-primary-foreground/85 md:text-lg md:leading-8">
            FoodTruckCLT is built from Charlotte&apos;s largest food truck community. Submit one
            request, reach relevant local trucks, and connect directly with the ones interested in
            your event.
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

          <p className="mt-6 max-w-xl text-sm leading-6 text-primary-foreground/75">
            Used by Charlotte hosts, neighborhoods, schools, breweries, and food truck owners to
            find, request, and promote local food trucks.
          </p>

          <p className="mt-4 text-sm text-primary-foreground/60">
            <span className="font-medium text-primary-foreground/80">35K+</span> community members
            <span className="mx-2 text-primary-foreground/30">·</span>
            No booking commission
            <span className="mx-2 text-primary-foreground/30">·</span>
            Connect directly with local trucks
          </p>
        </div>
      </div>
    </section>
  )
}
