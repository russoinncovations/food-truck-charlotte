/**
 * Compact editorial proof strip — one instance directly under the hero.
 */
export function HomepageProofStrip() {
  const strip = [
    { primary: "35K+", secondary: "local community members" },
    { primary: "No", secondary: "booking commission" },
    { primary: "Direct", secondary: "connection with local trucks" },
  ]

  return (
    <section
      aria-label="FoodTruckCLT at a glance"
      className="border-b border-border/50 bg-[#faf6f2]"
    >
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="h-px w-full bg-primary/70" aria-hidden />
        <ul className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
          {strip.map((item, index) => (
            <li
              key={item.secondary}
              className={`flex flex-1 flex-wrap items-baseline justify-center gap-x-2 gap-y-0.5 px-3 py-3.5 text-center sm:px-4 sm:py-4 ${
                index > 0 ? "border-t border-border/40 sm:border-t-0 sm:border-l sm:border-border/40" : ""
              }`}
            >
              <span className="font-display text-sm font-bold tracking-tight text-foreground sm:text-base">
                {item.primary}
              </span>
              <span className="text-[0.8rem] text-muted-foreground sm:text-sm">{item.secondary}</span>
            </li>
          ))}
        </ul>
      </div>
    </section>
  )
}
