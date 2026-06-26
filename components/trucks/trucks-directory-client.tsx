"use client"

import { useMemo, useState } from "react"
import Image from "next/image"
import Link from "next/link"
import { Search, MapPin, CalendarPlus, Map as MapIcon, Megaphone, ArrowRight } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { cn } from "@/lib/utils"
import { getTruckDisplayImage } from "@/lib/trucks/truck-display-image"

export type DirectoryTruckRow = {
  id: string
  name: string
  slug: string
  cuisine: string | null
  cuisine_types: string[] | null
  serving_today: boolean | null
  today_location: string | null
  photo_url: string | null
  catering: boolean | null
}

type FilterChipId =
  | "all"
  | "booking"
  | "tacos"
  | "bbq"
  | "dessert"
  | "coffee"
  | "out_now"

const FILTER_CHIPS: { id: FilterChipId; label: string }[] = [
  { id: "all", label: "All" },
  { id: "booking", label: "Available for Booking" },
  { id: "tacos", label: "Tacos" },
  { id: "bbq", label: "BBQ" },
  { id: "dessert", label: "Dessert" },
  { id: "coffee", label: "Coffee" },
  { id: "out_now", label: "Out Now" },
]

function truckHaystack(t: DirectoryTruckRow): string {
  const types = (t.cuisine_types ?? []).join(" ")
  return `${t.name} ${t.cuisine ?? ""} ${types}`.toLowerCase()
}

function matchesChip(t: DirectoryTruckRow, chip: FilterChipId): boolean {
  const h = truckHaystack(t)
  switch (chip) {
    case "all":
      return true
    case "booking":
      return Boolean(t.catering)
    case "tacos":
      return /taco|mexican|burrito|latin|colombian/.test(h)
    case "bbq":
      return /bbq|barbecue|smoke|smokehouse/.test(h)
    case "dessert":
      return /dessert|sweet|waffle|crepe|sno cone|slush|smoothie|juice\/smooth/.test(h)
    case "coffee":
      return /coffee|espresso|cafe|latte/.test(h)
    case "out_now":
      return Boolean(t.serving_today)
    default:
      return true
  }
}

function cuisineTagsForCard(t: DirectoryTruckRow): string[] {
  const fromTypes = (t.cuisine_types ?? []).filter((x) => String(x).trim()).slice(0, 3)
  if (fromTypes.length > 0) return fromTypes.map(String)
  const c = t.cuisine?.trim()
  if (c) {
    return c
      .split(/[,/&]| and /i)
      .map((s) => s.trim())
      .filter(Boolean)
      .slice(0, 3)
  }
  return ["Food Truck"]
}

type Props = {
  trucks: DirectoryTruckRow[]
}

export function TrucksDirectoryClient({ trucks }: Props) {
  const [query, setQuery] = useState("")
  const [chip, setChip] = useState<FilterChipId>("all")

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    return trucks.filter((t) => {
      if (!matchesChip(t, chip)) return false
      if (!q) return true
      return truckHaystack(t).includes(q)
    })
  }, [trucks, query, chip])

  return (
    <>
      {/* Hero + trust + CTAs */}
      <section className="relative border-b border-border/60 bg-[#faf6f2]">
        <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 sm:py-12 lg:px-8">
          <p className="text-center text-sm font-medium text-muted-foreground">
            Built from the 35K+ member Food Truck Charlotte community.
          </p>
          <h1 className="mt-3 text-center font-display text-3xl font-bold leading-tight tracking-tight text-foreground sm:text-5xl text-balance">
            Explore Charlotte Food Trucks
          </h1>
          <p className="mx-auto mt-4 max-w-3xl text-center text-base leading-7 text-muted-foreground text-pretty md:text-lg">
            Browse local vendors, discover cuisines, and book Charlotte-area food trucks for private parties,
            offices, schools, neighborhoods, breweries, festivals, and public events.
          </p>

          <div className="mt-7 flex flex-col items-center justify-center gap-3 sm:flex-row sm:flex-wrap">
            <Button size="lg" className="w-full min-w-[200px] sm:w-auto gap-2" asChild>
              <Link href="/book-a-truck">
                <CalendarPlus className="h-4 w-4" />
                Book a Truck
              </Link>
            </Button>
            <Button size="lg" variant="outline" className="w-full min-w-[200px] sm:w-auto gap-2" asChild>
              <Link href="/map">
                <MapIcon className="h-4 w-4" />
                View Map
              </Link>
            </Button>
            <Button size="lg" variant="secondary" className="w-full min-w-[200px] sm:w-auto gap-2" asChild>
              <Link href="/promote-event">
                <Megaphone className="h-4 w-4" />
                Post an Event
              </Link>
            </Button>
          </div>

          <p className="mx-auto mt-6 max-w-3xl text-center text-xs leading-relaxed text-muted-foreground">
            FoodTruckCLT helps connect event hosts with local food truck vendors. Final pricing, availability,
            permits, insurance, and service details are confirmed directly with the vendor.
          </p>
        </div>
      </section>

      {/* Filters + search */}
      <section className="border-b border-border/40 bg-background">
        <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
          <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
            <div className="relative w-full lg:max-w-md">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                type="search"
                placeholder="Search by truck name or cuisine…"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                className="h-11 border-border/80 bg-background pl-10 pr-4 shadow-sm"
                aria-label="Search trucks"
              />
            </div>
            <div className="flex flex-1 flex-wrap gap-2 lg:justify-end">
              {FILTER_CHIPS.map((c) => (
                <button
                  key={c.id}
                  type="button"
                  onClick={() => setChip(c.id)}
                  className={cn(
                    "rounded-xl border px-3.5 py-2 text-sm font-medium transition-all",
                    chip === c.id
                      ? "border-primary bg-primary text-primary-foreground shadow-sm"
                      : "border-border/80 bg-background text-foreground hover:border-primary/40 hover:bg-primary/5"
                  )}
                >
                  {c.label}
                </button>
              ))}
            </div>
          </div>
          <p className="mt-4 text-xs text-muted-foreground">
            <span className="font-medium text-foreground">{filtered.length}</span>{" "}
            {filtered.length === 1 ? "truck" : "trucks"}
            {query.trim() || chip !== "all" ? " match your filters" : " listed"}
          </p>
          <p className="mt-2 text-xs text-muted-foreground max-w-3xl">
            Planning for a weekend or public event? Use search (e.g. brewery, school, or festival) or start with{" "}
            <strong className="text-foreground">Available for Booking</strong> for vendors who take event inquiries.
          </p>
        </div>
      </section>

      {/* Grid */}
      <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
        {filtered.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-border bg-muted/30 px-6 py-16 text-center">
            <p className="font-display text-xl font-semibold text-foreground">
              No trucks match that search yet.
            </p>
            <p className="mt-2 text-muted-foreground">
              Try another category or browse all Charlotte-area vendors.
            </p>
            <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
              <Button
                onClick={() => {
                  setQuery("")
                  setChip("all")
                }}
                variant="default"
              >
                Browse All Trucks
              </Button>
              <Button asChild variant="outline">
                <Link href="/book-a-truck">Book a Truck</Link>
              </Button>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {filtered.map((truck) => (
              <TruckMarketplaceCard key={truck.id} truck={truck} />
            ))}
          </div>
        )}
      </div>

      {/* Footer CTAs */}
      <section className="border-t border-border/60 bg-gradient-to-b from-muted/40 to-background">
        <div className="mx-auto max-w-7xl px-4 py-14 sm:px-6 lg:px-8">
          <div className="rounded-2xl border border-border/80 bg-card p-8 shadow-sm md:p-12">
            <h2 className="font-display text-2xl font-bold text-foreground md:text-3xl">Planning an event?</h2>
            <p className="mt-4 max-w-2xl text-muted-foreground leading-relaxed">
              Tell us what you&apos;re hosting, and FoodTruckCLT can help connect you with Charlotte-area food truck
              vendors that fit your event, guest count, cuisine preferences, and location.
            </p>
            <div className="mt-6 flex flex-col gap-4 sm:flex-row sm:items-center">
              <Button size="lg" className="gap-2 rounded-full" asChild>
                <Link href="/book-a-truck">
                  Request Food Trucks
                  <ArrowRight className="h-4 w-4" />
                </Link>
              </Button>
            </div>
            <div className="mt-10 border-t border-border/60 pt-8">
              <p className="text-sm font-medium text-foreground">Run a Charlotte-area food truck?</p>
              <p className="mt-1 text-sm text-muted-foreground">List your truck for free.</p>
              <Button variant="outline" className="mt-4 rounded-full" asChild>
                <Link href="/list-your-truck">List Your Truck</Link>
              </Button>
            </div>
          </div>
        </div>
      </section>
    </>
  )
}

function TruckMarketplaceCard({ truck }: { truck: DirectoryTruckRow }) {
  const imageSrc = getTruckDisplayImage(truck.id, truck.photo_url)
  const tags = cuisineTagsForCard(truck)
  const profileHref = `/trucks/${truck.slug}`
  const bookHref = `/book-a-truck?truck=${encodeURIComponent(truck.id)}`

  const openNow = Boolean(truck.serving_today)
  const booking = Boolean(truck.catering)

  return (
    <article className="group flex h-full flex-col overflow-hidden rounded-2xl border border-border/70 bg-card shadow-sm transition-all duration-200 hover:-translate-y-1 hover:border-primary/30 hover:shadow-lg">
      <Link href={profileHref} className="relative block aspect-[4/3] overflow-hidden rounded-t-2xl">
        <Image
          src={imageSrc}
          alt={truck.name}
          fill
          sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
          className="object-cover transition duration-500 group-hover:scale-[1.04]"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent opacity-80" aria-hidden />
        <div className="absolute left-3 top-3 flex flex-wrap gap-1.5">
          {openNow ? (
            <Badge className="border-0 bg-emerald-600/95 text-white shadow-md backdrop-blur-sm">
              <span className="relative mr-1.5 inline-flex h-2 w-2">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-white opacity-75" />
                <span className="relative inline-flex h-2 w-2 rounded-full bg-white" />
              </span>
              Open Now
            </Badge>
          ) : booking ? (
            <Badge className="border-0 bg-primary/90 text-primary-foreground shadow-md backdrop-blur-sm">
              Available for Booking
            </Badge>
          ) : (
            <Badge variant="secondary" className="border border-background/20 bg-background/90 text-foreground shadow-md backdrop-blur-sm">
              Listed Vendor
            </Badge>
          )}
        </div>
      </Link>

      <div className="flex flex-1 flex-col p-5">
        <Link href={profileHref} className="hover:text-primary">
          <h3 className="font-display text-lg font-bold leading-snug text-foreground">{truck.name}</h3>
        </Link>

        <div className="mt-3 flex flex-wrap gap-1.5">
          {tags.map((tag) => (
            <Badge
              key={tag}
              variant="secondary"
              className="rounded-md border-0 bg-primary/10 px-2 py-0.5 text-xs font-medium text-foreground"
            >
              {tag}
            </Badge>
          ))}
        </div>

        <div className="mt-3 flex flex-wrap gap-1.5">
          {booking ? (
            <Badge variant="outline" className="rounded-md text-xs font-normal">
              Available for Booking
            </Badge>
          ) : null}
          <Badge variant="outline" className="rounded-md border-dashed text-xs font-normal text-muted-foreground">
            Charlotte Area
          </Badge>
        </div>

        <p className="mt-4 flex items-start gap-2 text-xs leading-relaxed text-muted-foreground">
          <MapPin className="mt-0.5 h-3.5 w-3.5 shrink-0 text-primary/70" aria-hidden />
          View profile for schedule and booking details.
        </p>

        <div className="mt-auto flex flex-col gap-2 pt-5">
          <Button className="w-full" asChild>
            <Link href={profileHref}>View Profile</Link>
          </Button>
          <Button variant="outline" className="w-full border-2" asChild>
            <Link href={bookHref}>Book This Truck</Link>
          </Button>
        </div>
      </div>
    </article>
  )
}
