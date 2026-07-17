const steps = [
  {
    step: "01",
    title: "Submit your event request",
    description: "Share the date, location, guest count, and cuisine needs.",
  },
  {
    step: "02",
    title: "Local trucks review it",
    description: "Relevant trucks can review the request and decide whether to respond.",
  },
  {
    step: "03",
    title: "Connect directly",
    description: "Compare interested vendors and finalize details directly with the truck.",
  },
]

/**
 * Editorial how-it-works sequence — numbered steps, no icons or cards.
 */
export function HowItWorks() {
  return (
    <section className="border-b border-border/60 bg-background py-12 md:py-16">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="max-w-xl">
          <div className="flex items-center gap-3">
            <span className="h-px w-8 bg-primary" aria-hidden />
            <p className="text-[0.7rem] font-semibold uppercase tracking-[0.18em] text-primary">
              How it works
            </p>
          </div>
          <h2 className="mt-4 font-display text-3xl font-bold tracking-tight text-foreground md:text-4xl">
            Request once. Connect directly.
          </h2>
        </div>

        <ol className="mt-10 grid grid-cols-1 gap-0 border-t border-border/70 md:mt-12 md:grid-cols-3">
          {steps.map((item, index) => (
            <li
              key={item.step}
              className={`border-b border-border/70 py-8 last:border-b-0 md:border-b-0 md:py-10 md:pr-10 ${
                index > 0 ? "md:border-l md:border-border/70 md:pl-10" : "md:pr-10"
              }`}
            >
              <p className="font-display text-4xl font-bold leading-none tracking-tight text-primary/90 md:text-5xl">
                {item.step}
              </p>
              <h3 className="mt-5 font-display text-lg font-semibold leading-snug tracking-tight text-foreground md:text-xl">
                {item.title}
              </h3>
              <p className="mt-2 max-w-sm text-sm leading-relaxed text-muted-foreground">
                {item.description}
              </p>
            </li>
          ))}
        </ol>
      </div>
    </section>
  )
}
