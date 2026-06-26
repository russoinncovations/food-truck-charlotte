import Image from "next/image"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { ArrowRight, Calendar, MapPin, Megaphone, Store, Truck } from "lucide-react"

type HeroProps = {
  /** Upcoming, approved public events (Eastern “today” onward). */
  upcomingEventCount: number
  /** Active directory trucks (show_in_directory + active + is_active). */
  directoryTruckCount: number
}

export function Hero({ upcomingEventCount, directoryTruckCount }: HeroProps) {
  const stats = [
    {
      label: "Trucks listed",
      value: String(directoryTruckCount),
      icon: Truck,
    },
    { label: "Upcoming events", value: String(upcomingEventCount), icon: Calendar },
  ] as const

  const pathways = [
    {
      title: "Find Food Today",
      description: "Discover local food trucks, live pins, and listed vendors around Charlotte.",
      href: "/map",
      icon: MapPin,
    },
    {
      title: "Planning an Event",
      description: "Post one event request so relevant local trucks can respond directly.",
      href: "/book-a-truck",
      icon: Megaphone,
    },
    {
      title: "Own a Food Truck",
      description: "Get listed, share your schedule, and receive direct inquiries from customers.",
      href: "/list-your-truck",
      icon: Store,
    },
  ] as const

  return (
    <section className="relative overflow-hidden bg-foreground pt-16 text-primary-foreground">
      <div className="absolute inset-0">
        <Image
          src="/images/hero-truck.jpg"
          alt="Charlotte food truck scene"
          fill
          className="object-cover opacity-40"
          priority
        />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(217,79,30,0.35),transparent_34rem)]" />
        <div className="absolute inset-0 bg-gradient-to-b from-foreground/85 via-foreground/80 to-background" />
      </div>

      <div className="relative">
        <div className="mx-auto max-w-7xl px-4 pb-14 pt-20 sm:px-6 md:pb-16 md:pt-24 lg:px-8">
          <div className="grid gap-8 lg:grid-cols-[1.05fr_0.95fr] lg:items-end">
            <div className="max-w-3xl">
              <div className="mb-6 inline-flex max-w-full items-center rounded-2xl border border-primary-foreground/20 bg-primary-foreground/10 px-3 py-1.5 text-xs font-medium leading-5 text-primary-foreground/90 backdrop-blur-sm sm:rounded-full sm:px-4 sm:text-sm">
                Direct connections with local food trucks
              </div>

              <h1 className="font-display text-[2.2rem] font-bold leading-[1.02] tracking-tight text-primary-foreground sm:text-6xl lg:text-7xl">
                <span className="block">Charlotte Food Trucks,</span>
                <span className="block">Connected</span>
              </h1>

              <p className="mt-5 max-w-2xl text-base leading-7 text-primary-foreground/80 md:text-lg md:leading-8">
                Find trucks near you, post an event request, or get your food truck discovered by
                Charlotte customers. FoodTruckCLT is built for direct connections - not commissions,
                contracts, payments, or event management.
              </p>

              <div className="mt-7 flex flex-col gap-3 sm:flex-row">
                <Button size="lg" asChild className="h-14 px-6">
                  <Link href="/map" className="flex items-center justify-center gap-2">
                    <MapPin className="h-5 w-5" />
                    Find Food Trucks
                  </Link>
                </Button>
                <Button
                  size="lg"
                  variant="secondary"
                  asChild
                  className="h-14 bg-primary-foreground text-foreground hover:bg-primary-foreground/90"
                >
                  <Link href="/book-a-truck" className="flex items-center justify-center gap-2">
                    Post an Event Request
                    <ArrowRight className="h-4 w-4" />
                  </Link>
                </Button>
              </div>

              <Button
                variant="outline"
                size="lg"
                asChild
                className="mt-3 h-12 w-full border-primary-foreground/25 bg-transparent text-primary-foreground hover:bg-primary-foreground/10 hover:text-primary-foreground sm:w-auto"
              >
                <Link href="/list-your-truck" className="flex items-center justify-center gap-2">
                  Own a food truck? List your truck
                  <ArrowRight className="h-4 w-4" />
                </Link>
              </Button>
            </div>

            <div className="rounded-3xl border border-primary-foreground/15 bg-background/95 p-5 text-foreground shadow-2xl backdrop-blur md:p-6">
              <p className="text-sm font-semibold uppercase tracking-[0.22em] text-primary">
                Live local guide
              </p>
              <div className="mt-5 divide-y divide-border rounded-2xl border bg-card">
                {stats.map((stat) => (
                  <div key={stat.label} className="flex items-center gap-4 p-4">
                    <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-primary/10">
                      <stat.icon className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                      <p className="font-display text-3xl font-bold leading-none text-foreground">{stat.value}</p>
                      <p className="mt-1 text-sm text-muted-foreground">{stat.label}</p>
                    </div>
                  </div>
                ))}
              </div>
              <p className="mt-5 border-l-2 border-primary/40 pl-4 text-sm leading-6 text-muted-foreground">
                Born from Charlotte&apos;s 35K-member Food Truck CLT community and focused on helping
                people find and contact local trucks directly.
              </p>
            </div>
          </div>
        </div>

        <div className="bg-background text-foreground">
          <div className="mx-auto max-w-7xl px-4 pb-12 sm:px-6 lg:px-8">
            <div className="-mt-10 grid gap-4 md:grid-cols-3">
              {pathways.map((pathway) => {
                const Icon = pathway.icon
                return (
                  <Link
                    key={pathway.title}
                    href={pathway.href}
                    className="group rounded-3xl border bg-card p-6 shadow-lg shadow-foreground/5 transition-all hover:-translate-y-1 hover:border-primary/40 hover:shadow-xl"
                  >
                    <div className="mb-6 flex h-12 w-12 items-center justify-center rounded-2xl bg-primary/10 text-primary transition-colors group-hover:bg-primary group-hover:text-primary-foreground">
                      <Icon className="h-6 w-6" />
                    </div>
                    <h2 className="font-display text-2xl font-bold text-foreground">{pathway.title}</h2>
                    <p className="mt-3 text-sm leading-6 text-muted-foreground">{pathway.description}</p>
                    <span className="mt-5 inline-flex items-center gap-2 text-sm font-semibold text-primary">
                      Continue
                      <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
                    </span>
                  </Link>
                )
              })}
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
