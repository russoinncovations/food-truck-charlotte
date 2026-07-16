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
    <section className="border-b bg-muted/30 py-12 md:py-16">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 gap-8 md:grid-cols-3 md:gap-10">
          {trustPoints.map((point) => (
            <div key={point.title} className="flex gap-4">
              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-background text-primary shadow-sm ring-1 ring-border">
                <point.icon className="h-5 w-5" aria-hidden />
              </div>
              <div>
                <h3 className="font-display text-lg font-semibold text-foreground">{point.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                  {point.description}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
