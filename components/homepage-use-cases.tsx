import Image from "next/image"
import Link from "next/link"
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

/**
 * Secondary event-type grid — photo-led, kept compact under truck profiles.
 */
export function HomepageUseCases() {
  return (
    <section className="border-t border-border/60 bg-[#faf6f2] py-8 md:py-10">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="mb-5 flex flex-col gap-3 sm:mb-6 sm:flex-row sm:items-end sm:justify-between">
          <div className="max-w-lg">
            <div className="flex items-center gap-3">
              <span className="h-px w-8 bg-primary" aria-hidden />
              <p className="text-[0.7rem] font-semibold uppercase tracking-[0.18em] text-primary">
                Event types
              </p>
            </div>
            <h2 className="mt-3 font-display text-xl font-bold tracking-tight text-foreground md:text-2xl">
              Built for Charlotte gatherings
            </h2>
          </div>
          <Link
            href="/book-a-truck"
            className="text-sm font-medium text-foreground underline decoration-primary decoration-1 underline-offset-[0.35em] transition-colors hover:text-primary"
          >
            Request Food Trucks →
          </Link>
        </div>

        <div className="grid grid-cols-2 gap-3 lg:grid-cols-3 lg:gap-3.5">
          {useCases.map((item) => (
            <article key={item.key} className="overflow-hidden border border-border/50 bg-background">
              <div className="relative aspect-[2/1] overflow-hidden bg-muted">
                <Image
                  src={homepageUseCaseImage(item.key)}
                  alt={item.imageAlt}
                  fill
                  sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 320px"
                  className={cn("object-cover", homepageUseCaseObjectPosition(item.key))}
                />
              </div>
              <div className="px-3 py-2.5 sm:px-3.5 sm:py-3">
                <h3 className="font-display text-sm font-semibold text-foreground">{item.title}</h3>
                <p className="mt-0.5 text-xs leading-snug text-muted-foreground sm:leading-relaxed">
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
