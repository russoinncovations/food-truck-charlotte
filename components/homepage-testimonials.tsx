import { Star } from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"

/**
 * Real community testimonials — same quotes as list-your-truck.
 * Do not invent or alter attribution.
 */
const testimonials = [
  {
    name: "LaShay J.",
    subtitle: "Gouda's Kitchen",
    quote:
      "We learned so much from this group and 75% of our bookings have ALWAYS been through this group!",
    rating: 5,
  },
  {
    name: "Tina T.",
    subtitle: "Community Member",
    quote:
      "I not only found 1 truck but several. In less than 1 hour I was able to secure a truck for a last minute event!",
    rating: 5,
  },
  {
    name: "Sonya H.",
    subtitle: "Queen City Flavas Slushies LLC",
    quote: "We appreciate you and everything this community has done for our business.",
    rating: 5,
  },
]

const avatarClasses = [
  "bg-primary/15 text-primary",
  "bg-accent/20 text-accent",
  "bg-primary/10 text-primary",
]

function initials(name: string): string {
  const parts = name.trim().split(/\s+/)
  if (parts.length >= 2) {
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase()
  }
  return parts[0].slice(0, 2).toUpperCase()
}

export function HomepageTestimonials() {
  return (
    <section className="border-b bg-background py-14 md:py-20">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="mx-auto mb-10 max-w-2xl text-center md:mb-12">
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

        <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
          {testimonials.map((testimonial, index) => (
            <Card key={testimonial.name} className="border-border/80 bg-card shadow-sm">
              <CardContent className="flex h-full flex-col p-6">
                <div className="mb-4 flex items-center gap-3">
                  <div
                    className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-full text-sm font-bold ${avatarClasses[index % avatarClasses.length]}`}
                  >
                    {initials(testimonial.name)}
                  </div>
                  <div>
                    <p className="font-semibold text-foreground">{testimonial.name}</p>
                    <p className="text-sm text-muted-foreground">{testimonial.subtitle}</p>
                  </div>
                </div>
                <div className="mb-3 flex gap-0.5" aria-label={`${testimonial.rating} out of 5 stars`}>
                  {[...Array(testimonial.rating)].map((_, i) => (
                    <Star key={i} className="h-4 w-4 fill-accent text-accent" aria-hidden />
                  ))}
                </div>
                <p className="text-sm leading-relaxed text-muted-foreground">
                  &quot;{testimonial.quote}&quot;
                </p>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </section>
  )
}
