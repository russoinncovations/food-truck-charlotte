"use client"

import { useEffect, useRef, useState } from "react"
import { useRouter } from "next/navigation"
import { updateTruckOpportunityStatus } from "@/app/dashboard/actions"
import { BOOKING_REQUEST_TYPE } from "@/lib/booking/booking-request-constants"
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
    request_type: string | null
    booking_truck_id: string | null
    cuisines: string[] | null
    vendor_type: string | null
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

function requestVisibilityLabel(br: NonNullable<DashboardOpportunity["booking"]> | null | undefined) {
  const rt = br?.request_type
  if (rt === BOOKING_REQUEST_TYPE.SPECIFIC_VENDOR) return "Requested for your truck"
  if (rt === BOOKING_REQUEST_TYPE.OPEN_REQUEST) return "Open request"
  if (rt === BOOKING_REQUEST_TYPE.CUISINE_MATCH) return "Cuisine request"
  if (br?.booking_truck_id) return "Requested for your truck"
  return "Booking request"
}

function opportunityResponseLabel(status: string): string {
  const s = status.toLowerCase()
  if (s === "interested") return "Interested"
  if (s === "pass" || s === "not_available") return "Not available"
  if (s === "pending") return "Pending"
  return status
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
  submitting: "interested" | "not_available" | null
  interestRecorded: boolean
  onAction: (formData: FormData) => void | Promise<void>
  className?: string
}) {
  const br = opp.booking
  const organizerMailto =
    truckContext != null && isPending && br && interestRecorded
      ? buildOrganizerMailto(opp, truckContext, siteBaseUrl)
      : null

  if (!isPending) return null

  return (
    <div className={cn("space-y-2 pt-1", className)} onClick={(e) => e.stopPropagation()}>
      <p className="text-xs font-medium text-foreground">I’m interested / Not available</p>
      <p className="text-xs text-muted-foreground leading-relaxed">
        After you mark <span className="font-medium text-foreground">I&apos;m interested</span>, an{" "}
        <span className="font-medium text-foreground">Email organizer</span> button appears so you can reach the host
        directly.
      </p>
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
                : "I’m interested"}
          </Button>
        </form>
        <form action={onAction} className="flex-1">
          <input type="hidden" name="opportunityId" value={opp.id} />
          <input type="hidden" name="status" value="not_available" />
          <Button type="submit" variant="outline" size="sm" className="w-full" disabled={!!busy || interestRecorded}>
            {busy && submitting === "not_available" ? "Saving…" : "Not available"}
          </Button>
        </form>
      </div>
      {truckContext && organizerMailto && (
        <Button variant="outline" size="sm" className="w-full" asChild>
          <a href={organizerMailto}>
            <Mail className="h-3.5 w-3.5 mr-1.5" />
            Email Organizer
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
        Report this booking request
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
  const cuisineList =
    br?.cuisines?.filter((c) => String(c).trim() !== "").map((c) => String(c).trim()) ?? []
  const vendorFmt = br?.vendor_type?.trim()

  return (
    <div className="space-y-4 text-sm">
      <div>
        <p className="text-xs font-medium text-muted-foreground">Event type</p>
        <p className="text-foreground mt-0.5">{eventTypeLabel}</p>
      </div>
      {(vendorFmt || cuisineList.length > 0) && (
        <>
          <Separator />
          {vendorFmt ? (
            <div>
              <p className="text-xs font-medium text-muted-foreground">Vendor format</p>
              <p className="text-foreground mt-0.5 capitalize">{vendorFmt}</p>
            </div>
          ) : null}
          {cuisineList.length > 0 ? (
            <div>
              <p className="text-xs font-medium text-muted-foreground">Requested cuisines</p>
              <p className="text-foreground mt-0.5">{cuisineList.join(", ")}</p>
            </div>
          ) : null}
        </>
      )}
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
          {opportunityResponseLabel(opp.status)}
        </Badge>
      </div>
    </div>
  )
}

export function DashboardEventOpportunities({
  opportunities,
  historyOpportunities = [],
  truckContext,
  siteBaseUrl,
  supportEmail,
}: {
  opportunities: DashboardOpportunity[]
  historyOpportunities?: DashboardOpportunity[]
  truckContext: TruckContext | null
  siteBaseUrl: string
  supportEmail: string
}) {
  const router = useRouter()
  const [submitting, setSubmitting] = useState<"interested" | "not_available" | null>(null)
  const [activeOppId, setActiveOppId] = useState<string | null>(null)
  const [interestSentIds, setInterestSentIds] = useState<Record<string, true>>({})
  const [detailOpp, setDetailOpp] = useState<DashboardOpportunity | null>(null)
  const busyRef = useRef(false)

  useEffect(() => {
    const inActive = opportunities.some((o) => o.id === detailOpp?.id)
    const inHistory = historyOpportunities.some((o) => o.id === detailOpp?.id)
    if (detailOpp && !inActive && !inHistory) {
      setDetailOpp(null)
    }
  }, [opportunities, historyOpportunities, detailOpp])

  async function handleAction(formData: FormData) {
    if (busyRef.current) return
    const id = String(formData.get("opportunityId") ?? "")
    const raw = formData.get("status") as string | null
    const nextStatus =
      raw === "pass" ? "not_available" : raw === "not_available" || raw === "interested" ? raw : null
    if (!id || (nextStatus !== "interested" && nextStatus !== "not_available")) return
    busyRef.current = true
    setActiveOppId(id)
    setSubmitting(nextStatus)
    try {
      const result = await updateTruckOpportunityStatus(formData)
      if (result.success) {
        if (nextStatus === "interested") {
          setInterestSentIds((d) => ({ ...d, [id]: true }))
          toast({
            title: "Marked as interested",
            description: "We’ve saved your response. Email the organizer to confirm details and payment terms.",
          })
        } else {
          toast({
            title: "Marked as not available",
            description: "We’ve recorded that. You won’t see this request in your active list anymore.",
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

  const bothEmpty = opportunities.length === 0 && historyOpportunities.length === 0

  if (bothEmpty) {
    return (
      <>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5 text-primary" />
            Requests to Confirm
          </CardTitle>
          <CardDescription>
            Requests from customers looking to book a food truck, cart, or tent — not public calendar listings.
          </CardDescription>
          <p className="text-xs text-muted-foreground pt-1">
            Direct bookings to your truck, open requests, and cuisine matches appear here when hosts submit them. After
            you mark <span className="font-medium text-foreground">I&apos;m interested</span>, you can email the host
            from this panel.
          </p>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground py-2">
            No pending requests right now. When a host reaches out, you&apos;ll see it here.
          </p>
        </CardContent>
      </>
    )
  }

  return (
    <>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Calendar className="h-5 w-5 text-primary" />
          Requests to Confirm
        </CardTitle>
        <CardDescription>
          Tap a request for full details. Mark <span className="font-medium text-foreground">I&apos;m interested</span>{" "}
          or <span className="font-medium text-foreground">Not available</span>, then email the organizer only after
          you&apos;ve recorded interest.
        </CardDescription>
        <p className="text-xs text-muted-foreground pt-1">
          FoodTruckCLT shares opportunities from customers. Agreements and payments are between you and the host.
        </p>
      </CardHeader>
      <CardContent>
        {opportunities.length === 0 ? (
          <p className="text-sm text-muted-foreground py-2 mb-4">
            No active requests need a response right now. Recent responses are below.
          </p>
        ) : null}
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
            const visibilityLabel = requestVisibilityLabel(br)

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
                      <p className="font-medium text-foreground text-sm truncate">
                        {br?.event_display_name ?? eventTypeLabel}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {br?.event_display_name ? `${eventTypeLabel} · ` : ""}
                        {dateStr}
                        {br?.city != null && br.city !== "" ? ` · ${br.city}` : ""}
                        {br?.guest_count != null ? ` · ${br.guest_count} guests` : ""}
                      </p>
                      <div className="flex flex-wrap gap-1.5 pt-0.5">
                        <Badge variant="outline" className="text-xs font-normal max-w-full truncate">
                          {visibilityLabel}
                        </Badge>
                        <Badge variant="secondary" className="text-xs capitalize">
                          {opportunityResponseLabel(opp.status)}
                        </Badge>
                      </div>
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

        {historyOpportunities.length > 0 ? (
          <div className="mt-8 space-y-3">
            <div>
              <p className="text-sm font-medium text-foreground">Your recent responses</p>
              <p className="text-xs text-muted-foreground leading-relaxed">
                Opportunities you&apos;ve already marked. Use <span className="font-medium text-foreground">Email organizer</span>{" "}
                only for requests where you said you were interested.
              </p>
            </div>
            <div className="space-y-4">
              {historyOpportunities.map((opp) => {
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
                const st = opp.status.toLowerCase()
                const isInterested = st === "interested"
                const organizerMailto =
                  truckContext && isInterested && br
                    ? buildOrganizerMailto(opp, truckContext, siteBaseUrl)
                    : null
                const visibilityLabel = requestVisibilityLabel(br)

                return (
                  <div key={opp.id} className="relative rounded-lg border border-border/80 bg-muted/20">
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
                          <p className="font-medium text-foreground text-sm truncate">
                            {br?.event_display_name ?? eventTypeLabel}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {br?.event_display_name ? `${eventTypeLabel} · ` : ""}
                            {dateStr}
                            {br?.city != null && br.city !== "" ? ` · ${br.city}` : ""}
                          </p>
                          <div className="flex flex-wrap gap-1.5 pt-0.5">
                            <Badge variant="outline" className="text-xs font-normal max-w-full truncate">
                              {visibilityLabel}
                            </Badge>
                            <Badge variant="secondary" className="text-xs capitalize">
                              {opportunityResponseLabel(opp.status)}
                            </Badge>
                          </div>
                        </div>
                      </div>
                      {organizerMailto ? (
                        <div className="pointer-events-auto" onClick={(e) => e.stopPropagation()}>
                          <Button variant="outline" size="sm" className="w-full" asChild>
                            <a href={organizerMailto}>
                              <Mail className="h-3.5 w-3.5 mr-1.5" />
                              Email organizer
                            </a>
                          </Button>
                        </div>
                      ) : null}
                      <div className="pointer-events-auto" onClick={(e) => e.stopPropagation()}>
                        <a
                          href={buildReportMailto(opp, supportEmail)}
                          className="text-xs text-muted-foreground underline underline-offset-2 hover:text-foreground inline-block"
                        >
                          Report this booking request
                        </a>
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        ) : null}

        <p className="text-xs text-muted-foreground mt-4 leading-relaxed">
          FoodTruckCLT connects vendors and event organizers but does not verify events, payment terms, or participants.
          Vendors should confirm details before committing.
        </p>
      </CardContent>

      <Sheet open={detailOpp != null} onOpenChange={(open) => !open && setDetailOpp(null)}>
        <SheetContent side="right" className="flex w-full flex-col sm:max-w-md">
          {detailOpp && (
            <>
              <SheetHeader className="text-left">
                <SheetTitle className="pr-8">
                  {detailOpp.booking?.event_display_name ??
                    EVENT_TYPES.find((t) => t.value === detailOpp.booking?.event_type)?.label ??
                    "Booking request details"}
                </SheetTitle>
                <div className="pt-1">
                  <Badge variant="outline" className="text-xs font-normal">
                    {requestVisibilityLabel(detailOpp.booking)}
                  </Badge>
                </div>
                <SheetDescription className="text-left text-xs text-muted-foreground max-w-[95%]">
                  <span className="sr-only">Booking request details and actions. </span>
                  Booking inquiry from a host — not a public calendar listing.
                </SheetDescription>
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
                {detailOpp.status.toLowerCase() === "interested" && truckContext && detailOpp.booking?.contact_email ? (
                  <>
                    <Separator className="my-4" />
                    <div className="space-y-2">
                      <p className="text-xs font-medium text-foreground">Follow up with the host</p>
                      <Button variant="outline" size="sm" className="w-full" asChild>
                        <a
                          href={
                            buildOrganizerMailto(detailOpp, truckContext, siteBaseUrl) ?? "#"
                          }
                        >
                          <Mail className="h-3.5 w-3.5 mr-1.5" />
                          Email organizer
                        </a>
                      </Button>
                    </div>
                  </>
                ) : null}
              </div>
            </>
          )}
        </SheetContent>
      </Sheet>
    </>
  )
}
