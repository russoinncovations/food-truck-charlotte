"use client"

import { useState, FormEvent } from "react"
import { useRouter } from "next/navigation"
import { createClient } from "@/lib/supabase/client"
import { Header } from "@/components/header"
import { Footer } from "@/components/footer"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { MapPin, Calendar, Users, Star, ArrowRight, ClipboardList } from "lucide-react"
import { VendorSignupForm } from "@/components/forms/vendor-signup-form"
import { isPlausibleVendorWebsiteInput } from "@/lib/validation/vendor-website"

const features = [
  {
    icon: ClipboardList,
    title: "Free Truck Profile",
    description: "List your truck with cuisine, story, and contact details—no paid tier required.",
  },
  {
    icon: MapPin,
    title: "Live Location Visibility",
    description: "When you mark yourself as serving, customers can see you on the live map.",
  },
  {
    icon: Users,
    title: "Built-In Charlotte Audience",
    description: "Get discovered by locals already browsing Charlotte food trucks and the directory.",
  },
  {
    icon: Calendar,
    title: "Event & Booking Exposure",
    description: "Your profile links you to the wider site—events and booking inquiries visitors already use.",
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
  const router = useRouter()
  const [submitError, setSubmitError] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setSubmitError(null)
    setIsSubmitting(true)

    const form = e.currentTarget
    const fd = new FormData(form)

    const cuisine_types = fd.getAll("cuisine_types").map(String).filter(Boolean)

    const serviceAreasRaw = (fd.get("service_areas") as string | null)?.trim() ?? ""
    const service_areas = serviceAreasRaw
      ? serviceAreasRaw.split(/[,;]/).map((s) => s.trim()).filter(Boolean)
      : []

    const websiteRaw = (fd.get("website") as string | null)?.trim() ?? ""
    if (!isPlausibleVendorWebsiteInput(websiteRaw)) {
      setIsSubmitting(false)
      setSubmitError(
        "Please enter a valid website or domain (for example sweetandcozybakery.net, www.sweetandcozybakery.net, or https://sweetandcozybakery.net).",
      )
      return
    }

    const insert = {
      business_name: (fd.get("business_name") as string | null)?.trim() || null,
      contact_name: (fd.get("contact_name") as string | null)?.trim() || null,
      email: (fd.get("email") as string | null)?.trim() || null,
      phone: (fd.get("phone") as string | null)?.trim() || null,
      website: websiteRaw || null,
      instagram: (fd.get("instagram") as string | null)?.trim() || null,
      vendor_description: (fd.get("vendor_description") as string | null)?.trim() || null,
      cuisine_types,
      service_areas,
      base_city: (fd.get("base_city") as string | null)?.trim() || null,
      status: "pending",
      source: "website",
    }

    const supabase = createClient()
    const { error } = await supabase.from("vendor_applications").insert(insert)

    setIsSubmitting(false)

    if (error) {
      setSubmitError(error.message)
      return
    }

    router.push("/list-your-truck/success")
  }

  return (
    <main className="min-h-screen bg-background">
      <Header />

      {/* Hero Section */}
      <section className="relative overflow-hidden bg-[#faf6f2] pt-24 pb-10 md:pt-28 md:pb-12">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 relative">
          <div className="text-center max-w-3xl mx-auto">
            <Badge variant="outline" className="mb-4 bg-background/70 text-xs font-semibold uppercase tracking-wide">
              For Food Truck Owners
            </Badge>
            <h1 className="mx-auto max-w-[18rem] font-display text-[1.875rem] font-bold leading-[1.1] tracking-[-0.02em] text-foreground mb-4 text-balance sm:max-w-3xl sm:text-4xl lg:text-5xl lg:leading-tight">
              Claim your truck profile and get found by Charlotte event hosts.
            </h1>
            <p className="text-base leading-7 md:text-lg text-muted-foreground mb-7 max-w-2xl mx-auto">
              Keep your profile current, promote upcoming stops, and receive relevant food truck
              requests as the platform grows.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button size="lg" className="gap-2" asChild>
                <a href="#apply">
                  Claim your truck profile
                  <ArrowRight className="h-4 w-4" />
                </a>
              </Button>
              <Button size="lg" variant="outline" asChild>
                <a href="#features">See How It Works</a>
              </Button>
            </div>
            <p className="mt-4 text-sm text-muted-foreground">
              Built from Charlotte&apos;s largest food truck community
            </p>
          </div>
        </div>
      </section>

      {/* Application Form Section */}
      <section id="apply" className="py-10 md:py-14 bg-[#faf6f2]">
        <div className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-8">
            <h2 className="font-display text-3xl md:text-4xl font-bold leading-tight text-foreground mb-3">
              Apply to Join
            </h2>
            <p className="text-base leading-7 text-muted-foreground">
              Fill out the form below and we&apos;ll help get your truck listed.
            </p>
          </div>
          <Card className="border-2 border-primary/15 p-5 shadow-xl shadow-foreground/5 md:p-8">
            <VendorSignupForm
              onSubmit={handleSubmit}
              submitError={submitError}
              isSubmitting={isSubmitting}
            />
          </Card>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-10 border-y bg-background">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-8 text-center max-w-2xl mx-auto">
            <div>
              <p className="text-3xl md:text-4xl font-bold text-foreground">35K+</p>
              <p className="text-sm text-muted-foreground">Community Members</p>
            </div>
            <div className="flex flex-col justify-center">
              <p className="text-xl md:text-2xl font-bold text-foreground leading-snug">
                Charlotte Food Truck Community
              </p>
              <p className="text-sm text-muted-foreground mt-1">Local trucks &amp; hungry neighbors</p>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-14 md:py-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-10">
            <h2 className="font-display text-3xl md:text-4xl font-bold leading-tight text-foreground mb-3">
              What you get today
            </h2>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              Straightforward benefits—no hype, no roadmap promises.
            </p>
          </div>

          <div className="grid sm:grid-cols-2 gap-6 max-w-4xl mx-auto">
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

      {/* Pricing — single free tier */}
      <section className="py-14 md:py-20 bg-muted/30">
        <div className="mx-auto max-w-lg px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-8">
            <h2 className="font-display text-3xl md:text-4xl font-bold text-foreground mb-2">Simple listing</h2>
            <p className="text-muted-foreground text-sm">One option—the one we offer right now.</p>
          </div>
          <Card className="border-2 border-primary/30 shadow-md">
            <CardContent className="p-8 text-left">
              <h3 className="font-display text-2xl font-bold text-foreground mb-2">Free Truck Listing</h3>
              <p className="text-sm text-muted-foreground mb-6">Everything below is included at no charge.</p>
              <ul className="space-y-3 text-foreground text-sm mb-8">
                <li className="flex gap-2">
                  <span className="text-primary font-bold shrink-0">·</span>
                  <span>Truck profile</span>
                </li>
                <li className="flex gap-2">
                  <span className="text-primary font-bold shrink-0">·</span>
                  <span>Live map visibility when you update your location</span>
                </li>
                <li className="flex gap-2">
                  <span className="text-primary font-bold shrink-0">·</span>
                  <span>Link to your menu/socials</span>
                </li>
                <li className="flex gap-2">
                  <span className="text-primary font-bold shrink-0">·</span>
                  <span>Booking inquiry exposure</span>
                </li>
              </ul>
              <Button size="lg" className="w-full gap-2" asChild>
                <a href="#apply">
                  Claim your truck profile
                  <ArrowRight className="h-4 w-4" />
                </a>
              </Button>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* Testimonials */}
      <section className="py-14 md:py-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-10">
            <h2 className="font-display text-3xl md:text-4xl font-bold leading-tight text-foreground mb-3">
              Trusted by Charlotte&apos;s Best Trucks
            </h2>
          </div>

          <div className="grid md:grid-cols-2 gap-6 max-w-4xl mx-auto">
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
      <section className="py-14 md:py-20 bg-primary text-primary-foreground">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="font-display text-3xl md:text-4xl font-bold mb-4">
            Ready to Grow Your Business?
          </h2>
          <p className="text-primary-foreground/80 mb-8 max-w-xl mx-auto">
            List once, stay discoverable when you&apos;re out serving Charlotte.
          </p>
          <Button size="lg" variant="secondary" className="gap-2" asChild>
            <a href="#apply">
              Claim your truck profile
              <ArrowRight className="h-4 w-4" />
            </a>
          </Button>
        </div>
      </section>

      <Footer />
    </main>
  )
}
