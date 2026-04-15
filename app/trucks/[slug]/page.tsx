import { Metadata } from "next"
import { notFound } from "next/navigation"
import Image from "next/image"
import Link from "next/link"
import { Header } from "@/components/header"
import { Footer } from "@/components/footer"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  Star,
  MapPin,
  Clock,
  Calendar,
  Heart,
  Share2,
  Navigation,
  Phone,
  Globe,
  ExternalLink,
  Twitter,
  ChevronLeft,
  Sparkles,
} from "lucide-react"
import { getTruckBySlug, foodTrucks } from "@/lib/data"

interface Props {
  params: Promise<{ slug: string }>
}

export async function generateStaticParams() {
  return foodTrucks.map((truck) => ({
    slug: truck.slug,
  }))
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params
  const truck = getTruckBySlug(slug)
  
  if (!truck) {
    return { title: "Truck Not Found | FoodTruck CLT" }
  }

  return {
    title: `${truck.name} | FoodTruck CLT`,
    description: truck.description,
  }
}

export default async function TruckProfilePage({ params }: Props) {
  const { slug } = await params
  const truck = getTruckBySlug(slug)

  if (!truck) {
    notFound()
  }

  return (
    <main className="min-h-screen bg-background">
      <Header />

      {/* Hero Section */}
      <section className="relative pt-16">
        <div className="relative h-64 md:h-96">
          <Image
            src={truck.image}
            alt={truck.name}
            fill
            className="object-cover"
            priority
          />
          <div className="absolute inset-0 bg-gradient-to-t from-background via-background/50 to-transparent" />
        </div>

        {/* Back Button */}
        <div className="absolute top-20 left-4 md:left-8">
          <Button variant="secondary" size="sm" asChild className="shadow-lg">
            <Link href="/trucks" className="flex items-center gap-1">
              <ChevronLeft className="h-4 w-4" />
              All Trucks
            </Link>
          </Button>
        </div>
      </section>

      {/* Main Content */}
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 -mt-24 relative z-10 pb-16">
        <div className="grid lg:grid-cols-3 gap-8">
          {/* Main Column */}
          <div className="lg:col-span-2 space-y-6">
            {/* Truck Info Card */}
            <Card className="shadow-xl">
              <CardContent className="p-6">
                <div className="flex flex-wrap items-start justify-between gap-4">
                  <div>
                    {/* Status & Featured Badges */}
                    <div className="flex items-center gap-2 mb-3">
                      {truck.isOpen ? (
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
                      {truck.isFeatured && (
                        <Badge className="bg-accent text-accent-foreground border-0">
                          <Sparkles className="h-3 w-3 mr-1" />
                          Featured
                        </Badge>
                      )}
                    </div>

                    {/* Name & Cuisine */}
                    <h1 className="font-display text-3xl md:text-4xl font-bold text-foreground mb-2">
                      {truck.name}
                    </h1>
                    <div className="flex flex-wrap items-center gap-2 mb-4">
                      {truck.cuisine.map((c) => (
                        <Badge key={c} variant="outline">
                          {c}
                        </Badge>
                      ))}
                      <span className="text-muted-foreground">·</span>
                      <span className="text-muted-foreground">{truck.priceRange}</span>
                    </div>

                    {/* Rating */}
                    <div className="flex items-center gap-2">
                      <div className="flex items-center gap-1">
                        <Star className="h-5 w-5 fill-accent text-accent" />
                        <span className="font-semibold text-lg">{truck.rating}</span>
                      </div>
                      <span className="text-muted-foreground">
                        ({truck.reviewCount} reviews)
                      </span>
                    </div>
                  </div>

                  {/* Action Buttons */}
                  <div className="flex gap-2">
                    <Button variant="outline" size="icon">
                      <Heart className="h-4 w-4" />
                      <span className="sr-only">Follow</span>
                    </Button>
                    <Button variant="outline" size="icon">
                      <Share2 className="h-4 w-4" />
                      <span className="sr-only">Share</span>
                    </Button>
                  </div>
                </div>

                {/* Description */}
                <p className="mt-6 text-muted-foreground leading-relaxed">
                  {truck.description}
                </p>

                {/* Social Links */}
                {(truck.socialLinks.instagram || truck.socialLinks.facebook || truck.socialLinks.website) && (
                  <div className="mt-6 pt-6 border-t flex flex-wrap gap-3">
                    {truck.socialLinks.instagram && (
                      <Button variant="outline" size="sm" asChild>
                        <a
                          href={`https://instagram.com/${truck.socialLinks.instagram}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center gap-2"
                        >
                          <ExternalLink className="h-4 w-4" />
                          @{truck.socialLinks.instagram}
                        </a>
                      </Button>
                    )}
                    {truck.socialLinks.facebook && (
                      <Button variant="outline" size="sm" asChild>
                        <a
                          href={`https://facebook.com/${truck.socialLinks.facebook}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center gap-2"
                        >
                          <ExternalLink className="h-4 w-4" />
                          Facebook
                        </a>
                      </Button>
                    )}
                    {truck.socialLinks.website && (
                      <Button variant="outline" size="sm" asChild>
                        <a
                          href={truck.socialLinks.website}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center gap-2"
                        >
                          <Globe className="h-4 w-4" />
                          Website
                        </a>
                      </Button>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Tabs for Schedule & Menu */}
            <Card>
              <Tabs defaultValue="schedule">
                <CardHeader className="pb-0">
                  <TabsList className="w-full justify-start">
                    <TabsTrigger value="schedule" className="gap-2">
                      <Calendar className="h-4 w-4" />
                      Schedule
                    </TabsTrigger>
                    <TabsTrigger value="menu" className="gap-2">
                      <span className="text-lg">🍽</span>
                      Menu
                    </TabsTrigger>
                  </TabsList>
                </CardHeader>

                <CardContent className="pt-6">
                  {/* Schedule Tab */}
                  <TabsContent value="schedule" className="mt-0">
                    <div className="space-y-4">
                      {truck.schedule.length > 0 ? (
                        truck.schedule.map((item) => {
                          const date = new Date(item.date)
                          const isToday = date.toDateString() === new Date().toDateString()
                          
                          return (
                            <div
                              key={item.id}
                              className={`flex items-start gap-4 p-4 rounded-lg border ${
                                isToday ? "border-primary bg-primary/5" : ""
                              }`}
                            >
                              {/* Date */}
                              <div className="text-center shrink-0 w-16">
                                <p className="text-xs text-muted-foreground uppercase">
                                  {date.toLocaleDateString("en-US", { weekday: "short" })}
                                </p>
                                <p className="text-2xl font-bold text-foreground">
                                  {date.getDate()}
                                </p>
                                <p className="text-xs text-muted-foreground">
                                  {date.toLocaleDateString("en-US", { month: "short" })}
                                </p>
                              </div>

                              {/* Details */}
                              <div className="flex-1">
                                <div className="flex items-center gap-2 mb-1">
                                  {isToday && (
                                    <Badge variant="default" className="text-xs">
                                      Today
                                    </Badge>
                                  )}
                                  {item.eventName && (
                                    <span className="font-medium text-foreground">
                                      {item.eventName}
                                    </span>
                                  )}
                                </div>
                                <div className="flex items-center gap-1 text-sm text-muted-foreground mb-1">
                                  <MapPin className="h-3.5 w-3.5" />
                                  <span>{item.location}</span>
                                </div>
                                <div className="flex items-center gap-1 text-sm text-muted-foreground mb-2">
                                  <Clock className="h-3.5 w-3.5" />
                                  <span>{item.startTime} - {item.endTime}</span>
                                </div>
                                <p className="text-xs text-muted-foreground">{item.address}</p>
                              </div>

                              {/* Actions */}
                              <Button variant="outline" size="sm" className="shrink-0 gap-1">
                                <Navigation className="h-3.5 w-3.5" />
                                Directions
                              </Button>
                            </div>
                          )
                        })
                      ) : (
                        <div className="text-center py-8">
                          <Calendar className="h-12 w-12 mx-auto text-muted-foreground/50 mb-4" />
                          <p className="text-muted-foreground">No upcoming schedule</p>
                        </div>
                      )}
                    </div>
                  </TabsContent>

                  {/* Menu Tab */}
                  <TabsContent value="menu" className="mt-0">
                    <div className="space-y-4">
                      {truck.menu.map((item) => (
                        <div
                          key={item.id}
                          className="flex items-start justify-between gap-4 p-4 rounded-lg border"
                        >
                          <div>
                            <div className="flex items-center gap-2 mb-1">
                              <h4 className="font-medium text-foreground">{item.name}</h4>
                              {item.isPopular && (
                                <Badge variant="secondary" className="text-xs">
                                  Popular
                                </Badge>
                              )}
                            </div>
                            <p className="text-sm text-muted-foreground">{item.description}</p>
                          </div>
                          <p className="font-semibold text-foreground shrink-0">
                            ${item.price.toFixed(2)}
                          </p>
                        </div>
                      ))}
                    </div>
                  </TabsContent>
                </CardContent>
              </Tabs>
            </Card>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Follow Card */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Never Miss This Truck</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground mb-4">
                  Get notified when {truck.name} posts their schedule or is nearby.
                </p>
                <Button className="w-full gap-2">
                  <Heart className="h-4 w-4" />
                  Follow {truck.name}
                </Button>
              </CardContent>
            </Card>

            {/* Current Location */}
            {truck.location && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <MapPin className="h-5 w-5 text-primary" />
                    Current Location
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground mb-4">
                    {truck.location.address}
                  </p>
                  <div className="aspect-video bg-muted rounded-lg mb-4 flex items-center justify-center">
                    <span className="text-muted-foreground text-sm">Map Preview</span>
                  </div>
                  <Button variant="outline" className="w-full gap-2">
                    <Navigation className="h-4 w-4" />
                    Get Directions
                  </Button>
                </CardContent>
              </Card>
            )}

            {/* Book for Event */}
            <Card className="bg-primary/5 border-primary/20">
              <CardHeader>
                <CardTitle className="text-lg">Book for Your Event</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground mb-4">
                  Want {truck.name} at your next event? Request a quote for private 
                  parties, corporate events, or community gatherings.
                </p>
                <Button className="w-full" asChild>
                  <Link href={`/book-trucks?truck=${truck.slug}`}>
                    Request Quote
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
