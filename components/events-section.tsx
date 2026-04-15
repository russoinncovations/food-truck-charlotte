"use client"

import Image from "next/image"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Card } from "@/components/ui/card"
import { Calendar, MapPin, Clock, ArrowRight, Truck } from "lucide-react"
import { events, getTrucksForEvent, type Event } from "@/lib/data"

const typeLabels: Record<Event["type"], string> = {
  market: "Food Truck Market",
  brewery: "Brewery Event",
  festival: "Festival",
  private: "Private Event",
  corporate: "Corporate",
}

const typeColors: Record<Event["type"], string> = {
  market: "bg-blue-500/10 text-blue-700",
  brewery: "bg-amber-500/10 text-amber-700",
  festival: "bg-pink-500/10 text-pink-700",
  private: "bg-gray-500/10 text-gray-700",
  corporate: "bg-emerald-500/10 text-emerald-700",
}

export function EventsSection() {
  const featuredEvents = events.filter((e) => e.isFeatured).slice(0, 3)

  return (
    <section className="py-16 md:py-24">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="flex items-end justify-between mb-8">
          <div>
            <h2 className="font-display text-2xl md:text-3xl font-bold text-foreground">
              Coming up in Charlotte
            </h2>
            <p className="mt-2 text-muted-foreground">
              Brewery events, rallies, and festivals with food trucks.
            </p>
          </div>
          <Button variant="outline" asChild className="hidden md:flex">
            <Link href="/events" className="flex items-center gap-2">
              All {events.length} events
              <ArrowRight className="h-4 w-4" />
            </Link>
          </Button>
        </div>

        {/* Events Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {featuredEvents.map((event, index) => (
            <EventCard key={event.id} event={event} featured={index === 0} />
          ))}
        </div>

        {/* Mobile CTA */}
        <div className="mt-8 flex justify-center md:hidden">
          <Button variant="outline" asChild>
            <Link href="/events" className="flex items-center gap-2">
              See all {events.length} events
              <ArrowRight className="h-4 w-4" />
            </Link>
          </Button>
        </div>
      </div>
    </section>
  )
}

function EventCard({ event, featured = false }: { event: Event; featured?: boolean }) {
  const trucks = getTrucksForEvent(event.id)
  // Parse date parts directly from the date string to avoid timezone/hydration issues
  const [year, monthNum, dayNum] = event.date.split("-").map(Number)
  const eventDate = new Date(year, monthNum - 1, dayNum)
  const day = dayNum
  const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"]
  const weekdays = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"]
  const month = months[monthNum - 1]
  const weekday = weekdays[eventDate.getDay()]

  return (
    <Card
      className={`group overflow-hidden transition-all hover:shadow-lg hover:border-primary/50 ${
        featured ? "lg:col-span-2 lg:row-span-2" : ""
      }`}
    >
      <Link href={`/events/${event.slug}`} className="flex flex-col h-full">
        {/* Image */}
        <div className={`relative overflow-hidden ${featured ? "aspect-[16/9]" : "aspect-[16/10]"}`}>
          <Image
            src={event.image}
            alt={event.name}
            fill
            className="object-cover transition-transform duration-300 group-hover:scale-105"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-foreground/60 to-transparent" />

          {/* Date Badge */}
          <div className="absolute top-4 left-4 flex flex-col items-center bg-background rounded-lg px-3 py-2 shadow-lg">
            <span className="text-xs font-medium text-muted-foreground uppercase">{month}</span>
            <span className="text-2xl font-bold text-foreground leading-none">{day}</span>
            <span className="text-xs text-muted-foreground">{weekday}</span>
          </div>

          {/* Type Badge */}
          <div className="absolute top-4 right-4">
            <Badge className={`${typeColors[event.type]} border-0`}>
              {typeLabels[event.type]}
            </Badge>
          </div>

          {/* Featured Tag */}
          {event.isFeatured && featured && (
            <div className="absolute bottom-4 left-4">
              <Badge className="bg-primary text-primary-foreground border-0">
                Featured Event
              </Badge>
            </div>
          )}
        </div>

        {/* Content */}
        <div className={`flex flex-col flex-1 p-5 ${featured ? "p-6" : ""}`}>
          <h3 className={`font-display font-semibold text-foreground group-hover:text-primary transition-colors mb-2 ${
            featured ? "text-xl" : "text-lg"
          }`}>
            {event.name}
          </h3>

          {featured && (
            <p className="text-muted-foreground text-sm mb-4 line-clamp-2">
              {event.description}
            </p>
          )}

          <div className="mt-auto space-y-2">
            {/* Time */}
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Clock className="h-4 w-4 shrink-0" />
              <span>{event.startTime} - {event.endTime}</span>
            </div>

            {/* Location */}
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <MapPin className="h-4 w-4 shrink-0" />
              <span className="truncate">{event.location}</span>
            </div>

            {/* Trucks Attending */}
            <div className="flex items-center gap-2 text-sm">
              <Truck className="h-4 w-4 text-primary shrink-0" />
              <span className="text-foreground font-medium">
                {trucks.length} trucks attending
              </span>
            </div>
          </div>

          {/* Truck Avatars */}
          {featured && trucks.length > 0 && (
            <div className="mt-4 pt-4 border-t">
              <div className="flex items-center gap-2">
                <div className="flex -space-x-2">
                  {trucks.slice(0, 4).map((truck) => (
                    <div
                      key={truck.id}
                      className="relative h-8 w-8 rounded-full border-2 border-background overflow-hidden"
                    >
                      <Image
                        src={truck.image}
                        alt={truck.name}
                        fill
                        className="object-cover"
                      />
                    </div>
                  ))}
                  {trucks.length > 4 && (
                    <div className="flex h-8 w-8 items-center justify-center rounded-full border-2 border-background bg-muted text-xs font-medium">
                      +{trucks.length - 4}
                    </div>
                  )}
                </div>
                <span className="text-sm text-muted-foreground">
                  {trucks.slice(0, 2).map((t) => t.name).join(", ")}
                  {trucks.length > 2 && ` +${trucks.length - 2} more`}
                </span>
              </div>
            </div>
          )}
        </div>
      </Link>
    </Card>
  )
}
