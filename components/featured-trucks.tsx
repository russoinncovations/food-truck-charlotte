import Image from "next/image"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { MapPin, ArrowRight } from "lucide-react"
import type { HomepageFeaturedTruckRow } from "@/lib/trucks/homepage-featured-trucks"
import { getTruckDisplayImage } from "@/lib/trucks/truck-display-image"

function cuisineTagsForTruck(truck: HomepageFeaturedTruckRow): string[] {
  const fromTypes = Array.isArray(truck.cuisine_types)
    ? truck.cuisine_types.map((x) => String(x ?? "").trim()).filter(Boolean)
    : []
  if (fromTypes.length > 0) return fromTypes.slice(0, 2)

  const raw = truck.cuisine
  if (Array.isArray(raw)) return raw.map(String).filter(Boolean).slice(0, 2)
  if (!raw) return []

  // Split long free-text cuisine strings into short labels
  return String(raw)
    .split(/[,|/]/)
    .map((s) => s.trim())
    .filter(Boolean)
    .slice(0, 2)
}

type Props = {
  trucks: HomepageFeaturedTruckRow[]
}

export function FeaturedTrucks({ trucks }: Props) {
  if (trucks.length === 0) return null

  return (
    <section className="border-b border-border/60 bg-background py-12 md:py-16">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="mb-7 flex flex-col gap-4 md:mb-9 md:flex-row md:items-end md:justify-between">
          <div className="max-w-2xl">
            <div className="flex items-center gap-3">
              <span className="h-px w-8 bg-primary" aria-hidden />
              <p className="text-[0.7rem] font-semibold uppercase tracking-[0.18em] text-primary">
                Charlotte trucks
              </p>
            </div>
            <h2 className="mt-3 font-display text-3xl font-bold leading-tight tracking-tight text-foreground md:text-4xl">
              Real local truck profiles
            </h2>
            <p className="mt-3 max-w-xl text-sm leading-7 text-muted-foreground md:text-base">
              A mix of Charlotte cuisines — browse photos and details, then request trucks that fit
              your event.
            </p>
          </div>
          <Button variant="outline" asChild className="hidden shrink-0 rounded-sm md:flex">
            <Link href="/trucks" className="flex items-center gap-2">
              Browse All Trucks
              <ArrowRight className="h-4 w-4" />
            </Link>
          </Button>
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 lg:gap-5">
          {trucks.map((truck) => (
            <TruckCard key={truck.id} truck={truck} />
          ))}
        </div>

        <div className="mt-7 flex justify-start md:hidden">
          <Link
            href="/trucks"
            className="text-sm font-medium text-foreground underline decoration-primary decoration-1 underline-offset-[0.35em] transition-colors hover:text-primary"
          >
            Browse All Trucks →
          </Link>
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
    <article className="group overflow-hidden rounded-xl border border-border/70 bg-card transition-colors hover:border-primary/30">
      <Link href={`/trucks/${truck.slug}`} className="block">
        <div className="relative aspect-[4/3] overflow-hidden bg-muted">
          <Image
            src={imageSrc}
            alt={truck.name}
            fill
            sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
            className="object-cover transition-transform duration-500 group-hover:scale-[1.02]"
          />
          {(servingToday || booking) && (
            <div className="absolute left-3 top-3">
              {servingToday ? (
                <Badge className="border-0 bg-green-600/90 text-white">Open Now</Badge>
              ) : (
                <Badge className="border-0 bg-primary/90 text-primary-foreground">
                  Available for Booking
                </Badge>
              )}
            </div>
          )}
        </div>

        <div className="px-4 py-3.5">
          <h3 className="font-display text-base font-bold leading-snug text-foreground transition-colors group-hover:text-primary sm:text-lg">
            {truck.name}
          </h3>

          {cuisineTags.length > 0 && (
            <p className="mt-1.5 text-xs leading-relaxed text-muted-foreground">
              {cuisineTags.join(" · ")}
            </p>
          )}

          {showTodayLocation && (
            <p className="mt-2 flex items-center gap-1.5 text-xs text-muted-foreground">
              <MapPin className="h-3.5 w-3.5 shrink-0 text-primary/70" aria-hidden />
              <span className="truncate">{truck.today_location}</span>
            </p>
          )}
        </div>
      </Link>
    </article>
  )
}
