"use client"

import { useEffect, useState } from "react"
import Image from "next/image"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent } from "@/components/ui/card"
import { MapPin, ArrowRight } from "lucide-react"
import { createClient } from "@/lib/supabase/client"

const TRUCK_IMAGES = [
  "https://images.unsplash.com/photo-1687351977296-e909232009b4?w=400&h=300&fit=crop",
  "https://images.unsplash.com/photo-1509315811345-672d83ef2fbc?w=400&h=300&fit=crop",
  "https://images.unsplash.com/photo-1626186241349-5d5f44407f55?w=400&h=300&fit=crop",
  "https://images.unsplash.com/photo-1563861019306-9cccb83bdf0c?w=400&h=300&fit=crop",
  "https://images.unsplash.com/photo-1519861155730-0b5fbf0dd889?w=400&h=300&fit=crop",
  "https://images.unsplash.com/photo-1726868734684-ce396eef668e?w=400&h=300&fit=crop",
  "https://images.unsplash.com/photo-1669039415113-48f87a568fdd?w=400&h=300&fit=crop",
]

function getTruckImage(truckId: string): string {
  const index =
    truckId.split("").reduce((acc, c) => acc + c.charCodeAt(0), 0) % TRUCK_IMAGES.length
  return TRUCK_IMAGES[index]
}

type FeaturedTruckRow = {
  id: string
  name: string
  slug: string
  cuisine: string | string[] | null
  serving_today: boolean | null
  today_location: string | null
  show_in_directory: boolean | null
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
        .select("id, name, slug, cuisine, serving_today, today_location, show_in_directory")
        .eq("show_in_directory", true)
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

  return (
    <Card className="group overflow-hidden transition-all hover:shadow-lg hover:border-primary/50">
      <Link href={`/trucks/${truck.slug}`}>
        {/* Image */}
        <div className="relative aspect-[4/3] overflow-hidden">
          <Image
            src={getTruckImage(truck.id)}
            alt={truck.name}
            fill
            className="object-cover transition-transform duration-300 group-hover:scale-105"
          />
          {/* Status Badge */}
          <div className="absolute top-3 left-3">
            {servingToday ? (
              <Badge className="bg-green-500/90 text-white border-0 backdrop-blur-sm">
                <span className="relative mr-1.5 flex h-2 w-2">
                  <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-white opacity-75" />
                  <span className="relative inline-flex h-2 w-2 rounded-full bg-white" />
                </span>
                Open Now
              </Badge>
            ) : (
              <Badge variant="secondary" className="backdrop-blur-sm">
                Closed
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
