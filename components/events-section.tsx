"use client"

import { useEffect, useState } from "react"
import Image from "next/image"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Card } from "@/components/ui/card"
import { MapPin, ArrowRight } from "lucide-react"
import { createClient } from "@/lib/supabase/client"
import { publicUpcomingEventsBase } from "@/lib/events/public-events"

const FALLBACK_IMAGE =
  "https://images.unsplash.com/photo-1687351977296-e909232009b4?w=400&h=300&fit=crop"

type EventRow = {
  id: string
  title: string
  slug: string
  location_name: string | null
  date: string
  description: string | null
  image_url: string | null
  active: boolean | null
}

function formatEventDateParts(dateStr: string) {
  const [year, monthNum, dayNum] = dateStr.split("-").map(Number)
  const eventDate = new Date(year, monthNum - 1, dayNum)
  const day = dayNum
  const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"]
  const weekdays = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"]
  const month = months[monthNum - 1]
  const weekday = weekdays[eventDate.getDay()]
  const longDate = eventDate.toLocaleDateString("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
    year: "numeric",
  })
  return { day, month, weekday, longDate }
}

export function EventsSection() {
  const [events, setEvents] = useState<EventRow[]>([])

  useEffect(() => {
    let cancelled = false

    async function load() {
      const supabase = createClient()
      const { data } = await publicUpcomingEventsBase(supabase)
        .select("id, title, slug, location_name, date, description, image_url, active")
        .order("date", { ascending: true })
        .limit(3)

      if (!cancelled) {
        setEvents((data as EventRow[] | null) ?? [])
      }
    }

    void load()
    return () => {
      cancelled = true
    }
  }, [])

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
              All events
              <ArrowRight className="h-4 w-4" />
            </Link>
          </Button>
        </div>

        {/* Events Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {events.map((event, index) => (
            <EventCard key={event.id} event={event} featured={index === 0} />
          ))}
        </div>

        {/* Mobile CTA */}
        <div className="mt-8 flex justify-center md:hidden">
          <Button variant="outline" asChild>
            <Link href="/events" className="flex items-center gap-2">
              See all events
              <ArrowRight className="h-4 w-4" />
            </Link>
          </Button>
        </div>
      </div>
    </section>
  )
}

function EventCard({ event, featured = false }: { event: EventRow; featured?: boolean }) {
  const { day, month, weekday, longDate } = formatEventDateParts(event.date)
  const imageSrc = event.image_url?.trim() || FALLBACK_IMAGE

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
            src={imageSrc}
            alt={event.title}
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
            <Badge variant="secondary" className="border-0 backdrop-blur-sm">
              Event
            </Badge>
          </div>
        </div>

        {/* Content */}
        <div className={`flex flex-col flex-1 p-5 ${featured ? "p-6" : ""}`}>
          <h3
            className={`font-display font-semibold text-foreground group-hover:text-primary transition-colors mb-2 ${
              featured ? "text-xl" : "text-lg"
            }`}
          >
            {event.title}
          </h3>

          <p className="text-sm text-muted-foreground mb-2">{longDate}</p>

          {event.description?.trim() ? (
            <p
              className={`text-muted-foreground text-sm mb-4 ${
                featured ? "line-clamp-3" : "line-clamp-2"
              }`}
            >
              {event.description.trim()}
            </p>
          ) : null}

          <div className="mt-auto space-y-2">
            {/* Location */}
            {event.location_name ? (
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <MapPin className="h-4 w-4 shrink-0" />
                <span className="truncate">{event.location_name}</span>
              </div>
            ) : null}
          </div>
        </div>
      </Link>
    </Card>
  )
}
