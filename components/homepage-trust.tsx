import { Handshake, Percent, Users } from "lucide-react"

const trustPoints = [
  {
    icon: Users,
    title: "Charlotte's largest food truck community",
    description:
      "Built from a 35K+ member local network of food truck fans, event hosts, and vendors.",
  },
  {
    icon: Percent,
    title: "No booking commission",
    description: "FoodTruckCLT does not take a percentage of your event booking.",
  },
  {
    icon: Handshake,
    title: "Connect directly with local trucks",
    description:
      "Interested trucks respond so you can compare options, finalize details, and book directly.",
  },
]

export function HomepageTrust() {
  return (
    <section className="border-y border-border/60 bg-[#faf6f2] py-16 md:py-24">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="mx-auto mb-10 max-w-2xl text-center md:mb-14">
          <p className="text-sm font-semibold uppercase tracking-[0.22em] text-primary">
            Why hosts use FoodTruckCLT
          </p>
          <h2 className="mt-3 font-display text-2xl font-bold tracking-tight text-foreground md:text-3xl">
            Local community. Direct connections. No booking cut.
          </h2>
        </div>

        <div className="grid grid-cols-1 gap-10 md:grid-cols-3 md:gap-12 lg:gap-16">
          {trustPoints.map((point) => (
            <div key={point.title} className="text-center md:text-left">
              <div className="mx-auto mb-5 flex h-12 w-12 items-center justify-center rounded-2xl bg-background text-primary shadow-sm ring-1 ring-border md:mx-0">
                <point.icon className="h-5 w-5" aria-hidden />
              </div>
              <h3 className="font-display text-lg font-semibold leading-snug text-foreground md:text-xl">
                {point.title}
              </h3>
              <p className="mt-3 text-sm leading-relaxed text-muted-foreground md:text-[0.95rem] md:leading-7">
                {point.description}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
