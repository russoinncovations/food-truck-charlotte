import { Metadata } from "next"
import Link from "next/link"
import { Header } from "@/components/header"
import { Footer } from "@/components/footer"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import {
  MapPin,
  Calendar,
  Users,
  TrendingUp,
  Star,
  Check,
  ArrowRight,
  Smartphone,
  Bell,
  BarChart3,
} from "lucide-react"
import { VendorSignupForm } from "@/components/forms/vendor-signup-form"

export const metadata: Metadata = {
  title: "List Your Truck | Food Truck CLT",
  description: "Join Charlotte's largest food truck community. Reach 35,000+ local food lovers, manage your schedule, and grow your business.",
}

const features = [
  {
    icon: MapPin,
    title: "Real-Time Location Updates",
    description: "Post where you'll be and let customers find you instantly on our interactive map.",
  },
  {
    icon: Calendar,
    title: "Easy Schedule Management",
    description: "Update your weekly schedule in seconds. Your followers get notified automatically.",
  },
  {
    icon: Users,
    title: "Built-In Audience",
    description: "Tap into our community of 35,000+ Charlotte food lovers actively looking for trucks.",
  },
  {
    icon: TrendingUp,
    title: "Growth Analytics",
    description: "Track profile views, follower growth, and see which locations drive the most traffic.",
  },
  {
    icon: Bell,
    title: "Event Opportunities",
    description: "Get notified about catering requests, festivals, and private events in your area.",
  },
  {
    icon: Smartphone,
    title: "Mobile-First Design",
    description: "Update your schedule on the go with our mobile-optimized dashboard.",
  },
]

const plans = [
  {
    name: "Basic",
    price: "Free",
    description: "Get started and reach local food lovers",
    features: [
      "Profile listing",
      "Basic schedule posting",
      "Map presence",
      "Community access",
    ],
    cta: "Get Started Free",
    popular: false,
  },
  {
    name: "Pro",
    price: "$29",
    period: "/month",
    description: "Grow your business with premium features",
    features: [
      "Everything in Basic",
      "Featured placement",
      "Push notifications to followers",
      "Advanced analytics",
      "Event matching",
      "Priority support",
    ],
    cta: "Start Pro Trial",
    popular: true,
  },
  {
    name: "Enterprise",
    price: "Custom",
    description: "For food truck fleets and franchises",
    features: [
      "Everything in Pro",
      "Multi-truck management",
      "Custom branding",
      "API access",
      "Dedicated account manager",
    ],
    cta: "Contact Sales",
    popular: false,
  },
]

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

const testimonialAvatarClasses = [
  "bg-primary/15 text-primary",
  "bg-accent/20 text-accent",
  "bg-primary/10 text-primary",
]

function testimonialInitials(name: string): string {
  const parts = name.trim().split(/\s+/)
  if (parts.length >= 2) {
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase()
  }
  return parts[0].slice(0, 2).toUpperCase()
}

export default function ListYourTruckPage() {
  return (
    <main className="min-h-screen bg-background">
      <Header />

      {/* Hero Section */}
      <section className="relative pt-24 pb-16 md:pt-32 md:pb-24 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-primary/5 to-transparent" />
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 relative">
          <div className="text-center max-w-3xl mx-auto">
            <Badge className="mb-4">For Food Truck Owners</Badge>
            <h1 className="font-display text-4xl md:text-5xl lg:text-6xl font-bold text-foreground mb-6 text-balance">
              Reach 35,000+ Charlotte Food Lovers
            </h1>
            <p className="text-lg md:text-xl text-muted-foreground mb-8 max-w-2xl mx-auto">
              Join Charlotte&apos;s most trusted food truck platform. Post your schedule, 
              grow your following, and let hungry customers find you.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button size="lg" className="gap-2" asChild>
                <a href="#apply">
                  List Your Truck Free
                  <ArrowRight className="h-4 w-4" />
                </a>
              </Button>
              <Button size="lg" variant="outline" asChild>
                <a href="#features">See How It Works</a>
              </Button>
            </div>
            <p className="mt-4 text-sm text-muted-foreground">
              No credit card required · Free to get started
            </p>
          </div>
        </div>
      </section>

      {/* Application Form Section */}
      <section id="apply" className="py-16 md:py-24 bg-muted/30">
        <div className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-10">
            <h2 className="font-display text-3xl md:text-4xl font-bold text-foreground mb-4">
              Apply to Join
            </h2>
            <p className="text-muted-foreground">
              Fill out the form below and we&apos;ll get you set up within 2-3 business days.
            </p>
          </div>
          <Card className="p-6 md:p-8">
            <VendorSignupForm />
          </Card>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-12 border-y bg-muted/30">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
            <div>
              <p className="text-3xl md:text-4xl font-bold text-foreground">35K+</p>
              <p className="text-sm text-muted-foreground">Active Users</p>
            </div>
            <div>
              <p className="text-3xl md:text-4xl font-bold text-foreground">35,000+</p>
              <p className="text-sm text-muted-foreground">Food Trucks</p>
            </div>
            <div>
              <p className="text-3xl md:text-4xl font-bold text-foreground">80+</p>
              <p className="text-sm text-muted-foreground">Monthly Events</p>
            </div>
            <div>
              <p className="text-3xl md:text-4xl font-bold text-foreground">4.8</p>
              <p className="text-sm text-muted-foreground">Avg. Rating</p>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-16 md:py-24">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="font-display text-3xl md:text-4xl font-bold text-foreground mb-4">
              Everything You Need to Grow
            </h2>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              Powerful tools designed specifically for food truck owners
            </p>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-8">
            {features.map((feature) => (
              <Card key={feature.title} className="border-2 hover:border-primary/50 transition-colors">
                <CardContent className="p-6">
                  <div className="h-12 w-12 rounded-lg bg-primary/10 flex items-center justify-center mb-4">
                    <feature.icon className="h-6 w-6 text-primary" />
                  </div>
                  <h3 className="font-display font-semibold text-lg text-foreground mb-2">
                    {feature.title}
                  </h3>
                  <p className="text-muted-foreground">
                    {feature.description}
                  </p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section className="py-16 md:py-24 bg-muted/30">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="font-display text-3xl md:text-4xl font-bold text-foreground mb-4">
              Simple, Transparent Pricing
            </h2>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              Start free, upgrade when you&apos;re ready
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
            {plans.map((plan) => (
              <Card
                key={plan.name}
                className={`relative ${plan.popular ? "border-primary border-2 shadow-lg" : ""}`}
              >
                {plan.popular && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                    <Badge className="bg-primary text-primary-foreground">Most Popular</Badge>
                  </div>
                )}
                <CardContent className="p-6">
                  <h3 className="font-display font-semibold text-xl text-foreground mb-2">
                    {plan.name}
                  </h3>
                  <div className="flex items-baseline gap-1 mb-2">
                    <span className="text-4xl font-bold text-foreground">{plan.price}</span>
                    {plan.period && (
                      <span className="text-muted-foreground">{plan.period}</span>
                    )}
                  </div>
                  <p className="text-sm text-muted-foreground mb-6">
                    {plan.description}
                  </p>
                  <ul className="space-y-3 mb-6">
                    {plan.features.map((feature) => (
                      <li key={feature} className="flex items-center gap-2 text-sm">
                        <Check className="h-4 w-4 text-primary shrink-0" />
                        <span>{feature}</span>
                      </li>
                    ))}
                  </ul>
                  <Button
                    className="w-full"
                    variant={plan.popular ? "default" : "outline"}
                  >
                    {plan.cta}
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section className="py-16 md:py-24">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="font-display text-3xl md:text-4xl font-bold text-foreground mb-4">
              Trusted by Charlotte&apos;s Best Trucks
            </h2>
          </div>

          <div className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto">
            {testimonials.map((testimonial, index) => (
              <Card key={testimonial.name} className="overflow-hidden">
                <CardContent className="p-6">
                  <div className="flex items-center gap-4 mb-4">
                    <div
                      className={`flex h-14 w-14 shrink-0 rounded-full items-center justify-center text-sm font-bold ${testimonialAvatarClasses[index % testimonialAvatarClasses.length]}`}
                    >
                      {testimonialInitials(testimonial.name)}
                    </div>
                    <div>
                      <p className="font-semibold text-foreground">{testimonial.name}</p>
                      <p className="text-sm text-muted-foreground">{testimonial.subtitle}</p>
                    </div>
                  </div>
                  <div className="flex gap-1 mb-3">
                    {[...Array(testimonial.rating)].map((_, i) => (
                      <Star key={i} className="h-4 w-4 fill-accent text-accent" />
                    ))}
                  </div>
                  <p className="text-muted-foreground italic">
                    &quot;{testimonial.quote}&quot;
                  </p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <section className="py-16 md:py-24 bg-primary text-primary-foreground">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="font-display text-3xl md:text-4xl font-bold mb-4">
            Ready to Grow Your Business?
          </h2>
          <p className="text-primary-foreground/80 mb-8 max-w-xl mx-auto">
            Charlotte&apos;s original food truck community — trusted by 35,000+ locals since 2020.
          </p>
          <Button size="lg" variant="secondary" className="gap-2" asChild>
            <a href="#apply">
              List Your Truck Free
              <ArrowRight className="h-4 w-4" />
            </a>
          </Button>
        </div>
      </section>

      <Footer />
    </main>
  )
}
