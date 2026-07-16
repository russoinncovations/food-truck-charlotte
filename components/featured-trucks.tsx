import Image from "next/image"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent } from "@/components/ui/card"
import { MapPin, ArrowRight } from "lucide-react"
import type { HomepageFeaturedTruckRow } from "@/lib/trucks/homepage-featured-trucks"
import { getTruckDisplayImage } from "@/lib/trucks/truck-display-image"

function cuisineTagsForTruck(truck: HomepageFeaturedTruckRow): string[] {
  const fromTypes = Array.isArray(truck.cuisine_types)
    ? truck.cuisine_types.map((x) => String(x ?? "").trim()).filter(Boolean)
    : []
  if (fromTypes.length > 0) return fromTypes.slice(0, 2)
  const raw = truck.cuisine
  const list = Array.isArray(raw) ? raw.map(String) : raw ? [String(raw)] : []
  return list.filter(Boolean).slice(0, 2)
}

type Props = {
  trucks: HomepageFeaturedTruckRow[]
}

export function FeaturedTrucks({ trucks }: Props) {
  return (
    <section className="bg-background py-14 md:py-20">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="mb-8 flex flex-col gap-5 md:flex-row md:items-end md:justify-between">
          <div className="max-w-3xl">
            <p className="text-sm font-semibold uppercase tracking-[0.22em] text-primary">
              Truck profiles
            </p>
            <h2 className="mt-3 font-display text-3xl font-bold leading-tight tracking-tight text-foreground md:text-4xl">
              Truck profiles that support better requests
            </h2>
            <p className="mt-4 text-base leading-7 text-muted-foreground md:text-lg md:leading-8">
              Browse cuisine, photos, and service details before you request. Complete profiles help
              hosts choose and help trucks get found.
            </p>
          </div>
          <Button variant="outline" asChild className="hidden md:flex">
            <Link href="/trucks" className="flex items-center gap-2">
              Browse All Trucks
              <ArrowRight className="h-4 w-4" />
            </Link>
          </Button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {trucks.map((truck) => (
            <TruckCard key={truck.id} truck={truck} />
          ))}
        </div>

        {/* Mobile CTA */}
        <div className="mt-8 flex justify-center md:hidden">
          <Button variant="outline" asChild>
            <Link href="/trucks" className="flex items-center gap-2">
              Browse all trucks
              <ArrowRight className="h-4 w-4" />
            </Link>
          </Button>
        </div>
      </div>
    </section>
  )
}

function TruckCard({ truck }: { truck: HomepageFeaturedTruckRow }) {
  const cuisineTags = cuisineTagsForTruck(truck)
  const servingToday = Boolean(truck.serving_today)
  const showTodayLocation = servingToday && Boolean(truck.today_location?.trim())
  const imageSrc = getTruckDisplayImage(truck.id, truck.photo_url, truck.hero_photo_url)
  const booking = Boolean(truck.catering)

  return (
    <Card className="group overflow-hidden border-border/80 bg-card shadow-sm transition-all hover:-translate-y-1 hover:border-primary/40 hover:shadow-xl">
      <Link href={`/trucks/${truck.slug}`}>
        <div className="relative aspect-[4/3] overflow-hidden bg-muted">
          <Image
            src={imageSrc}
            alt={truck.name}
            fill
            className="object-cover transition-transform duration-500 group-hover:scale-105"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-foreground/45 via-transparent to-transparent opacity-80" />
          <div className="absolute top-3 left-3 flex flex-wrap gap-1.5">
            {servingToday ? (
              <Badge className="bg-green-500/90 text-white border-0 backdrop-blur-sm">
                <span className="relative mr-1.5 flex h-2 w-2">
                  <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-white opacity-75" />
                  <span className="relative inline-flex h-2 w-2 rounded-full bg-white" />
                </span>
                Open Now
              </Badge>
            ) : booking ? (
              <Badge className="border-0 bg-primary/90 text-primary-foreground backdrop-blur-sm">
                Available for Booking
              </Badge>
            ) : (
              <Badge variant="secondary" className="backdrop-blur-sm border border-background/20 bg-background/90">
                Listed Vendor
              </Badge>
            )}
          </div>
        </div>

        <CardContent className="p-5">
          <div className="flex flex-wrap gap-1.5 mb-3">
            {cuisineTags.map((c) => (
              <span
                key={c}
                className="rounded-full bg-muted px-2.5 py-1 text-xs font-medium text-muted-foreground"
              >
                {c}
              </span>
            ))}
          </div>

          <div className="mb-2 flex items-start justify-between gap-2">
            <h3 className="font-display text-lg font-bold leading-snug text-foreground transition-colors group-hover:text-primary">
              {truck.name}
            </h3>
          </div>

          {showTodayLocation && (
            <div className="mt-4 border-t pt-4">
              <p className="mb-1 text-xs font-medium uppercase tracking-wide text-muted-foreground">
                Next stop
              </p>
              <div className="flex items-center gap-1 text-sm">
                <MapPin className="h-3.5 w-3.5 text-primary shrink-0" />
                <span className="truncate">{truck.today_location}</span>
              </div>
            </div>
          )}
        </CardContent>
      </Link>
    </Card>
  )
}
