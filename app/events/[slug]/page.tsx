import { Metadata } from "next"
import { notFound } from "next/navigation"
import Image from "next/image"
import Link from "next/link"
import { Header } from "@/components/header"
import { Footer } from "@/components/footer"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import {
  Calendar,
  MapPin,
  Clock,
  Truck,
  Share2,
  CalendarPlus,
  Navigation,
  Star,
  ChevronLeft,
  ArrowRight,
} from "lucide-react"
import { getEventBySlug, getTrucksForEvent, events, type Event } from "@/lib/data"

interface Props {
  params: Promise<{ slug: string }>
}

export async function generateStaticParams() {
  return events.map((event) => ({
    slug: event.slug,
  }))
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params
  const event = getEventBySlug(slug)

  if (!event) {
    return { title: "Event Not Found | FoodTruck CLT" }
  }

  return {
    title: `${event.name} | FoodTruck CLT`,
    description: event.description,
  }
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

export default async function EventDetailPage({ params }: Props) {
  const { slug } = await params
  const event = getEventBySlug(slug)

  if (!event) {
    notFound()
  }

  const trucks = getTrucksForEvent(event.id)
  const eventDate = new Date(event.date)

  return (
    <main className="min-h-screen bg-background">
      <Header />

      {/* Hero Section */}
      <section className="relative pt-16">
        <div className="relative h-64 md:h-96">
          <Image
            src={event.image}
            alt={event.name}
            fill
            className="object-cover"
            priority
          />
          <div className="absolute inset-0 bg-gradient-to-t from-background via-background/50 to-transparent" />
        </div>

        {/* Back Button */}
        <div className="absolute top-20 left-4 md:left-8">
          <Button variant="secondary" size="sm" asChild className="shadow-lg">
            <Link href="/events" className="flex items-center gap-1">
              <ChevronLeft className="h-4 w-4" />
              All Events
            </Link>
          </Button>
        </div>
      </section>

      {/* Main Content */}
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 -mt-24 relative z-10 pb-16">
        <div className="grid lg:grid-cols-3 gap-8">
          {/* Main Column */}
          <div className="lg:col-span-2 space-y-6">
            {/* Event Info Card */}
            <Card className="shadow-xl">
              <CardContent className="p-6">
                <div className="flex flex-wrap items-start justify-between gap-4">
                  <div>
                    {/* Type & Featured Badges */}
                    <div className="flex items-center gap-2 mb-3">
                      <Badge className={`${typeColors[event.type]} border-0`}>
                        {typeLabels[event.type]}
                      </Badge>
                      {event.isFeatured && (
                        <Badge className="bg-primary text-primary-foreground border-0">
                          Featured Event
                        </Badge>
                      )}
                    </div>

                    {/* Name */}
                    <h1 className="font-display text-3xl md:text-4xl font-bold text-foreground mb-4">
                      {event.name}
                    </h1>

                    {/* Key Info */}
                    <div className="space-y-3">
                      <div className="flex items-center gap-2 text-foreground">
                        <Calendar className="h-5 w-5 text-primary shrink-0" />
                        <span className="font-medium">
                          {eventDate.toLocaleDateString("en-US", {
                            weekday: "long",
                            month: "long",
                            day: "numeric",
                            year: "numeric",
                          })}
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Clock className="h-5 w-5 text-primary shrink-0" />
                        <span>{event.startTime} - {event.endTime}</span>
                      </div>
                      <div className="flex items-start gap-2">
                        <MapPin className="h-5 w-5 text-primary shrink-0 mt-0.5" />
                        <div>
                          <span className="font-medium text-foreground">{event.location}</span>
                          <p className="text-sm text-muted-foreground">{event.address}</p>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Action Buttons */}
                  <div className="flex gap-2">
                    <Button variant="outline" size="icon">
                      <Share2 className="h-4 w-4" />
                      <span className="sr-only">Share</span>
                    </Button>
                    <Button variant="outline" size="icon">
                      <CalendarPlus className="h-4 w-4" />
                      <span className="sr-only">Add to Calendar</span>
                    </Button>
                  </div>
                </div>

                {/* Description */}
                <p className="mt-6 text-muted-foreground leading-relaxed">
                  {event.description}
                </p>

                {/* CTA Buttons */}
                <div className="mt-6 pt-6 border-t flex flex-wrap gap-3">
                  <Button className="gap-2">
                    <Navigation className="h-4 w-4" />
                    Get Directions
                  </Button>
                  <Button variant="outline" className="gap-2">
                    <CalendarPlus className="h-4 w-4" />
                    Add to Calendar
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Attending Trucks */}
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="flex items-center gap-2">
                    <Truck className="h-5 w-5 text-primary" />
                    Food Trucks Attending ({trucks.length})
                  </CardTitle>
                  <Button variant="ghost" size="sm" asChild>
                    <Link href="/map" className="gap-1">
                      View on Map
                      <ArrowRight className="h-3.5 w-3.5" />
                    </Link>
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <div className="grid gap-4">
                  {trucks.map((truck) => (
                    <Link
                      key={truck.id}
                      href={`/trucks/${truck.slug}`}
                      className="flex items-center gap-4 p-4 rounded-lg border hover:bg-muted/50 hover:border-primary/50 transition-colors"
                    >
                      <div className="relative h-16 w-16 rounded-lg overflow-hidden shrink-0">
                        <Image
                          src={truck.image}
                          alt={truck.name}
                          fill
                          className="object-cover"
                        />
                      </div>
                      <div className="flex-1 min-w-0">
                        <h3 className="font-semibold text-foreground">{truck.name}</h3>
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                          <span>{truck.cuisine.join(", ")}</span>
                          <span>·</span>
                          <span>{truck.priceRange}</span>
                        </div>
                        <div className="flex items-center gap-1 text-sm mt-1">
                          <Star className="h-3.5 w-3.5 fill-accent text-accent" />
                          <span className="font-medium">{truck.rating}</span>
                          <span className="text-muted-foreground">
                            ({truck.reviewCount} reviews)
                          </span>
                        </div>
                      </div>
                      <Badge variant={truck.isOpen ? "default" : "secondary"}>
                        {truck.isOpen ? "Open" : "Closed"}
                      </Badge>
                    </Link>
                  ))}

                  {trucks.length === 0 && (
                    <div className="text-center py-8">
                      <Truck className="h-12 w-12 mx-auto text-muted-foreground/50 mb-4" />
                      <p className="text-muted-foreground">No trucks confirmed yet</p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Date Card */}
            <Card>
              <CardContent className="p-6">
                <div className="text-center">
                  <p className="text-sm text-muted-foreground uppercase tracking-wider">
                    {eventDate.toLocaleDateString("en-US", { month: "long" })}
                  </p>
                  <p className="text-6xl font-bold text-foreground my-2">
                    {eventDate.getDate()}
                  </p>
                  <p className="text-lg text-muted-foreground">
                    {eventDate.toLocaleDateString("en-US", { weekday: "long" })}
                  </p>
                  <div className="mt-4 pt-4 border-t">
                    <p className="text-sm text-muted-foreground">
                      {event.startTime} - {event.endTime}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Location Card */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <MapPin className="h-5 w-5 text-primary" />
                  Location
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="font-medium text-foreground mb-1">{event.location}</p>
                <p className="text-sm text-muted-foreground mb-4">{event.address}</p>
                <div className="aspect-video bg-muted rounded-lg mb-4 flex items-center justify-center">
                  <span className="text-muted-foreground text-sm">Map Preview</span>
                </div>
                <Button variant="outline" className="w-full gap-2">
                  <Navigation className="h-4 w-4" />
                  Get Directions
                </Button>
              </CardContent>
            </Card>

            {/* Host Similar Event */}
            <Card className="bg-primary/5 border-primary/20">
              <CardHeader>
                <CardTitle className="text-lg">Host a Similar Event</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground mb-4">
                  Want to bring food trucks to your community, office, or venue? 
                  We can help you plan the perfect food truck event.
                </p>
                <Button className="w-full" asChild>
                  <Link href="/book-trucks">
                    Plan Your Event
                  </Link>
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>

      <Footer />
    </main>
  )
}
