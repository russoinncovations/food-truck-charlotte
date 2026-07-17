import Image from "next/image"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { HOMEPAGE_IMAGES } from "@/lib/homepage/homepage-images"

/**
 * Asymmetric editorial split hero.
 * Copy lives on a cream panel; the photo is a clean image plane with no overlays.
 */
export function Hero() {
  return (
    <section className="bg-[#f5f0e8] pt-16">
      <div className="grid min-h-[min(88vh,48rem)] lg:grid-cols-[minmax(0,42fr)_minmax(0,58fr)]">
        {/* Content panel — text never sits on the image */}
        <div className="relative flex flex-col justify-center px-6 py-14 sm:px-10 sm:py-16 lg:px-12 lg:py-20 xl:px-16">
          <div className="mx-auto w-full max-w-md lg:mx-0 lg:max-w-lg">
            <div className="flex items-start gap-3">
              <span
                className="mt-1.5 hidden h-8 w-px shrink-0 bg-primary sm:block"
                aria-hidden
              />
              <p className="text-[0.7rem] font-semibold uppercase tracking-[0.18em] text-primary">
                Charlotte&apos;s food truck connection
              </p>
            </div>

            <h1 className="mt-5 font-display text-[2.15rem] font-bold leading-[1.08] tracking-tight text-foreground sm:text-4xl lg:text-[2.75rem] lg:leading-[1.05]">
              Find the trucks that fit the event.
            </h1>

            <div className="mt-5 h-px w-12 bg-primary" aria-hidden />

            <p className="mt-5 max-w-md text-base leading-7 text-foreground/75 sm:text-[1.05rem] sm:leading-8">
              Submit one request. Local trucks respond. You connect and book directly.
            </p>

            <div className="mt-9 flex flex-col items-start gap-5 sm:flex-row sm:items-center sm:gap-7">
              <Button
                size="lg"
                asChild
                className="h-12 rounded-sm px-7 text-[0.95rem] font-semibold"
              >
                <Link href="/book-a-truck">Request Food Trucks</Link>
              </Button>

              <Link
                href="/trucks"
                className="group inline-flex items-center gap-1.5 text-sm font-medium text-foreground underline decoration-primary decoration-1 underline-offset-[0.35em] transition-colors hover:text-primary"
              >
                Explore Charlotte Trucks
                <span
                  aria-hidden
                  className="translate-x-0 text-primary transition-transform group-hover:translate-x-0.5"
                >
                  →
                </span>
              </Link>
            </div>
          </div>
        </div>

        {/* Image plane — full-height on desktop, stacked below on mobile; no overlays/fades */}
        <div className="relative min-h-[18rem] sm:min-h-[22rem] lg:min-h-full">
          <Image
            src={HOMEPAGE_IMAGES.hero}
            alt="Charlotte food truck festival with trucks, guests, and the city skyline at dusk"
            fill
            className="object-cover object-[center_35%]"
            priority
            sizes="(max-width: 1023px) 100vw, 58vw"
          />
          <p className="pointer-events-none absolute bottom-4 left-4 right-4 text-left text-[0.7rem] font-medium tracking-wide text-white drop-shadow-[0_1px_2px_rgba(0,0,0,0.75)] sm:bottom-5 sm:left-5 sm:right-auto sm:max-w-xs sm:text-[0.75rem]">
            Charlotte events, powered by local trucks.
          </p>
        </div>
      </div>
    </section>
  )
}
