import Link from "next/link"
import { Calendar, Clock, MapPin } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import type { VendorDashboardPublicEventRow } from "@/lib/events/public-events"

function formatEventDateLabel(isoDate: string): string {
  const d = new Date(`${isoDate}T12:00:00`)
  if (Number.isNaN(d.getTime())) return isoDate
  return d.toLocaleDateString("en-US", {
    weekday: "short",
    month: "short",
    day: "numeric",
    year: "numeric",
  })
}

function formatTimeLabel(t: string | null): string | null {
  if (t == null || String(t).trim() === "") return null
  const s = String(t).slice(0, 5)
  return s.length >= 5 ? s : String(t).trim()
}

function formatTimeRange(start: string | null, end: string | null): string | null {
  const a = formatTimeLabel(start)
  const b = formatTimeLabel(end)
  if (a && b) return `${a} – ${b}`
  if (a) return a
  if (b) return b
  return null
}

function eventHref(row: VendorDashboardPublicEventRow): string {
  const slug = row.slug != null && String(row.slug).trim() !== "" ? String(row.slug).trim() : ""
  if (!slug) return "/events"
  return `/events/${encodeURIComponent(slug)}`
}

export function DashboardPublicEvents({
  events,
  title = "Public Events",
  description =
    "Community events listed on the public calendar. Reach out to the organizer if you'd like to vend.",
}: {
  events: VendorDashboardPublicEventRow[]
  title?: string
  description?: string
}) {
  return (
    <Card className="border-muted-foreground/15">
      <CardHeader className="pb-3">
        <CardTitle className="text-lg flex items-center gap-2">
          <Calendar className="h-5 w-5 text-primary shrink-0" />
          {title}
        </CardTitle>
        <CardDescription>{description}</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {events.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            No upcoming public events right now. Check back later or browse{" "}
            <Link href="/events" className="text-primary font-medium underline-offset-4 hover:underline">
              all events
            </Link>
            .
          </p>
        ) : (
          <ul className="space-y-4">
            {events.map((ev) => {
              const locationLine = [ev.location_name, ev.address].filter(Boolean).join(" · ")
              const timeLine = formatTimeRange(ev.start_time, ev.end_time)
              const desc = ev.description?.trim()
              return (
                <li
                  key={ev.id}
                  className="rounded-lg border bg-background/60 p-4 space-y-2"
                >
                  <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
                    <div className="min-w-0 space-y-1">
                      <p className="font-semibold text-foreground leading-snug">{ev.title}</p>
                      <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted-foreground">
                        <span className="inline-flex items-center gap-1">
                          <Calendar className="h-3.5 w-3.5 shrink-0" aria-hidden />
                          {formatEventDateLabel(ev.date)}
                        </span>
                        {timeLine ? (
                          <span className="inline-flex items-center gap-1">
                            <Clock className="h-3.5 w-3.5 shrink-0" aria-hidden />
                            {timeLine}
                          </span>
                        ) : null}
                      </div>
                      {locationLine ? (
                        <p className="text-sm text-muted-foreground flex items-start gap-1.5">
                          <MapPin className="h-3.5 w-3.5 shrink-0 mt-0.5" aria-hidden />
                          <span className="leading-snug">{locationLine}</span>
                        </p>
                      ) : null}
                      {desc ? (
                        <p className="text-sm text-muted-foreground line-clamp-3 leading-snug pt-1">{desc}</p>
                      ) : null}
                    </div>
                    <Button variant="outline" size="sm" className="shrink-0" asChild>
                      <Link href={eventHref(ev)}>View event</Link>
                    </Button>
                  </div>
                </li>
              )
            })}
          </ul>
        )}
        {events.length > 0 ? (
          <div className="pt-1">
            <Button variant="ghost" size="sm" className="px-0 h-auto text-primary" asChild>
              <Link href="/events">See full public calendar →</Link>
            </Button>
          </div>
        ) : null}
      </CardContent>
    </Card>
  )
}
