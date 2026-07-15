import Link from "next/link"
import {
  ArrowRight,
  Beer,
  Building2,
  GraduationCap,
  Home,
  PartyPopper,
  Users,
} from "lucide-react"
import { Button } from "@/components/ui/button"

const useCases = [
  {
    icon: Building2,
    title: "Corporate events",
    description: "Office lunches, employee appreciation, and campus gatherings.",
  },
  {
    icon: GraduationCap,
    title: "Schools",
    description: "PTA nights, sports events, and end-of-year celebrations.",
  },
  {
    icon: Home,
    title: "Neighborhoods",
    description: "HOA nights, block parties, and community meetups.",
  },
  {
    icon: Beer,
    title: "Breweries",
    description: "Regular service nights and special taproom events.",
  },
  {
    icon: PartyPopper,
    title: "Private parties",
    description: "Birthdays, weddings, and backyard celebrations.",
  },
  {
    icon: Users,
    title: "Community events",
    description: "Festivals, fundraisers, and public gatherings.",
  },
]

export function HomepageUseCases() {
  return (
    <section className="bg-muted/40 py-14 md:py-20">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="mb-10 flex flex-col gap-5 md:mb-12 md:flex-row md:items-end md:justify-between">
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

        <div className="grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-3">
          {useCases.map((item) => (
            <div key={item.title} className="flex gap-4">
              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-background text-primary shadow-sm ring-1 ring-border">
                <item.icon className="h-5 w-5" aria-hidden />
              </div>
              <div>
                <h3 className="font-display text-lg font-semibold text-foreground">{item.title}</h3>
                <p className="mt-1 text-sm leading-relaxed text-muted-foreground">{item.description}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
