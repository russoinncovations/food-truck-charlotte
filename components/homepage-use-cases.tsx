import Image from "next/image"
import Link from "next/link"
import { ArrowRight } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  homepageUseCaseImage,
  homepageUseCaseObjectPosition,
  type HomepageUseCaseKey,
} from "@/lib/homepage/homepage-images"
import { cn } from "@/lib/utils"

const useCases: {
  key: HomepageUseCaseKey
  title: string
  description: string
  imageAlt: string
}[] = [
  {
    key: "corporate",
    title: "Corporate events",
    description: "Office lunches, appreciation days, and campus gatherings.",
    imageAlt: "Professionals eating lunch in an office courtyard with a food truck nearby",
  },
  {
    key: "schools",
    title: "Schools",
    description: "PTA nights, sports events, and family celebrations.",
    imageAlt: "Families with snow cones at a school festival in front of the school building",
  },
  {
    key: "neighborhoods",
    title: "Neighborhoods",
    description: "HOA nights, block parties, and clubhouse meetups.",
    imageAlt: "Neighbors gathered on a community green near a clubhouse and food truck",
  },
  {
    key: "breweries",
    title: "Breweries",
    description: "Patio service nights and taproom specials.",
    imageAlt: "Guests socializing on a brewery patio at dusk with string lights and tanks",
  },
  {
    key: "privateParties",
    title: "Private parties",
    description: "Birthdays, graduations, and backyard celebrations.",
    imageAlt: "Guests at a backyard private party with tables, string lights, and a food truck",
  },
  {
    key: "communityEvents",
    title: "Community events",
    description: "Festivals, markets, and public gatherings.",
    imageAlt: "Crowd dancing at a community festival with a music stage and food truck",
  },
]

export function HomepageUseCases() {
  return (
    <section className="bg-muted/30 py-10 md:py-14">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="mb-6 flex flex-col gap-4 md:mb-8 md:flex-row md:items-end md:justify-between">
          <div className="max-w-xl">
            <p className="text-sm font-semibold uppercase tracking-[0.22em] text-primary">
              Who requests trucks
            </p>
            <h2 className="mt-2 font-display text-2xl font-bold tracking-tight text-foreground md:text-3xl">
              Built for Charlotte events
            </h2>
            <p className="mt-2 text-sm leading-6 text-muted-foreground md:text-base">
              Submit a request and let interested local trucks respond.
            </p>
          </div>
          <Button asChild size="sm" className="shrink-0">
            <Link href="/book-a-truck" className="flex items-center gap-2">
              Request a Food Truck
              <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </Button>
        </div>

        <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-3 lg:gap-4">
          {useCases.map((item) => (
            <article
              key={item.key}
              className="overflow-hidden rounded-xl border border-border/60 bg-card"
            >
              <div className="relative aspect-[16/9] overflow-hidden bg-muted">
                <Image
                  src={homepageUseCaseImage(item.key)}
                  alt={item.imageAlt}
                  fill
                  sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 320px"
                  className={cn("object-cover", homepageUseCaseObjectPosition(item.key))}
                />
              </div>
              <div className="px-3 py-3 sm:px-3.5 sm:py-3.5">
                <h3 className="font-display text-sm font-semibold text-foreground sm:text-base">
                  {item.title}
                </h3>
                <p className="mt-0.5 text-xs leading-snug text-muted-foreground sm:text-[0.8rem] sm:leading-relaxed">
                  {item.description}
                </p>
              </div>
            </article>
          ))}
        </div>
      </div>
    </section>
  )
}
