import { CalendarPlus, MessageSquare, Users } from "lucide-react"

const steps = [
  {
    icon: CalendarPlus,
    title: "Submit your event request",
    description:
      "Share the date, location, guest count, and cuisine fit. One request reaches relevant Charlotte trucks.",
  },
  {
    icon: Users,
    title: "Matched trucks review the opportunity",
    description:
      "Local trucks that fit your event can review the details and decide if they want to respond.",
  },
  {
    icon: MessageSquare,
    title: "Connect directly with interested trucks",
    description:
      "Interested vendors reach out so you can compare options and finalize details with them directly.",
  },
]

export function HowItWorks() {
  return (
    <section className="border-b bg-background py-14 md:py-20">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="mx-auto mb-12 max-w-2xl text-center md:mb-16">
          <p className="mb-2 text-sm font-semibold uppercase tracking-[0.22em] text-primary">
            How it works
          </p>
          <h2 className="font-display text-3xl font-bold tracking-tight text-foreground md:text-4xl">
            Request once. Connect directly.
          </h2>
          <p className="mt-4 text-base leading-7 text-muted-foreground md:text-lg">
            FoodTruckCLT is a local request platform — we help you find and reach the right trucks,
            then you work with them directly.
          </p>
        </div>

        <div className="grid grid-cols-1 gap-10 md:grid-cols-3 md:gap-8">
          {steps.map((step, index) => (
            <div key={step.title} className="relative text-center md:text-left">
              <div className="mb-4 inline-flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10 text-primary">
                <step.icon className="h-6 w-6" aria-hidden />
              </div>
              <p className="mb-2 text-xs font-semibold uppercase tracking-[0.18em] text-primary">
                Step {index + 1}
              </p>
              <h3 className="font-display text-xl font-semibold text-foreground">{step.title}</h3>
              <p className="mt-3 text-sm leading-relaxed text-muted-foreground">{step.description}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
