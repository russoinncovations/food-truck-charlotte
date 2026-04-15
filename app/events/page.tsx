import { Metadata } from "next"
import Link from "next/link"
import Image from "next/image"
import { Header } from "@/components/header"
import { Footer } from "@/components/footer"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Card } from "@/components/ui/card"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Calendar, MapPin, Clock, Truck, ArrowRight, Plus } from "lucide-react"
import { events, getTrucksForEvent, type Event } from "@/lib/data"

export const metadata: Metadata = {
  title: "Food Truck Events in Charlotte | FoodTruck CLT",
  description: "Discover food truck rallies, brewery pop-ups, and festivals happening across Charlotte, NC. Find events with multiple food trucks near you.",
}

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

export default function EventsPage() {
  const featuredEvents = events.filter((e) => e.isFeatured)
  const allEvents = events

  return (
    <main className="min-h-screen bg-background">
      <Header />

      <div className="pt-24 pb-16">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          {/* Page Header */}
          <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-4 mb-8">
            <div>
              <h1 className="font-display text-4xl font-bold text-foreground">
                Food Truck Events
              </h1>
              <p className="mt-2 text-muted-foreground">
                Discover food truck rallies, brewery pop-ups, and festivals across Charlotte
              </p>
            </div>
            <Button asChild>
              <Link href="/book-trucks" className="flex items-center gap-2">
                <Plus className="h-4 w-4" />
                Host an Event
              </Link>
            </Button>
          </div>

          {/* Filter Tabs */}
          <Tabs defaultValue="all" className="mb-8">
            <TabsList>
              <TabsTrigger value="all">All Events</TabsTrigger>
              <TabsTrigger value="today">Today</TabsTrigger>
              <TabsTrigger value="weekend">This Weekend</TabsTrigger>
              <TabsTrigger value="featured">Featured</TabsTrigger>
            </TabsList>
          </Tabs>

          {/* Featured Event Banner */}
          {featuredEvents[0] && (
            <div className="mb-12">
              <FeaturedEventCard event={featuredEvents[0]} />
            </div>
          )}

          {/* Event Type Filters */}
          <div className="mb-6 flex flex-wrap gap-2">
            <Button variant="default" size="sm">All Types</Button>
            <Button variant="outline" size="sm">Markets</Button>
            <Button variant="outline" size="sm">Brewery Events</Button>
            <Button variant="outline" size="sm">Festivals</Button>
          </div>

          {/* Events Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {allEvents.map((event) => (
              <EventCard key={event.id} event={event} />
            ))}
          </div>

          {/* Load More */}
          <div className="mt-12 text-center">
            <Button variant="outline" size="lg">
              Load More Events
            </Button>
          </div>
        </div>
      </div>

      <Footer />
    </main>
  )
}

function FeaturedEventCard({ event }: { event: Event }) {
  const trucks = getTrucksForEvent(event.id)
  const eventDate = new Date(event.date)

  return (
    <Card className="overflow-hidden">
      <Link href={`/events/${event.slug}`} className="grid md:grid-cols-2">
        {/* Image */}
        <div className="relative aspect-[16/9] md:aspect-auto md:min-h-[400px]">
          <Image
            src={event.image}
            alt={event.name}
            fill
            className="object-cover"
          />
          <div className="absolute top-4 left-4">
            <Badge className="bg-primary text-primary-foreground border-0">
              Featured Event
            </Badge>
          </div>
        </div>

        {/* Content */}
        <div className="p-6 md:p-8 flex flex-col">
          <Badge className={`${typeColors[event.type]} border-0 w-fit mb-4`}>
            {typeLabels[event.type]}
          </Badge>

          <h2 className="font-display text-2xl md:text-3xl font-bold text-foreground mb-4">
            {event.name}
          </h2>

          <p className="text-muted-foreground mb-6 line-clamp-3">
            {event.description}
          </p>

          <div className="space-y-3 mb-6">
            <div className="flex items-center gap-2 text-sm">
              <Calendar className="h-4 w-4 text-primary shrink-0" />
              <span>
                {eventDate.toLocaleDateString("en-US", {
                  weekday: "long",
                  month: "long",
                  day: "numeric",
                  year: "numeric",
                })}
              </span>
            </div>
            <div className="flex items-center gap-2 text-sm">
              <Clock className="h-4 w-4 text-primary shrink-0" />
              <span>{event.startTime} - {event.endTime}</span>
            </div>
            <div className="flex items-center gap-2 text-sm">
              <MapPin className="h-4 w-4 text-primary shrink-0" />
              <span>{event.location}</span>
            </div>
            <div className="flex items-center gap-2 text-sm">
              <Truck className="h-4 w-4 text-primary shrink-0" />
              <span className="font-medium">{trucks.length} food trucks attending</span>
            </div>
          </div>

          {/* Truck Avatars */}
          {trucks.length > 0 && (
            <div className="flex items-center gap-3 mb-6">
              <div className="flex -space-x-2">
                {trucks.slice(0, 5).map((truck) => (
                  <div
                    key={truck.id}
                    className="relative h-10 w-10 rounded-full border-2 border-background overflow-hidden"
                  >
                    <Image
                      src={truck.image}
                      alt={truck.name}
                      fill
                      className="object-cover"
                    />
                  </div>
                ))}
                {trucks.length > 5 && (
                  <div className="flex h-10 w-10 items-center justify-center rounded-full border-2 border-background bg-muted text-sm font-medium">
                    +{trucks.length - 5}
                  </div>
                )}
              </div>
              <span className="text-sm text-muted-foreground">
                {trucks.slice(0, 2).map((t) => t.name).join(", ")}
                {trucks.length > 2 && ` and ${trucks.length - 2} more`}
              </span>
            </div>
          )}

          <div className="mt-auto flex gap-3">
            <Button className="flex-1 gap-2">
              View Event Details
              <ArrowRight className="h-4 w-4" />
            </Button>
            <Button variant="outline">Add to Calendar</Button>
          </div>
        </div>
      </Link>
    </Card>
  )
}

function EventCard({ event }: { event: Event }) {
  const trucks = getTrucksForEvent(event.id)
  const eventDate = new Date(event.date)
  const day = eventDate.getDate()
  const month = eventDate.toLocaleDateString("en-US", { month: "short" })
  const weekday = eventDate.toLocaleDateString("en-US", { weekday: "short" })

  return (
    <Card className="group overflow-hidden hover:shadow-lg hover:border-primary/50 transition-all">
      <Link href={`/events/${event.slug}`} className="flex flex-col h-full">
        {/* Image */}
        <div className="relative aspect-[16/10] overflow-hidden">
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
        </div>

        {/* Content */}
        <div className="flex flex-col flex-1 p-5">
          <h3 className="font-display font-semibold text-lg text-foreground group-hover:text-primary transition-colors mb-2">
            {event.name}
          </h3>

          <div className="space-y-2 mb-4">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Clock className="h-4 w-4 shrink-0" />
              <span>{event.startTime} - {event.endTime}</span>
            </div>
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <MapPin className="h-4 w-4 shrink-0" />
              <span className="truncate">{event.location}</span>
            </div>
          </div>

          <div className="mt-auto flex items-center justify-between">
            <div className="flex items-center gap-2 text-sm">
              <Truck className="h-4 w-4 text-primary shrink-0" />
              <span className="font-medium text-foreground">
                {trucks.length} trucks
              </span>
            </div>
            <Button variant="ghost" size="sm" className="gap-1">
              Details
              <ArrowRight className="h-3.5 w-3.5" />
            </Button>
          </div>
        </div>
      </Link>
    </Card>
  )
}
