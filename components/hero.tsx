import Image from "next/image"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { CalendarPlus } from "lucide-react"

export function Hero() {
  return (
    <section className="relative pt-16">
      <div className="absolute inset-0 h-[520px] md:h-[560px]">
        <Image
          src="/images/hero-truck.jpg"
          alt="Charlotte food truck scene"
          fill
          className="object-cover"
          priority
        />
        <div className="absolute inset-0 bg-gradient-to-b from-foreground/70 via-foreground/50 to-background" />
      </div>

      <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="pt-20 pb-16 md:pt-28 md:pb-20">
          <div className="max-w-3xl">
            <h1 className="font-display text-4xl font-bold tracking-tight text-primary-foreground sm:text-5xl md:text-6xl text-balance">
              Find the Right Food Trucks for Your Charlotte Event
            </h1>
            <p className="mt-6 text-lg text-primary-foreground/85 max-w-2xl leading-relaxed">
              Tell us your date, location, guest count, and event needs. FoodTruckCLT helps connect you with
              available local food trucks.
            </p>

            <div className="mt-8 flex flex-col items-start gap-4">
              <Button size="lg" className="h-14 px-8 shadow-lg" asChild>
                <Link href="/book-a-truck" className="inline-flex items-center gap-2">
                  <CalendarPlus className="h-5 w-5" />
                  Book Food Trucks
                </Link>
              </Button>
              <Link
                href="/list-your-truck"
                className="text-sm font-medium text-primary-foreground/90 underline underline-offset-4 hover:text-primary-foreground"
              >
                Own a food truck? Join or update your profile
              </Link>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
