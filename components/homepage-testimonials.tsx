/**
 * Real community testimonials — same quotes as list-your-truck.
 * Do not invent or alter attribution. No fake avatar photos.
 */
const testimonials = [
  {
    name: "LaShay J.",
    subtitle: "Gouda's Kitchen",
    quote:
      "We learned so much from this group and 75% of our bookings have ALWAYS been through this group!",
  },
  {
    name: "Tina T.",
    subtitle: "Community Member",
    quote:
      "I not only found 1 truck but several. In less than 1 hour I was able to secure a truck for a last minute event!",
  },
  {
    name: "Sonya H.",
    subtitle: "Queen City Flavas Slushies LLC",
    quote: "We appreciate you and everything this community has done for our business.",
  },
]

export function HomepageTestimonials() {
  return (
    <section className="border-b bg-background py-16 md:py-24">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="mx-auto mb-12 max-w-2xl text-center md:mb-16">
          <p className="mb-2 text-sm font-semibold uppercase tracking-[0.22em] text-primary">
            Community trust
          </p>
          <h2 className="font-display text-3xl font-bold tracking-tight text-foreground md:text-4xl">
            Trusted by Charlotte hosts and food truck fans
          </h2>
          <p className="mt-4 text-base leading-7 text-muted-foreground md:text-lg">
            FoodTruckCLT grew from a local community of people looking for reliable food truck
            information, events, and recommendations.
          </p>
        </div>

        <div className="grid grid-cols-1 gap-8 md:grid-cols-3 md:gap-10">
          {testimonials.map((testimonial) => (
            <figure
              key={testimonial.name}
              className="flex h-full flex-col border-l-2 border-primary/40 pl-5 md:pl-6"
            >
              <blockquote className="flex-1">
                <p className="font-display text-xl font-medium leading-snug tracking-tight text-foreground md:text-[1.35rem] md:leading-snug">
                  &ldquo;{testimonial.quote}&rdquo;
                </p>
              </blockquote>
              <figcaption className="mt-6 border-t border-border/70 pt-4">
                <p className="font-semibold text-foreground">{testimonial.name}</p>
                <p className="mt-0.5 text-sm text-muted-foreground">{testimonial.subtitle}</p>
              </figcaption>
            </figure>
          ))}
        </div>
      </div>
    </section>
  )
}
