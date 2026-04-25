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
  Share2,
  CalendarPlus,
  Navigation,
  ChevronLeft,
} from "lucide-react"
import { createClient } from "@/lib/supabase/server"

const HERO_IMAGE_FALLBACK =
  "https://images.unsplash.com/photo-1687351977296-e909232009b4?w=400&h=300&fit=crop"

interface Props {
  params: Promise<{ slug: string }>
}

type EventTypeKey = "market" | "brewery" | "festival" | "private" | "corporate"

const typeLabels: Record<EventTypeKey, string> = {
  market: "Food Truck Market",
  brewery: "Brewery Event",
  festival: "Festival",
  private: "Private Event",
  corporate: "Corporate",
}

const typeColors: Record<EventTypeKey, string> = {
  market: "bg-blue-500/10 text-blue-700",
  brewery: "bg-amber-500/10 text-amber-700",
  festival: "bg-pink-500/10 text-pink-700",
  private: "bg-gray-500/10 text-gray-700",
  corporate: "bg-emerald-500/10 text-emerald-700",
}

function isEventTypeKey(x: string): x is EventTypeKey {
  return x in typeLabels
}

async function fetchEventBySlug(slug: string) {
  const supabase = await createClient()
  const { data } = await supabase
    .from("events")
    .select("*")
    .eq("slug", slug)
    .eq("active", true)
    .single()
  return data
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params
  const event = await fetchEventBySlug(slug)

  if (!event) {
    return { title: "Event Not Found | FoodTruck CLT" }
  }

  const row = event as Record<string, unknown>
  const title = String(row.title ?? "")
  const description = (row.description as string | null) ?? ""

  return {
    title: `${title} | FoodTruck CLT`,
    description,
  }
}

export default async function EventDetailPage({ params }: Props) {
  const { slug } = await params
  const event = await fetchEventBySlug(slug)

  if (!event) {
    notFound()
  }

  const row = event as Record<string, unknown>
  const title = String(row.title ?? "")
  const locationName = (row.location_name as string | null) ?? ""
  const address = (row.address as string | null) ?? ""
  const description = (row.description as string | null) ?? ""
  const dateStr = String(row.date ?? "")
  const eventDate = new Date(dateStr)
  const startTime = (row.start_time as string | null) ?? ""
  const endTime = (row.end_time as string | null) ?? ""
  const timeRange =
    startTime && endTime ? `${startTime} - ${endTime}` : startTime || endTime || ""
  const imageUrl = (row.image_url as string | null)?.trim()
  const heroSrc = imageUrl || HERO_IMAGE_FALLBACK
  const isFeatured = Boolean(row.featured ?? row.is_featured)
  const rawEventType = ((row.event_type as string | null) ?? "").toLowerCase()
  const eventTypeKey: EventTypeKey | null = isEventTypeKey(rawEventType) ? rawEventType : null

  return (
    <main className="min-h-screen bg-background">
      <Header />

      {/* Hero Section */}
      <section className="relative pt-16">
        <div className="relative h-64 md:h-96">
          <Image
            src={heroSrc}
            alt={title}
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
                      {eventTypeKey ? (
                        <Badge className={`${typeColors[eventTypeKey]} border-0`}>
                          {typeLabels[eventTypeKey]}
                        </Badge>
                      ) : (
                        <Badge className="bg-muted text-muted-foreground border-0">Event</Badge>
                      )}
                      {isFeatured && (
                        <Badge className="bg-primary text-primary-foreground border-0">
                          Featured Event
                        </Badge>
                      )}
                    </div>

                    {/* Name */}
                    <h1 className="font-display text-3xl md:text-4xl font-bold text-foreground mb-4">
                      {title}
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
                      {timeRange ? (
                        <div className="flex items-center gap-2">
                          <Clock className="h-5 w-5 text-primary shrink-0" />
                          <span>{timeRange}</span>
                        </div>
                      ) : null}
                      <div className="flex items-start gap-2">
                        <MapPin className="h-5 w-5 text-primary shrink-0 mt-0.5" />
                        <div>
                          <span className="font-medium text-foreground">{locationName}</span>
                          {address ? (
                            <p className="text-sm text-muted-foreground">{address}</p>
                          ) : null}
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
                <p className="mt-6 text-muted-foreground leading-relaxed whitespace-pre-wrap">
                  {description}
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
                  {timeRange ? (
                    <div className="mt-4 pt-4 border-t">
                      <p className="text-sm text-muted-foreground">{timeRange}</p>
                    </div>
                  ) : null}
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
                <p className="font-medium text-foreground mb-1">{locationName}</p>
                {address ? (
                  <p className="text-sm text-muted-foreground mb-4">{address}</p>
                ) : null}
                <div className="aspect-video bg-muted rounded-lg mb-4 flex items-center justify-center">
                  <span className="text-muted-foreground text-sm">Map Preview</span>
                </div>
                <Button variant="outline" className="w-full gap-2">
                  <Navigation className="h-4 w-4" />
                  Get Directions
                </Button>
              </CardContent>
            </Card>

            {/* Book a Truck for Your Event */}
            <Card className="bg-primary/5 border-primary/20">
              <CardHeader>
                <CardTitle className="text-lg">Book a Truck for Your Event</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground mb-4">
                  Want to bring food trucks to your community, office, or venue? We can help you
                  plan the perfect food truck event.
                </p>
                <Button className="w-full" asChild>
                  <Link href="/book-a-truck">Book a Truck for Your Event</Link>
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
