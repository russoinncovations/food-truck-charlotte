import Link from "next/link"
import { Button } from "@/components/ui/button"
import { ArrowRight, BookOpen } from "lucide-react"

export function HomepageResourcesTeaser() {
  return (
    <section className="border-t bg-background py-14 md:py-16">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
          <div className="max-w-2xl">
            <p className="text-sm font-semibold uppercase tracking-[0.22em] text-primary">
              For truck owners
            </p>
            <h2 className="mt-3 font-display text-2xl font-bold tracking-tight text-foreground md:text-3xl">
              Resource Guide
            </h2>
            <p className="mt-3 text-base leading-7 text-muted-foreground">
              Practical support for Charlotte food truck operators — not a primary consumer action.
              Find local guidance, community links, and tools to run your truck better.
            </p>
          </div>
          <Button variant="outline" asChild className="shrink-0">
            <Link href="/resources" className="flex items-center gap-2">
              <BookOpen className="h-4 w-4" />
              Open Resource Guide
              <ArrowRight className="h-4 w-4" />
            </Link>
          </Button>
        </div>
      </div>
    </section>
  )
}
