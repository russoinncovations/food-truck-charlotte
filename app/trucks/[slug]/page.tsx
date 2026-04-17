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
  MapPin,
  Phone,
  Globe,
  ExternalLink,
  ChevronLeft,
} from "lucide-react"
import { createClient } from "@/lib/supabase/server"

const TRUCK_IMAGES = [
  "https://images.unsplash.com/photo-1565958011703-44f9829ba187?w=400&h=300&fit=crop",
  "https://images.unsplash.com/photo-1619566636858-adf3ef46400b?w=400&h=300&fit=crop",
  "https://images.unsplash.com/photo-1524492412937-b28074a5d7da?w=400&h=300&fit=crop",
  "https://images.unsplash.com/photo-1617196034183-421b4040ed20?w=400&h=300&fit=crop",
  "https://images.unsplash.com/photo-1534790566855-4cb788d389ec?w=400&h=300&fit=crop",
  "https://images.unsplash.com/photo-1512689189935-c6c80733a4d4?w=400&h=300&fit=crop",
  "https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=400&h=300&fit=crop",
  "https://images.unsplash.com/photo-1600891964599-f61ba0e24092?w=400&h=300&fit=crop",
]

function getTruckImage(truckId: string): string {
  const index =
    truckId.split("").reduce((acc, c) => acc + c.charCodeAt(0), 0) % TRUCK_IMAGES.length
  return TRUCK_IMAGES[index]
}

interface Props {
  params: Promise<{ slug: string }>
}

function normalizeWebsiteUrl(url: string): string {
  const trimmed = url.trim()
  if (!trimmed) return trimmed
  if (/^https?:\/\//i.test(trimmed)) return trimmed
  return `https://${trimmed}`
}

function instagramHref(handle: string): string {
  const t = handle.trim().replace(/^@/, "")
  if (!t) return "#"
  if (/^https?:\/\//i.test(t)) return t
  return `https://instagram.com/${t}`
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params
  const supabase = await createClient()
  const { data: truck } = await supabase
    .from("trucks")
    .select("name, short_description, description, full_description")
    .eq("slug", slug)
    .single()

  if (!truck) {
    return { title: "Truck Not Found | FoodTruck CLT" }
  }

  const description =
    (truck.short_description as string | null) ??
    (truck.description as string | null) ??
    (truck.full_description as string | null) ??
    ""

  return {
    title: `${truck.name} | FoodTruck CLT`,
    description: description || `${truck.name} on FoodTruck CLT`,
  }
}

export default async function TruckProfilePage({ params }: Props) {
  const { slug } = await params
  const supabase = await createClient()
  const { data: truck } = await supabase.from("trucks").select("*").eq("slug", slug).single()

  if (!truck) {
    notFound()
  }

  const row = truck as Record<string, unknown>
  const name = String(row.name ?? "")
  const cuisineRaw = row.cuisine
  const cuisineTags: string[] = Array.isArray(cuisineRaw)
    ? (cuisineRaw as string[]).filter(Boolean)
    : cuisineRaw
      ? [String(cuisineRaw)]
      : []

  const bio =
    (row.short_description as string | null | undefined) ??
    (row.description as string | null | undefined) ??
    ""

  const website = row.website as string | null | undefined
  const instagram = row.instagram as string | null | undefined
  const phone =
    (row.phone as string | null | undefined) ||
    (row.booking_phone as string | null | undefined) ||
    null

  const servingToday = Boolean(row.serving_today)
  const todayLocation = (row.today_location as string | null | undefined) ?? null
  const priceRange = (row.price_range as string | null | undefined) ?? null
  const tagline = (row.tagline as string | null | undefined) ?? null

  return (
    <main className="min-h-screen bg-background">
      <Header />

      <section className="relative pt-16">
        <div className="relative h-64 md:h-96">
          <Image
            src={getTruckImage(String(row.id))}
            alt={name}
            fill
            className="object-cover"
            priority
          />
          <div className="absolute inset-0 bg-gradient-to-t from-background via-background/50 to-transparent" />
        </div>

        <div className="absolute top-20 left-4 md:left-8">
          <Button variant="secondary" size="sm" asChild className="shadow-lg">
            <Link href="/trucks" className="flex items-center gap-1">
              <ChevronLeft className="h-4 w-4" />
              All Trucks
            </Link>
          </Button>
        </div>
      </section>

      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 -mt-24 relative z-10 pb-16">
        <div className="grid lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-6">
            <Card className="shadow-xl">
              <CardContent className="p-6">
                <div className="flex flex-wrap items-start justify-between gap-4">
                  <div className="space-y-3">
                    <div className="flex flex-wrap items-center gap-2">
                      {servingToday ? (
                        <Badge className="bg-green-500 text-white border-0">
                          <span className="relative mr-1.5 flex h-2 w-2">
                            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-white opacity-75" />
                            <span className="relative inline-flex h-2 w-2 rounded-full bg-white" />
                          </span>
                          Open Now
                        </Badge>
                      ) : (
                        <Badge variant="secondary">Closed</Badge>
                      )}
                    </div>

                    <h1 className="font-display text-3xl md:text-4xl font-bold text-foreground">
                      {name}
                    </h1>

                    {tagline ? (
                      <p className="text-muted-foreground text-lg">{tagline}</p>
                    ) : null}

                    <div className="flex flex-wrap items-center gap-2">
                      {cuisineTags.map((c) => (
                        <Badge key={c} variant="outline">
                          {c}
                        </Badge>
                      ))}
                      {priceRange ? (
                        <>
                          {cuisineTags.length > 0 ? (
                            <span className="text-muted-foreground">·</span>
                          ) : null}
                          <span className="text-muted-foreground">{priceRange}</span>
                        </>
                      ) : null}
                    </div>
                  </div>
                </div>

                {bio ? (
                  <p className="mt-6 text-muted-foreground leading-relaxed whitespace-pre-wrap">
                    {bio}
                  </p>
                ) : null}

                {(website || instagram || phone) && (
                  <div className="mt-6 pt-6 border-t flex flex-col sm:flex-row flex-wrap gap-3">
                    {website ? (
                      <Button variant="outline" size="sm" asChild>
                        <a
                          href={normalizeWebsiteUrl(website)}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center gap-2"
                        >
                          <Globe className="h-4 w-4" />
                          Website
                        </a>
                      </Button>
                    ) : null}
                    {instagram ? (
                      <Button variant="outline" size="sm" asChild>
                        <a
                          href={instagramHref(instagram)}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center gap-2"
                        >
                          <ExternalLink className="h-4 w-4" />
                          Instagram
                        </a>
                      </Button>
                    ) : null}
                    {phone ? (
                      <Button variant="outline" size="sm" asChild>
                        <a href={`tel:${phone.replace(/\s/g, "")}`} className="flex items-center gap-2">
                          <Phone className="h-4 w-4" />
                          {phone}
                        </a>
                      </Button>
                    ) : null}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          <div className="space-y-6">
            {servingToday && todayLocation ? (
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <MapPin className="h-5 w-5 text-primary" />
                    Today&apos;s location
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground">{todayLocation}</p>
                </CardContent>
              </Card>
            ) : null}

            <Card className="bg-primary/5 border-primary/20">
              <CardHeader>
                <CardTitle className="text-lg">Book for your event</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground mb-4">
                  Request {name} for your next event.
                </p>
                <Button className="w-full" asChild>
                  <Link href="/book-a-truck" className="flex items-center justify-center gap-2">
                    <ExternalLink className="h-4 w-4" />
                    Request a quote
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
