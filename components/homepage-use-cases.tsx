import Image from "next/image"
import Link from "next/link"
import { ArrowRight } from "lucide-react"
import { Button } from "@/components/ui/button"
import { HOMEPAGE_IMAGES } from "@/lib/homepage/homepage-images"

const useCases = [
  {
    title: "Corporate events",
    description: "Office lunches, employee appreciation, and campus gatherings.",
    image: HOMEPAGE_IMAGES.useCases.corporate,
    imageAlt: "Wings and event food ready for a Charlotte gathering",
  },
  {
    title: "Schools",
    description: "PTA nights, sports events, and end-of-year celebrations.",
    image: HOMEPAGE_IMAGES.useCases.schools,
    imageAlt: "Tacos and street food for school and family events",
  },
  {
    title: "Neighborhoods",
    description: "HOA nights, block parties, and community meetups.",
    image: HOMEPAGE_IMAGES.useCases.neighborhoods,
    imageAlt: "Neighbors gathering around food trucks at dusk",
  },
  {
    title: "Breweries",
    description: "Regular service nights and special taproom events.",
    image: HOMEPAGE_IMAGES.useCases.breweries,
    imageAlt: "Fresh BBQ plated at a local food truck window",
  },
  {
    title: "Private parties",
    description: "Birthdays, weddings, and backyard celebrations.",
    image: HOMEPAGE_IMAGES.useCases.privateParties,
    imageAlt: "Dessert cones and sweets from a Charlotte food truck",
  },
  {
    title: "Community events",
    description: "Festivals, fundraisers, and public gatherings.",
    image: HOMEPAGE_IMAGES.useCases.communityEvents,
    imageAlt: "Crowd exploring a Charlotte food truck festival",
  },
]

export function HomepageUseCases() {
  return (
    <section className="bg-muted/40 py-16 md:py-24">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="mb-10 flex flex-col gap-5 md:mb-14 md:flex-row md:items-end md:justify-between">
          <div className="max-w-2xl">
            <p className="text-sm font-semibold uppercase tracking-[0.22em] text-primary">
              Who requests trucks
            </p>
            <h2 className="mt-3 font-display text-3xl font-bold tracking-tight text-foreground md:text-4xl">
              Built for the events Charlotte hosts every week
            </h2>
            <p className="mt-4 text-base leading-7 text-muted-foreground md:text-lg">
              Whether you need one truck or several, submit a request and let interested vendors
              respond.
            </p>
          </div>
          <Button asChild className="shrink-0">
            <Link href="/book-a-truck" className="flex items-center gap-2">
              Request a Food Truck
              <ArrowRight className="h-4 w-4" />
            </Link>
          </Button>
        </div>

        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {useCases.map((item) => (
            <article
              key={item.title}
              className="group overflow-hidden rounded-2xl border border-border/70 bg-card shadow-sm transition duration-300 hover:-translate-y-0.5 hover:border-primary/25 hover:shadow-md"
            >
              <div className="relative aspect-[16/10] overflow-hidden">
                <Image
                  src={item.image}
                  alt={item.imageAlt}
                  fill
                  sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                  className="object-cover transition duration-500 group-hover:scale-[1.04]"
                />
              </div>
              <div className="px-5 py-5">
                <h3 className="font-display text-lg font-semibold text-foreground">{item.title}</h3>
                <p className="mt-1.5 text-sm leading-relaxed text-muted-foreground">{item.description}</p>
              </div>
            </article>
          ))}
        </div>
      </div>
    </section>
  )
}
