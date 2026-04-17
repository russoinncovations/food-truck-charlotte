"use client"

import { useState } from "react"
import Image from "next/image"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Search, MapPin, ArrowRight, Users, Calendar, Truck } from "lucide-react"

const stats = [
  { label: "Trucks listed", value: "16+", icon: Truck },
  { label: "Upcoming events", value: "5", icon: Calendar },
  { label: "Facebook group members", value: "35K", icon: Users },
]

export function Hero() {
  const [searchQuery, setSearchQuery] = useState("")

  return (
    <section className="relative pt-16">
      {/* Hero Background */}
      <div className="absolute inset-0 h-[600px] md:h-[700px]">
        <Image
          src="/images/hero-truck.jpg"
          alt="Charlotte food truck scene"
          fill
          className="object-cover"
          priority
        />
        <div className="absolute inset-0 bg-gradient-to-b from-foreground/70 via-foreground/50 to-background" />
      </div>

      {/* Hero Content */}
      <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="pt-20 pb-32 md:pt-28 md:pb-40">
          <div className="max-w-2xl">
            {/* Badge */}
            <div className="mb-6 inline-flex items-center gap-2 rounded-full bg-background/20 px-4 py-1.5 text-sm font-medium text-primary-foreground backdrop-blur-sm">
              <span className="relative flex h-2 w-2">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-green-400 opacity-75" />
                <span className="relative inline-flex h-2 w-2 rounded-full bg-green-400" />
              </span>
              Charlotte's food truck community
            </div>

            {/* Headline */}
            <h1 className="font-display text-4xl font-bold tracking-tight text-primary-foreground sm:text-5xl md:text-6xl text-balance">
              Charlotte&apos;s food truck finder
            </h1>

            {/* Subheadline */}
            <p className="mt-6 text-lg text-primary-foreground/80 max-w-xl">
              See what&apos;s open, where trucks are heading next, and which events are coming up. 
              Built by the 35K-member Food Truck CLT community.
            </p>

            {/* Search Bar */}
            <div className="mt-8 flex flex-col sm:flex-row gap-3">
              <div className="relative flex-1">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                <Input
                  type="text"
                  placeholder="Search trucks, cuisines, or events..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="h-14 pl-12 pr-4 text-base bg-background/95 backdrop-blur border-0 shadow-lg"
                />
              </div>
              <Button size="lg" className="h-14 px-8 shadow-lg" asChild>
                <Link href={`/map${searchQuery ? `?q=${encodeURIComponent(searchQuery)}` : ""}`}>
                  <MapPin className="mr-2 h-5 w-5" />
                  View Map
                </Link>
              </Button>
            </div>

            {/* Quick Filter Chips */}
            <div className="mt-6 flex flex-wrap gap-2">
              {[
                { label: "Open Now", href: "/map?filter=open" },
                { label: "Tacos", href: "/map?cuisine=mexican" },
                { label: "BBQ", href: "/map?cuisine=bbq" },
                { label: "This Weekend", href: "/events?filter=weekend" },
              ].map((chip) => (
                <Link
                  key={chip.label}
                  href={chip.href}
                  className="px-3 py-1.5 rounded-full bg-background/20 text-sm text-primary-foreground/90 hover:bg-background/30 backdrop-blur-sm transition-colors"
                >
                  {chip.label}
                </Link>
              ))}
            </div>
          </div>
        </div>

        {/* Stats Bar */}
        <div className="relative -mt-16 mb-8">
          <div className="grid grid-cols-3 gap-4 md:gap-8 rounded-2xl bg-card p-6 md:p-8 shadow-xl border">
            {stats.map((stat) => (
              <div key={stat.label} className="text-center">
                <div className="flex items-center justify-center gap-1.5 mb-1">
                  <stat.icon className="h-4 w-4 text-primary" />
                  <span className="font-display text-2xl md:text-3xl font-bold text-foreground">
                    {stat.value}
                  </span>
                </div>
                <p className="text-xs md:text-sm text-muted-foreground">{stat.label}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Time-Based Discovery */}
      <div className="relative bg-background">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-12">
          <div className="flex items-center justify-between mb-6">
            <h2 className="font-display text-xl md:text-2xl font-bold text-foreground">
              Find trucks by time
            </h2>
            <Button variant="ghost" size="sm" asChild>
              <Link href="/events" className="flex items-center gap-1 text-muted-foreground hover:text-foreground">
                All events
                <ArrowRight className="h-4 w-4" />
              </Link>
            </Button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <TimeCard
              title="Open Now"
              description="Find trucks open near you"
              href="/map?filter=open"
              accent
            />
            <TimeCard
              title="Tonight"
              description="Check tonight's lineup"
              href="/events?filter=tonight"
            />
            <TimeCard
              title="This Weekend"
              description="Browse this weekend"
              href="/events?filter=weekend"
            />
          </div>
        </div>
      </div>
    </section>
  )
}

function TimeCard({
  title,
  description,
  href,
  accent = false,
}: {
  title: string
  description: string
  href: string
  accent?: boolean
}) {
  return (
    <Link
      href={href}
      className={`group relative flex flex-col justify-between rounded-xl p-6 transition-all hover:shadow-lg ${
        accent
          ? "bg-primary text-primary-foreground"
          : "bg-card border hover:border-primary/50"
      }`}
    >
      <div>
        <h3 className={`font-display text-xl font-semibold mb-1 ${accent ? "" : "text-foreground"}`}>
          {title}
        </h3>
        <p className={`text-sm ${accent ? "text-primary-foreground/80" : "text-muted-foreground"}`}>
          {description}
        </p>
      </div>
      <div className={`mt-4 flex items-center text-sm font-medium ${accent ? "" : "text-primary"}`}>
        Explore
        <ArrowRight className="ml-1 h-4 w-4 transition-transform group-hover:translate-x-1" />
      </div>
    </Link>
  )
}
