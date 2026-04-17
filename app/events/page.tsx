import { Metadata } from "next"
import Link from "next/link"
import Image from "next/image"
import { Header } from "@/components/header"
import { Footer } from "@/components/footer"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Card } from "@/components/ui/card"
import { Calendar, MapPin, ArrowRight, Plus } from "lucide-react"
import { createClient } from "@/lib/supabase/server"

export const metadata: Metadata = {
  title: "Food Truck Events in Charlotte | FoodTruck CLT",
  description:
    "Discover food truck rallies, brewery pop-ups, and festivals happening across Charlotte, NC. Find events with multiple food trucks near you.",
}

const EVENT_IMAGE_PLACEHOLDER =
  "https://images.unsplash.com/photo-1687351977296-e909232009b4?w=400&h=300&fit=crop"

type EventRow = {
  id: string
  title: string
  slug: string
  location_name: string | null
  address: string | null
  date: string
  description: string | null
  image_url: string | null
  featured: boolean | null
  active: boolean | null
}

function EventCard({ event }: { event: EventRow }) {
  const eventDate = new Date(event.date)
  const day = eventDate.getDate()
  const month = eventDate.toLocaleDateString("en-US", { month: "short" })
  const weekday = eventDate.toLocaleDateString("en-US", { weekday: "short" })
  const imageSrc = event.image_url?.trim() || EVENT_IMAGE_PLACEHOLDER
  const locationLine = [event.location_name, event.address].filter(Boolean).join(" · ")

  return (
    <Card className="group overflow-hidden hover:shadow-lg hover:border-primary/50 transition-all">
      <Link href={`/events/${event.slug}`} className="flex flex-col h-full">
        <div className="relative aspect-[16/10] overflow-hidden">
          <Image
            src={imageSrc}
            alt={event.title}
            fill
            className="object-cover transition-transform duration-300 group-hover:scale-105"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-foreground/60 to-transparent" />

          <div className="absolute top-4 left-4 flex flex-col items-center bg-background rounded-lg px-3 py-2 shadow-lg">
            <span className="text-xs font-medium text-muted-foreground uppercase">{month}</span>
            <span className="text-2xl font-bold text-foreground leading-none">{day}</span>
            <span className="text-xs text-muted-foreground">{weekday}</span>
          </div>

          {event.featured ? (
            <div className="absolute top-4 right-4">
              <Badge className="bg-primary text-primary-foreground border-0">Featured</Badge>
            </div>
          ) : null}
        </div>

        <div className="flex flex-col flex-1 p-5">
          <h3 className="font-display font-semibold text-lg text-foreground group-hover:text-primary transition-colors mb-2">
            {event.title}
          </h3>

          <div className="space-y-2 mb-4">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Calendar className="h-4 w-4 shrink-0" />
              <span>
                {eventDate.toLocaleDateString("en-US", {
                  weekday: "long",
                  month: "long",
                  day: "numeric",
                  year: "numeric",
                })}
              </span>
            </div>
            {locationLine ? (
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <MapPin className="h-4 w-4 shrink-0" />
                <span className="line-clamp-2">{locationLine}</span>
              </div>
            ) : null}
          </div>

          {event.description ? (
            <p className="text-sm text-muted-foreground line-clamp-3 mb-4">{event.description}</p>
          ) : null}

          <div className="mt-auto flex justify-end">
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

export default async function EventsPage() {
  const supabase = await createClient()
  const { data: events } = await supabase
    .from("events")
    .select(
      "id, title, slug, location_name, address, date, description, image_url, featured, active"
    )
    .eq("active", true)
    .order("date", { ascending: true })

  const list = (events ?? []) as EventRow[]

  return (
    <main className="min-h-screen bg-background">
      <Header />

      <div className="pt-24 pb-16">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-4 mb-8">
            <div>
              <h1 className="font-display text-4xl font-bold text-foreground">Food Truck Events</h1>
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

          {list.length === 0 ? (
            <p className="text-muted-foreground py-12 text-center">
              No upcoming events yet. Check back soon.
            </p>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {list.map((event) => (
                <EventCard key={event.id} event={event} />
              ))}
            </div>
          )}
        </div>
      </div>

      <Footer />
    </main>
  )
}
