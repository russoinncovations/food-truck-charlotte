"use client"

import { useEffect, useRef, useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { updateTruckOpportunityStatus } from "@/app/dashboard/actions"
import { EVENT_TYPES } from "@/lib/booking-types"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet"
import { Calendar, Clock, Mail, MapPin, Users } from "lucide-react"
import { toast } from "@/hooks/use-toast"
import { cn } from "@/lib/utils"

export type DashboardOpportunity = {
  id: string
  status: string
  booking: {
    event_type: string | null
    event_date: string | null
    city: string | null
    guest_count: number | null
    contact_email: string | null
    venue_name: string | null
    event_display_name: string
    start_time: string | null
    end_time: string | null
    street_address: string | null
    state: string | null
    zip_code: string | null
    additional_notes: string | null
  } | null
}

export type TruckContext = {
  name: string
  slug: string
  cuisineLine: string
}

function formatEventDate(dateStr: string | null | undefined) {
  if (!dateStr) return "—"
  const d = new Date(dateStr)
  if (Number.isNaN(d.getTime())) return dateStr
  return d.toLocaleDateString("en-US", {
    weekday: "short",
    month: "short",
    day: "numeric",
    year: "numeric",
  })
}

function formatTimeRange(start: string | null | undefined, end: string | null | undefined) {
  const s = start?.trim()
  const e = end?.trim()
  if (!s && !e) return "—"
  if (s && e) return `${s} – ${e}`
  return s || e || "—"
}

function formatLocation(br: NonNullable<DashboardOpportunity["booking"]>) {
  const lines: string[] = []
  if (br.venue_name?.trim()) lines.push(br.venue_name.trim())
  const street = br.street_address?.trim()
  const city = br.city?.trim()
  const state = br.state?.trim()
  const zip = br.zip_code?.trim()
  const cityStateZip = [city, state, zip].filter(Boolean).join(", ")
  const line2 = [street, cityStateZip].filter(Boolean)
  if (line2.length) lines.push(line2.join(" · "))
  else if (cityStateZip) lines.push(cityStateZip)
  return lines.length ? lines : ["—"]
}

function buildOrganizerMailto(opp: DashboardOpportunity, truck: TruckContext, siteBaseUrl: string) {
  const br = opp.booking
  if (!br?.contact_email) return null
  const eventName = br.event_display_name
  const subject = `Food Truck Interest – ${eventName}`
  const profilePath = truck.slug ? `/trucks/${truck.slug}` : "/trucks"
  const profileUrl = `${siteBaseUrl}${profilePath}`
  const body = [
    `Hello,`,
    ``,
    `I'm writing from ${truck.name} (${truck.cuisineLine}).`,
    ``,
    `Truck profile: ${profileUrl}`,
    ``,
    `Please confirm the event details, schedule, and payment terms before I commit to participating.`,
    ``,
    `Thank you,`,
    truck.name,
  ].join("\n")
  const email = br.contact_email.trim()
  if (!email) return null
  return `mailto:${email}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`
}

function buildReportMailto(opp: DashboardOpportunity, supportEmail: string) {
  const name = opp.booking?.event_display_name ?? "Event"
  const subject = `Report: ${name}`
  const body = `I would like to report an issue related to this event opportunity (opportunity id: ${opp.id}).\n\n`
  return `mailto:${supportEmail.trim()}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`
}

function OpportunityActions({
  opp,
  truckContext,
  siteBaseUrl,
  supportEmail,
  isPending,
  busy,
  submitting,
  interestRecorded,
  onAction,
  className,
}: {
  opp: DashboardOpportunity
  truckContext: TruckContext | null
  siteBaseUrl: string
  supportEmail: string
  isPending: boolean
  busy: boolean
  submitting: "interested" | "pass" | null
  interestRecorded: boolean
  onAction: (formData: FormData) => void | Promise<void>
  className?: string
}) {
  const br = opp.booking
  const organizerMailto =
    truckContext != null && isPending && br ? buildOrganizerMailto(opp, truckContext, siteBaseUrl) : null

  if (!isPending) return null

  return (
    <div className={cn("space-y-2 pt-1", className)} onClick={(e) => e.stopPropagation()}>
      <div className="flex gap-2">
        <form action={onAction} className="flex-1">
          <input type="hidden" name="opportunityId" value={opp.id} />
          <input type="hidden" name="status" value="interested" />
          <Button
            type="submit"
            size="sm"
            className="w-full"
            disabled={!!busy || interestRecorded}
          >
            {busy && submitting === "interested"
              ? "Saving…"
              : interestRecorded
                ? "Interest saved"
                : "Interested"}
          </Button>
        </form>
        <form action={onAction} className="flex-1">
          <input type="hidden" name="opportunityId" value={opp.id} />
          <input type="hidden" name="status" value="pass" />
          <Button type="submit" variant="outline" size="sm" className="w-full" disabled={!!busy || interestRecorded}>
            {busy && submitting === "pass" ? "Saving…" : "Pass"}
          </Button>
        </form>
      </div>
      {truckContext && organizerMailto && (
        <Button variant="outline" size="sm" className="w-full" asChild>
          <a href={organizerMailto}>
            <Mail className="h-3.5 w-3.5 mr-1.5" />
            Email organizer
          </a>
        </Button>
      )}
      {isPending && !br?.contact_email && (
        <p className="text-xs text-muted-foreground">Organizer email isn’t available for this request.</p>
      )}
      <a
        href={buildReportMailto(opp, supportEmail)}
        className="text-xs text-muted-foreground underline underline-offset-2 hover:text-foreground inline-block"
      >
        Report this event
      </a>
    </div>
  )
}

function OpportunityDetailBody({ opp }: { opp: DashboardOpportunity }) {
  const br = opp.booking
  const eventTypeLabel =
    EVENT_TYPES.find((t) => t.value === br?.event_type)?.label ?? br?.event_type ?? "—"
  const locationLines = br ? formatLocation(br) : ["—"]
  const notes = br?.additional_notes?.trim()

  return (
    <div className="space-y-4 text-sm">
      <div>
        <p className="text-xs font-medium text-muted-foreground">Event type</p>
        <p className="text-foreground mt-0.5">{eventTypeLabel}</p>
      </div>
      <Separator />
      <div className="flex gap-3">
        <Calendar className="h-4 w-4 text-muted-foreground shrink-0 mt-0.5" />
        <div>
          <p className="text-xs font-medium text-muted-foreground">Date</p>
          <p className="text-foreground">{formatEventDate(br?.event_date ?? null)}</p>
        </div>
      </div>
      <div className="flex gap-3">
        <Clock className="h-4 w-4 text-muted-foreground shrink-0 mt-0.5" />
        <div>
          <p className="text-xs font-medium text-muted-foreground">Time</p>
          <p className="text-foreground">{formatTimeRange(br?.start_time, br?.end_time)}</p>
        </div>
      </div>
      <div className="flex gap-3">
        <MapPin className="h-4 w-4 text-muted-foreground shrink-0 mt-0.5" />
        <div>
          <p className="text-xs font-medium text-muted-foreground">Location</p>
          <div className="text-foreground space-y-0.5">
            {locationLines.map((line, i) => (
              <p key={i}>{line}</p>
            ))}
          </div>
        </div>
      </div>
      <div className="flex gap-3">
        <Users className="h-4 w-4 text-muted-foreground shrink-0 mt-0.5" />
        <div>
          <p className="text-xs font-medium text-muted-foreground">Guest count</p>
          <p className="text-foreground">{br?.guest_count != null ? String(br.guest_count) : "—"}</p>
        </div>
      </div>
      <Separator />
      <div>
        <p className="text-xs font-medium text-muted-foreground mb-1">Description / notes</p>
        <p className="text-foreground whitespace-pre-wrap break-words">
          {notes || "No additional notes were provided for this request."}
        </p>
      </div>
      <Separator />
      <div>
        <p className="text-xs font-medium text-muted-foreground">Your response</p>
        <Badge variant="secondary" className="text-xs capitalize mt-1">
          {opp.status}
        </Badge>
      </div>
    </div>
  )
}

export function DashboardEventOpportunities({
  opportunities,
  truckContext,
  siteBaseUrl,
  supportEmail,
}: {
  opportunities: DashboardOpportunity[]
  truckContext: TruckContext | null
  siteBaseUrl: string
  supportEmail: string
}) {
  const router = useRouter()
  const [submitting, setSubmitting] = useState<"interested" | "pass" | null>(null)
  const [activeOppId, setActiveOppId] = useState<string | null>(null)
  const [interestSentIds, setInterestSentIds] = useState<Record<string, true>>({})
  const [detailOpp, setDetailOpp] = useState<DashboardOpportunity | null>(null)
  const busyRef = useRef(false)

  useEffect(() => {
    if (detailOpp && !opportunities.some((o) => o.id === detailOpp.id)) {
      setDetailOpp(null)
    }
  }, [opportunities, detailOpp])

  async function handleAction(formData: FormData) {
    if (busyRef.current) return
    const id = String(formData.get("opportunityId") ?? "")
    const nextStatus = formData.get("status") as "interested" | "pass"
    if (!id || (nextStatus !== "interested" && nextStatus !== "pass")) return
    busyRef.current = true
    setActiveOppId(id)
    setSubmitting(nextStatus)
    try {
      const result = await updateTruckOpportunityStatus(formData)
      if (result.success) {
        if (nextStatus === "interested") {
          setInterestSentIds((d) => ({ ...d, [id]: true }))
          toast({
            title: "You’re interested",
            description: "We’ve saved your response. Email the organizer to confirm details and payment terms.",
          })
        } else {
          toast({
            title: "Passed",
            description: "We’ve recorded that. Other events will still appear here when they match you.",
          })
        }
        setDetailOpp((open) => (open?.id === id ? null : open))
        router.refresh()
      } else {
        toast({
          title: "Couldn’t update",
          description: result.error ?? "Try again in a moment.",
          variant: "destructive",
        })
      }
    } finally {
      busyRef.current = false
      setSubmitting(null)
      setActiveOppId(null)
    }
  }

  if (opportunities.length === 0) {
    return (
      <>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5 text-primary" />
            Event Opportunities
          </CardTitle>
          <CardDescription>Events looking for food trucks in your area</CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground py-2">
            No pending opportunities right now. When a host submits a request that includes your truck, it will show
            up here.
          </p>
          <Button variant="outline" className="w-full mt-4" asChild>
            <Link href="/dashboard/events">View All Events</Link>
          </Button>
        </CardContent>
      </>
    )
  }

  return (
    <>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Calendar className="h-5 w-5 text-primary" />
          Event Opportunities
        </CardTitle>
        <CardDescription>Events looking for food trucks in your area</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {opportunities.map((opp) => {
            const br = opp.booking
            const eventTypeLabel =
              EVENT_TYPES.find((t) => t.value === br?.event_type)?.label ?? br?.event_type ?? "—"
            const dateStr = br?.event_date
              ? new Date(br.event_date).toLocaleDateString("en-US", {
                  month: "short",
                  day: "numeric",
                  year: "numeric",
                })
              : "—"
            const isPending = opp.status === "pending"
            const busy = activeOppId === opp.id
            const interestRecorded = interestSentIds[opp.id] === true

            return (
              <div key={opp.id} className="relative rounded-lg border transition-colors hover:bg-muted/50">
                <button
                  type="button"
                  className="absolute inset-0 z-0 rounded-lg focus:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
                  aria-label={`View details: ${br?.event_display_name ?? eventTypeLabel}`}
                  onClick={() => setDetailOpp(opp)}
                />
                <div className="relative z-10 space-y-3 p-3 pointer-events-none">
                  <div className="flex items-start gap-3">
                    <div className="h-12 w-12 rounded-lg bg-muted flex items-center justify-center shrink-0">
                      <Calendar className="h-6 w-6 text-muted-foreground" />
                    </div>
                    <div className="flex-1 min-w-0 space-y-1">
                      <p className="font-medium text-foreground text-sm truncate">{eventTypeLabel}</p>
                      <p className="text-xs text-muted-foreground">
                        {dateStr}
                        {br?.city != null && br.city !== "" ? ` · ${br.city}` : ""}
                        {br?.guest_count != null ? ` · ${br.guest_count} guests` : ""}
                      </p>
                      <Badge variant="secondary" className="text-xs capitalize">
                        {opp.status}
                      </Badge>
                    </div>
                  </div>
                  {isPending && (
                    <OpportunityActions
                      opp={opp}
                      truckContext={truckContext}
                      siteBaseUrl={siteBaseUrl}
                      supportEmail={supportEmail}
                      isPending={isPending}
                      busy={busy}
                      submitting={submitting}
                      interestRecorded={interestRecorded}
                      onAction={handleAction}
                      className="pointer-events-auto"
                    />
                  )}
                </div>
              </div>
            )
          })}
        </div>
        <p className="text-xs text-muted-foreground mt-4 leading-relaxed">
          FoodTruckCLT connects vendors and event organizers but does not verify events, payment terms, or
          participants. Vendors should confirm details before committing.
        </p>
        <Button variant="outline" className="w-full mt-3" asChild>
          <Link href="/dashboard/events">View All Events</Link>
        </Button>
      </CardContent>

      <Sheet open={detailOpp != null} onOpenChange={(open) => !open && setDetailOpp(null)}>
        <SheetContent side="right" className="flex w-full flex-col sm:max-w-md">
          {detailOpp && (
            <>
              <SheetHeader className="text-left">
                <SheetTitle className="pr-8">
                  {detailOpp.booking?.event_display_name ??
                    EVENT_TYPES.find((t) => t.value === detailOpp.booking?.event_type)?.label ??
                    "Event details"}
                </SheetTitle>
                <SheetDescription className="sr-only">Booking request details and actions</SheetDescription>
              </SheetHeader>
              <div className="flex-1 overflow-y-auto px-4 pb-4">
                <OpportunityDetailBody opp={detailOpp} />
                {detailOpp.status === "pending" && (
                  <>
                    <Separator className="my-4" />
                    <OpportunityActions
                      opp={detailOpp}
                      truckContext={truckContext}
                      siteBaseUrl={siteBaseUrl}
                      supportEmail={supportEmail}
                      isPending
                      busy={activeOppId === detailOpp.id}
                      submitting={submitting}
                      interestRecorded={interestSentIds[detailOpp.id] === true}
                      onAction={handleAction}
                      className="pt-0"
                    />
                  </>
                )}
              </div>
            </>
          )}
        </SheetContent>
      </Sheet>
    </>
  )
}
