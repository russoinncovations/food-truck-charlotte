"use client"

import Image from "next/image"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent } from "@/components/ui/card"
import { Star, MapPin, Clock, ArrowRight, Sparkles } from "lucide-react"
import { foodTrucks, type FoodTruck } from "@/lib/data"

export function FeaturedTrucks() {
  const featured = foodTrucks.filter((t) => t.isFeatured).slice(0, 4)

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
              All {foodTrucks.length} trucks
              <ArrowRight className="h-4 w-4" />
            </Link>
          </Button>
        </div>

        {/* Truck Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {featured.map((truck) => (
            <TruckCard key={truck.id} truck={truck} />
          ))}
        </div>

        {/* Mobile CTA */}
        <div className="mt-8 flex justify-center md:hidden">
          <Button variant="outline" asChild>
            <Link href="/trucks" className="flex items-center gap-2">
              Browse all {foodTrucks.length} trucks
              <ArrowRight className="h-4 w-4" />
            </Link>
          </Button>
        </div>
      </div>
    </section>
  )
}

function TruckCard({ truck }: { truck: FoodTruck }) {
  const nextStop = truck.schedule[0]

  return (
    <Card className="group overflow-hidden transition-all hover:shadow-lg hover:border-primary/50">
      <Link href={`/trucks/${truck.slug}`}>
        {/* Image */}
        <div className="relative aspect-[4/3] overflow-hidden">
          <Image
            src={truck.image}
            alt={truck.name}
            fill
            className="object-cover transition-transform duration-300 group-hover:scale-105"
          />
          {/* Status Badge */}
          <div className="absolute top-3 left-3">
            {truck.isOpen ? (
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
          {/* Review Count Badge */}
          {truck.reviewCount > 300 && (
            <div className="absolute top-3 right-3">
              <Badge variant="secondary" className="backdrop-blur-sm">
                {truck.reviewCount}+ reviews
              </Badge>
            </div>
          )}
        </div>

        {/* Content */}
        <CardContent className="p-4">
          {/* Cuisine Tags */}
          <div className="flex flex-wrap gap-1 mb-2">
            {truck.cuisine.slice(0, 2).map((c) => (
              <span
                key={c}
                className="text-xs text-muted-foreground bg-muted px-2 py-0.5 rounded-full"
              >
                {c}
              </span>
            ))}
          </div>

          {/* Name & Rating */}
          <div className="flex items-start justify-between gap-2 mb-2">
            <h3 className="font-display font-semibold text-foreground group-hover:text-primary transition-colors">
              {truck.name}
            </h3>
            <div className="flex items-center gap-1 text-sm shrink-0">
              <Star className="h-4 w-4 fill-accent text-accent" />
              <span className="font-medium">{truck.rating}</span>
            </div>
          </div>

          {/* Price Range */}
          <p className="text-sm text-muted-foreground mb-3">
            {truck.priceRange} · {truck.reviewCount} reviews
          </p>

          {/* Next Location */}
          {nextStop && (
            <div className="pt-3 border-t">
              <p className="text-xs text-muted-foreground mb-1">Next stop</p>
              <div className="flex items-center gap-1 text-sm">
                <MapPin className="h-3.5 w-3.5 text-primary shrink-0" />
                <span className="truncate">{nextStop.location}</span>
              </div>
              <div className="flex items-center gap-1 text-xs text-muted-foreground mt-1">
                <Clock className="h-3 w-3" />
                <span>{nextStop.startTime} - {nextStop.endTime}</span>
              </div>
            </div>
          )}
        </CardContent>
      </Link>
    </Card>
  )
}
