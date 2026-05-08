"use client"

import { useEffect, useState } from "react"
import Image from "next/image"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent } from "@/components/ui/card"
import { MapPin, ArrowRight } from "lucide-react"
import { createClient } from "@/lib/supabase/client"
import { getTruckDisplayImage } from "@/lib/trucks/truck-display-image"

type FeaturedTruckRow = {
  id: string
  name: string
  slug: string
  cuisine: string | string[] | null
  serving_today: boolean | null
  today_location: string | null
  show_in_directory: boolean | null
  photo_url: string | null
  catering: boolean | null
}

function cuisineTagsForTruck(truck: FeaturedTruckRow): string[] {
  const raw = truck.cuisine
  const list = Array.isArray(raw) ? raw : raw ? [raw] : []
  return list.filter(Boolean).slice(0, 2)
}

export function FeaturedTrucks() {
  const [trucks, setTrucks] = useState<FeaturedTruckRow[]>([])

  useEffect(() => {
    let cancelled = false

    async function load() {
      const supabase = createClient()
      const { data } = await supabase
        .from("trucks")
        .select("id, name, slug, cuisine, serving_today, today_location, show_in_directory, photo_url, catering")
        .eq("show_in_directory", true)
        .eq("status", "active")
        .eq("is_active", true)
        .limit(4)

      if (!cancelled) {
        setTrucks((data as FeaturedTruckRow[] | null) ?? [])
      }
    }

    void load()
    return () => {
      cancelled = true
    }
  }, [])

  return (
    <section className="py-16 md:py-24 bg-muted/30">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="flex items-end justify-between mb-8">
          <div>
            <h2 className="font-display text-2xl md:text-3xl font-bold text-foreground">
              Popular in Charlotte
            </h2>
            <p className="mt-2 text-muted-foreground">
              Trucks with consistently great reviews from local food lovers.
            </p>
          </div>
          <Button variant="outline" asChild className="hidden md:flex">
            <Link href="/trucks" className="flex items-center gap-2">
              All Trucks
              <ArrowRight className="h-4 w-4" />
            </Link>
          </Button>
        </div>

        {/* Truck Grid */}
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

function TruckCard({ truck }: { truck: FeaturedTruckRow }) {
  const cuisineTags = cuisineTagsForTruck(truck)
  const servingToday = Boolean(truck.serving_today)
  const showTodayLocation = servingToday && Boolean(truck.today_location?.trim())
  const imageSrc = getTruckDisplayImage(truck.id, truck.photo_url)
  const booking = Boolean(truck.catering)

  return (
    <Card className="group overflow-hidden transition-all hover:shadow-lg hover:border-primary/50">
      <Link href={`/trucks/${truck.slug}`}>
        {/* Image */}
        <div className="relative aspect-[4/3] overflow-hidden">
          <Image
            src={imageSrc}
            alt={truck.name}
            fill
            className="object-cover transition-transform duration-300 group-hover:scale-105"
          />
          {/* Status badge — browse context: no "Closed" */}
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

        {/* Content */}
        <CardContent className="p-4">
          {/* Cuisine Tags */}
          <div className="flex flex-wrap gap-1 mb-2">
            {cuisineTags.map((c) => (
              <span
                key={c}
                className="text-xs text-muted-foreground bg-muted px-2 py-0.5 rounded-full"
              >
                {c}
              </span>
            ))}
          </div>

          {/* Name */}
          <div className="flex items-start justify-between gap-2 mb-2">
            <h3 className="font-display font-semibold text-foreground group-hover:text-primary transition-colors">
              {truck.name}
            </h3>
          </div>

          {/* Next Location */}
          {showTodayLocation && (
            <div className="pt-3 border-t">
              <p className="text-xs text-muted-foreground mb-1">Next stop</p>
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
