import type { ComponentType } from "react"
import Image from "next/image"
import Link from "next/link"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { formatStopDate, formatStopTime } from "@/lib/schedule/scheduled-stops"
import {
  facebookHref,
  instagramHref,
  normalizeWebsiteUrl,
  type TruckProfileData,
} from "@/lib/trucks/truck-profile-helpers"
import {
  Calendar,
  ChevronLeft,
  ExternalLink,
  Globe,
  MapPin,
  Navigation,
  Phone,
  UtensilsCrossed,
  Info,
  Images,
} from "lucide-react"

type Props = {
  profile: TruckProfileData
}

function SectionHeading({
  id,
  icon: Icon,
  title,
  description,
}: {
  id: string
  icon: ComponentType<{ className?: string }>
  title: string
  description?: string
}) {
  return (
    <div id={id} className="scroll-mt-28">
      <div className="flex items-start gap-3 mb-4">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
          <Icon className="h-5 w-5" />
        </div>
        <div>
          <h2 className="font-display text-xl md:text-2xl font-bold text-foreground">{title}</h2>
          {description ? <p className="text-sm text-muted-foreground mt-1">{description}</p> : null}
        </div>
      </div>
    </div>
  )
}

export function TruckProfileView({ profile }: Props) {
  const bookHref = `/book-a-truck?truck=${encodeURIComponent(profile.id)}`
  const mapHref = `/map?q=${encodeURIComponent(profile.name)}`

  return (
    <main className="min-h-screen bg-background">
      <section className="relative pt-16">
        <div className="relative h-[18rem] sm:h-[22rem] md:h-[28rem]">
          <Image src={profile.heroImageUrl} alt={profile.name} fill className="object-cover" priority />
          <div className="absolute inset-0 bg-gradient-to-t from-background via-background/40 to-black/20" />
        </div>

        <div className="absolute top-20 left-4 md:left-8 z-10">
          <Button variant="secondary" size="sm" asChild className="shadow-lg backdrop-blur-sm bg-background/90">
            <Link href="/trucks" className="flex items-center gap-1">
              <ChevronLeft className="h-4 w-4" />
              All Trucks
            </Link>
          </Button>
        </div>
      </section>

      <div className="sticky top-16 z-30 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/80">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-3 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <nav className="flex flex-wrap items-center gap-x-4 gap-y-1 text-sm">
            <a href="#schedule" className="text-muted-foreground hover:text-primary transition-colors font-medium">
              View Schedule
            </a>
            <a href="#menu" className="text-muted-foreground hover:text-primary transition-colors font-medium">
              View Menu
            </a>
            <a href="#about" className="text-muted-foreground hover:text-primary transition-colors font-medium">
              About
            </a>
          </nav>
          <Button size="sm" className="bg-[#D94F1E] hover:bg-[#b8441a] text-white shrink-0" asChild>
            <Link href={bookHref}>Book This Truck</Link>
          </Button>
        </div>
      </div>

      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8 md:py-12">
        <div className="grid lg:grid-cols-3 gap-8 lg:gap-10">
          <div className="lg:col-span-2 space-y-10 md:space-y-12">
            <header className="space-y-4">
              <div className="flex flex-wrap items-center gap-2">
                {profile.servingToday ? (
                  <Badge className="bg-green-600 text-white border-0 gap-1.5">
                    <span className="relative flex h-2 w-2">
                      <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-white opacity-75" />
                      <span className="relative inline-flex h-2 w-2 rounded-full bg-white" />
                    </span>
                    Live now
                  </Badge>
                ) : (
                  <Badge variant="secondary">Not serving right now</Badge>
                )}
                {profile.catering ? (
                  <Badge variant="outline" className="border-primary/30 text-primary">
                    Available for booking
                  </Badge>
                ) : null}
              </div>

              <h1 className="font-display text-3xl md:text-4xl lg:text-5xl font-bold text-foreground tracking-tight">
                {profile.name}
              </h1>

              {profile.tagline ? (
                <p className="text-lg md:text-xl text-muted-foreground max-w-2xl">{profile.tagline}</p>
              ) : null}

              <div className="flex flex-wrap items-center gap-2">
                {profile.cuisineTags.map((c) => (
                  <Badge key={c} variant="outline" className="font-normal">
                    {c}
                  </Badge>
                ))}
                {profile.priceRange ? (
                  <span className="text-sm text-muted-foreground tabular-nums">{profile.priceRange}</span>
                ) : null}
              </div>

              {profile.serviceAreaLabel ? (
                <p className="text-sm text-muted-foreground flex items-center gap-1.5">
                  <MapPin className="h-4 w-4 shrink-0 text-primary" />
                  Serves {profile.serviceAreaLabel}
                </p>
              ) : null}

              {profile.servingToday && profile.todayLocation ? (
                <div className="rounded-lg border border-green-600/30 bg-green-500/10 px-4 py-3 text-sm">
                  <p className="font-medium text-green-800 dark:text-green-300 flex items-center gap-2">
                    <Navigation className="h-4 w-4 shrink-0" />
                    Serving now at {profile.todayLocation}
                  </p>
                  {profile.streetAddress ? (
                    <p className="text-muted-foreground mt-1 ml-6">{profile.streetAddress}</p>
                  ) : null}
                  <Button variant="link" className="h-auto p-0 ml-6 mt-1 text-green-800 dark:text-green-300" asChild>
                    <Link href={mapHref}>Find on live map</Link>
                  </Button>
                </div>
              ) : null}
            </header>

            <section>
              <SectionHeading
                id="about"
                icon={Info}
                title="About"
                description={`Learn more about ${profile.name} on FoodTruckCLT.`}
              />
              {profile.aboutText ? (
                <p className="text-muted-foreground leading-relaxed whitespace-pre-wrap text-base md:text-lg">
                  {profile.aboutText}
                </p>
              ) : (
                <p className="text-muted-foreground text-sm rounded-lg border border-dashed bg-muted/30 px-4 py-6">
                  This truck hasn&apos;t added a full description yet. Check their schedule below or request a booking
                  to learn more.
                </p>
              )}
            </section>

            <section>
              <SectionHeading
                id="menu"
                icon={UtensilsCrossed}
                title="Menu highlights"
                description="From vendor profile specials and upcoming stop notes."
              />
              {profile.hasMenuData ? (
                <ul className="grid gap-2 sm:grid-cols-2">
                  {profile.menuHighlights.map((item) => (
                    <li
                      key={item}
                      className="rounded-lg border bg-card px-4 py-3 text-sm font-medium text-foreground shadow-sm"
                    >
                      {item}
                    </li>
                  ))}
                </ul>
              ) : (
                <div className="rounded-lg border border-dashed bg-muted/30 px-4 py-8 text-center">
                  <UtensilsCrossed className="h-8 w-8 mx-auto text-muted-foreground/60 mb-2" />
                  <p className="text-sm text-muted-foreground">
                    Menu details haven&apos;t been added yet. Follow this truck&apos;s schedule or contact them for
                    today&apos;s offerings.
                  </p>
                </div>
              )}
            </section>

            <section>
              <SectionHeading
                id="schedule"
                icon={Calendar}
                title="Upcoming schedule"
                description="Public stops posted by the vendor. Times are Eastern."
              />
              {profile.upcomingStops.length > 0 ? (
                <ul className="space-y-3">
                  {profile.upcomingStops.map((stop) => (
                    <li
                      key={stop.id}
                      className="rounded-xl border bg-card px-4 py-4 shadow-sm hover:border-primary/25 transition-colors"
                    >
                      <p className="font-semibold text-foreground">
                        {formatStopDate(stop.stop_date)} · {formatStopTime(stop.start_time)} –{" "}
                        {formatStopTime(stop.end_time)}
                      </p>
                      <p className="text-muted-foreground mt-1">{stop.location_name}</p>
                      {stop.is_public && stop.address ? (
                        <p className="text-sm text-muted-foreground mt-0.5">{stop.address}</p>
                      ) : (
                        <p className="text-sm text-muted-foreground italic mt-0.5">Private event</p>
                      )}
                      {stop.menu_note ? (
                        <p className="text-sm mt-2 text-foreground">
                          <span className="font-medium">Menu note:</span> {stop.menu_note}
                        </p>
                      ) : null}
                    </li>
                  ))}
                </ul>
              ) : (
                <div className="rounded-lg border border-dashed bg-muted/30 px-4 py-8 text-center">
                  <Calendar className="h-8 w-8 mx-auto text-muted-foreground/60 mb-2" />
                  <p className="text-sm text-muted-foreground">
                    No public stops scheduled yet. Check the{" "}
                    <Link href={mapHref} className="text-primary font-medium hover:underline">
                      live map
                    </Link>{" "}
                    to see if they&apos;re out today.
                  </p>
                </div>
              )}
            </section>

            {profile.galleryPhotos.length > 0 ? (
              <section id="photos" className="scroll-mt-28">
                <SectionHeading
                  id="photos-heading"
                  icon={Images}
                  title="Photos"
                  description="From this truck's gallery."
                />
                <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                  {profile.galleryPhotos.map((photo) => (
                    <div key={photo.id} className="relative aspect-[4/3] rounded-lg overflow-hidden border bg-muted">
                      <Image
                        src={photo.photo_url}
                        alt={photo.alt_text ?? profile.name}
                        fill
                        className="object-cover"
                        sizes="(max-width: 768px) 50vw, 33vw"
                      />
                    </div>
                  ))}
                </div>
              </section>
            ) : null}
          </div>

          <aside className="space-y-6 lg:sticky lg:top-36 lg:self-start">
            <Card className="border-primary/20 shadow-lg overflow-hidden">
              <div className="h-1.5 bg-[#D94F1E]" />
              <CardHeader>
                <CardTitle className="font-display text-xl">Book this truck</CardTitle>
                <CardDescription>
                  Request {profile.name} for your next event, office lunch, or private gathering.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                <Button className="w-full bg-[#D94F1E] hover:bg-[#b8441a] text-white" size="lg" asChild>
                  <Link href={bookHref} className="flex items-center justify-center gap-2">
                    <ExternalLink className="h-4 w-4" />
                    Book This Truck
                  </Link>
                </Button>
                <Button variant="outline" className="w-full" asChild>
                  <Link href={mapHref} className="flex items-center justify-center gap-2">
                    <MapPin className="h-4 w-4" />
                    View on live map
                  </Link>
                </Button>
              </CardContent>
            </Card>

            {(profile.website || profile.instagram || profile.facebook || profile.phone) && (
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-base font-display">Connect</CardTitle>
                </CardHeader>
                <CardContent className="flex flex-col gap-2">
                  {profile.website ? (
                    <Button variant="outline" size="sm" className="justify-start" asChild>
                      <a href={normalizeWebsiteUrl(profile.website)} target="_blank" rel="noopener noreferrer">
                        <Globe className="h-4 w-4 mr-2 shrink-0" />
                        Website
                      </a>
                    </Button>
                  ) : null}
                  {profile.instagram ? (
                    <Button variant="outline" size="sm" className="justify-start" asChild>
                      <a href={instagramHref(profile.instagram)} target="_blank" rel="noopener noreferrer">
                        <ExternalLink className="h-4 w-4 mr-2 shrink-0" />
                        Instagram
                      </a>
                    </Button>
                  ) : null}
                  {profile.facebook ? (
                    <Button variant="outline" size="sm" className="justify-start" asChild>
                      <a href={facebookHref(profile.facebook)} target="_blank" rel="noopener noreferrer">
                        <ExternalLink className="h-4 w-4 mr-2 shrink-0" />
                        Facebook
                      </a>
                    </Button>
                  ) : null}
                  {profile.phone ? (
                    <Button variant="outline" size="sm" className="justify-start" asChild>
                      <a href={`tel:${profile.phone.replace(/\s/g, "")}`}>
                        <Phone className="h-4 w-4 mr-2 shrink-0" />
                        {profile.phone}
                      </a>
                    </Button>
                  ) : null}
                </CardContent>
              </Card>
            )}

            <Card className="bg-muted/40">
              <CardContent className="pt-6 text-sm text-muted-foreground space-y-2">
                <p>
                  Listings on FoodTruckCLT are vendor-managed. Schedules and live status update when trucks post stops
                  or check in via Go Live.
                </p>
                <Link href="/trucks" className="inline-flex text-primary font-medium hover:underline text-sm">
                  Browse all Charlotte trucks →
                </Link>
              </CardContent>
            </Card>
          </aside>
        </div>
      </div>
    </main>
  )
}
