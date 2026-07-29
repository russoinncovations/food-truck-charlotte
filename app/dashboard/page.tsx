import { Metadata } from "next"
import Link from "next/link"
import { redirect } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Calendar, Clock, Plus, Eye, Inbox, MapPin, Smartphone } from "lucide-react"
import { createClient } from "@/lib/supabase/server"
import { ServingLocationForm } from "@/components/dashboard/serving-location-form"
import { VendorDashboardHeader } from "@/components/dashboard/vendor-dashboard-header"
import { VendorNavLinks } from "@/components/dashboard/vendor-dashboard-nav"
import {
  DashboardEventOpportunities,
  type DashboardOpportunity,
} from "@/components/dashboard-event-opportunities"
import { DashboardPublicEvents } from "@/components/dashboard/dashboard-public-events"
import { fetchPublicUpcomingEventsForVendorDashboard } from "@/lib/events/public-events"
import {
  fetchVendorPastOpportunities,
  fetchVendorRecentResponseOpportunities,
  fetchVendorOpportunityDiagnostics,
  fetchVendorPendingOpportunities,
  mapRowsToDashboardOpportunities,
  resolveVendorTruckForDashboard,
} from "@/lib/dashboard/vendor-booking-opportunities"
import { isInternalTestTruck } from "@/lib/trucks/internal-test-recipients"
import { VendorDashboardOpportunityDiagnostics } from "@/components/dashboard/vendor-dashboard-opportunity-diagnostics"
import {
  buildVendorLoginRedirectForDashboardOpportunity,
  parseDashboardOpportunityId,
  resolvePendingDeepLinkOpportunity,
} from "@/lib/dashboard/vendor-dashboard-opportunity-link"
import { cn } from "@/lib/utils"

export const metadata: Metadata = {
  title: "Vendor Dashboard | FoodTruck CLT",
  description: "Manage your food truck profile, schedule, and connect with the Charlotte community.",
}

export default async function DashboardPage({
  searchParams,
}: {
  searchParams: Promise<{ opportunity?: string }>
}) {
  const sp = await searchParams
  const requestedOpportunityId = parseDashboardOpportunityId(sp?.opportunity)

  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) {
    if (requestedOpportunityId) {
      redirect(buildVendorLoginRedirectForDashboardOpportunity(requestedOpportunityId))
    }
    redirect("/vendor-login")
  }

  const publicUpcomingEvents = await fetchPublicUpcomingEventsForVendorDashboard(supabase, { limit: 25 })

  const { truck: truckData, authEmail, resolutionNote } = await resolveVendorTruckForDashboard(
    supabase,
    user.email
  )

  const supportEmail = process.env.NEXT_PUBLIC_SUPPORT_EMAIL ?? "support@foodtruckclt.com"
  const siteBaseUrl = (process.env.NEXT_PUBLIC_SITE_URL ?? "").replace(/\/$/, "")

  const truckContext =
    truckData != null
      ? {
          name: truckData.name,
          slug: truckData.slug ?? "",
          cuisineLine:
            Array.isArray(truckData.cuisine_types) && truckData.cuisine_types.length > 0
              ? truckData.cuisine_types.join(", ")
              : (truckData.cuisine ?? "—"),
        }
      : null

  let opportunityCards: DashboardOpportunity[] = []
  let historyOpportunityCards: DashboardOpportunity[] = []
  let pastOpportunityCards: DashboardOpportunity[] = []
  let pendingCount = 0
  let upcomingEventsCount = 0
  let opportunityDiagnostics: Awaited<ReturnType<typeof fetchVendorOpportunityDiagnostics>> | null = null

  /** YYYY-MM-DD in local time — matches `events.date` comparisons in /dashboard/events */
  const todayStr = (() => {
    const d = new Date()
    const y = d.getFullYear()
    const m = String(d.getMonth() + 1).padStart(2, "0")
    const day = String(d.getDate()).padStart(2, "0")
    return `${y}-${m}-${day}`
  })()

  if (truckData?.id) {
    const { count: upcomingN, error: upcomingErr } = await supabase
      .from("events")
      .select("*", { count: "exact", head: true })
      .eq("submitted_by_truck_id", truckData.id)
      .gte("date", todayStr)

    if (!upcomingErr && upcomingN != null) {
      upcomingEventsCount = upcomingN
    }
    const [pendingRows, recentResponseRows, pastRows] = await Promise.all([
      fetchVendorPendingOpportunities(supabase, truckData),
      fetchVendorRecentResponseOpportunities(supabase, truckData),
      fetchVendorPastOpportunities(supabase, truckData),
    ])

    pendingCount = pendingRows.length
    opportunityCards = mapRowsToDashboardOpportunities(pendingRows)
    historyOpportunityCards = mapRowsToDashboardOpportunities(recentResponseRows)
    pastOpportunityCards = mapRowsToDashboardOpportunities(pastRows)

    if (isInternalTestTruck(truckData)) {
      opportunityDiagnostics = await fetchVendorOpportunityDiagnostics(supabase, truckData, authEmail)
      if (resolutionNote && opportunityDiagnostics) {
        opportunityDiagnostics = {
          ...opportunityDiagnostics,
          resolutionNote: opportunityDiagnostics.resolutionNote ?? resolutionNote,
        }
      }
    }
  }

  const initialOpportunityId = (() => {
    if (!requestedOpportunityId) return null
    const pendingMatch = resolvePendingDeepLinkOpportunity(opportunityCards, requestedOpportunityId)
    if (pendingMatch) return pendingMatch.id
    const fromHistory = historyOpportunityCards.find((o) => o.id === requestedOpportunityId)
    if (fromHistory) return fromHistory.id
    const fromPast = pastOpportunityCards.find((o) => o.id === requestedOpportunityId)
    if (fromPast) return fromPast.id
    return null
  })()

  const prioritizeRequestsOnMobile =
    pendingCount > 0 || requestedOpportunityId != null || initialOpportunityId != null

  return (
    <div className="min-h-screen bg-muted/30">
      <VendorDashboardHeader
        truckNameInitial={truckData?.name?.[0] ?? "T"}
        pendingRequestCount={pendingCount}
      />

      <div className="flex">
        <aside className="hidden md:flex flex-col w-64 bg-background border-r min-h-[calc(100vh-4rem)]">
          <div className="flex-1 p-4">
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide px-3 mb-2">Vendor</p>
            <VendorNavLinks pendingRequestCount={pendingCount} />
          </div>
        </aside>

        <main className="flex-1 p-4 md:p-6 pb-24 md:pb-6 space-y-6">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
              <h1 className="font-display text-2xl md:text-3xl font-bold text-foreground">
                Welcome back, {truckData?.name ?? "Your Truck"}!
              </h1>
              <p className="text-muted-foreground">
                Here&apos;s what&apos;s happening with your truck today.
              </p>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" className="gap-2" asChild>
                <Link href="/trucks">
                  <Eye className="h-4 w-4" />
                  View Public Profile
                </Link>
              </Button>
              <Button className="gap-2" asChild>
                <Link href="/dashboard/schedule">
                  <Plus className="h-4 w-4" />
                  Add Schedule
                </Link>
              </Button>
            </div>
          </div>

          {truckData?.id && pendingCount > 0 ? (
            <Card className="border-primary/25 bg-primary/5">
              <CardContent className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 py-4">
                <div className="flex gap-3 min-w-0">
                  <div className="h-10 w-10 rounded-lg bg-primary/15 flex items-center justify-center shrink-0">
                    <Inbox className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <h2 className="font-medium text-foreground">Requests</h2>
                    <p className="text-sm text-muted-foreground">
                      {pendingCount} request{pendingCount === 1 ? "" : "s"} need a response.
                    </p>
                  </div>
                </div>
                <Button variant="default" asChild>
                  <a href="#vendor-requests-to-confirm" className="shrink-0">
                    View requests
                  </a>
                </Button>
              </CardContent>
            </Card>
          ) : null}

          {/*
            Single Requests instance. On mobile with pending (or deep link), Requests sorts above
            Go Live / schedule via order-*. Desktop keeps schedule left, Requests right.
          */}
          <div className="flex flex-col gap-6 lg:grid lg:grid-cols-3">
            <div
              className={cn(
                "space-y-6 lg:col-span-2",
                prioritizeRequestsOnMobile ? "order-2 lg:order-1" : "order-1"
              )}
            >
              {truckData?.id ? (
                <Card className="border-2 border-primary/45 bg-gradient-to-br from-primary/14 via-background to-background shadow-md">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-lg md:text-xl font-display flex flex-wrap items-center gap-2 gap-y-1 text-foreground">
                      <span className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary/15 text-primary">
                        <MapPin className="h-5 w-5" aria-hidden />
                      </span>
                      Turn your location on or off
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <p className="text-sm text-muted-foreground">
                      Open your Go Live page to set your pin, start or stop serving, and update where you appear for
                      customers.
                    </p>
                    <Button size="lg" className="w-full sm:w-auto font-semibold" asChild>
                      <Link href="/dashboard/live">Open Go Live Page</Link>
                    </Button>
                    <p className="text-xs text-muted-foreground">
                      <span className="text-foreground font-medium">Customers see you on the public map.</span>{" "}
                      <Link href="/map" className="underline-offset-2 hover:underline text-primary">
                        View public live map
                      </Link>
                    </p>
                  </CardContent>
                </Card>
              ) : null}

              {truckData?.id ? (
                <Card className="border-primary/20 bg-primary/[0.04]">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-base flex items-center gap-2">
                      <Smartphone className="h-4 w-4 text-primary shrink-0" />
                      Quick access on your phone
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="text-sm text-muted-foreground">
                    <p>Add FoodTruckCLT to your phone home screen for quick access to requests.</p>
                  </CardContent>
                </Card>
              ) : null}

              {truckData?.id ? (
                <Card>
                  <CardContent className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 py-4">
                    <div className="flex items-center gap-3">
                      <div className="h-10 w-10 rounded-lg bg-muted flex items-center justify-center shrink-0">
                        <Calendar className="h-5 w-5 text-primary" />
                      </div>
                      <div>
                        <p className="text-sm font-medium text-foreground">Your Submitted Events</p>
                        <p className="text-xs text-muted-foreground">
                          Events you submitted to FoodTruckCLT. Manage them on the Events page — separate from Requests
                          and from the public events calendar.
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3 sm:shrink-0">
                      <span className="text-2xl font-semibold tabular-nums" aria-live="polite">
                        {upcomingEventsCount}
                      </span>
                      <Button variant="outline" size="sm" asChild>
                        <Link href="/dashboard/events">Manage events</Link>
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ) : null}

              {truckData?.id && pendingCount === 0 ? (
                <p className="text-sm text-muted-foreground">
                  <Link
                    href="/dashboard#vendor-requests-to-confirm"
                    className="text-foreground font-medium underline-offset-2 hover:underline"
                  >
                    Requests
                  </Link>{" "}
                  lists host booking inquiries with I&apos;m interested / Not available — separate from{" "}
                  <span className="font-medium text-foreground">Public Events</span> below.
                </p>
              ) : null}

              <p className="text-sm text-muted-foreground rounded-lg border border-dashed border-border bg-muted/20 px-4 py-3">
                Your schedule helps customers know where you plan to be. Your live location only updates when you start
                serving or manually update your pin.
              </p>

              <Card>
                <CardHeader className="pb-4">
                  <CardTitle className="flex items-center gap-2">
                    <Clock className="h-5 w-5 text-primary" />
                    Today&apos;s Status
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {truckData?.id ? (
                    <ServingLocationForm
                      key={`${truckData.id}-${(truckData as { updated_at?: string | null }).updated_at ?? ""}`}
                      promoteGoLivePage
                      truck={{
                        id: truckData.id,
                        serving_today: truckData.serving_today,
                        serving_started_at:
                          (truckData as { serving_started_at?: string | null }).serving_started_at ?? null,
                        today_location: truckData.today_location,
                        street_address: (truckData as { street_address?: string | null }).street_address ?? null,
                        latitude: (truckData as { latitude?: number | string | null }).latitude ?? null,
                        longitude: (truckData as { longitude?: number | string | null }).longitude ?? null,
                        updated_at: (truckData as { updated_at?: string | null }).updated_at ?? null,
                      }}
                    />
                  ) : (
                    <div className="text-center py-8">
                      <Calendar className="h-12 w-12 mx-auto text-muted-foreground/50 mb-4" />
                      <p className="text-muted-foreground mb-2">No truck found in directory</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>

            <div
              className={cn(
                "space-y-6",
                prioritizeRequestsOnMobile ? "order-1 lg:order-2" : "order-2"
              )}
              aria-label="Requests"
            >
              {opportunityDiagnostics ? (
                <VendorDashboardOpportunityDiagnostics {...opportunityDiagnostics} />
              ) : null}
              <Card id="vendor-requests-to-confirm" className="scroll-mt-28">
                <DashboardEventOpportunities
                  opportunities={opportunityCards}
                  recentResponseOpportunities={historyOpportunityCards}
                  pastOpportunities={pastOpportunityCards}
                  truckContext={truckContext}
                  supportEmail={supportEmail}
                  siteBaseUrl={siteBaseUrl}
                  initialOpportunityId={initialOpportunityId}
                />
              </Card>

              <Card className="bg-accent/5 border-accent/20">
                <CardHeader>
                  <CardTitle className="text-lg">Boost Your Visibility</CardTitle>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-3 text-sm">
                    <li className="flex items-start gap-2">
                      <span className="h-5 w-5 rounded-full bg-accent/20 text-accent flex items-center justify-center shrink-0 text-xs font-bold">
                        1
                      </span>
                      <span className="text-muted-foreground">Post your schedule at least 24 hours ahead</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="h-5 w-5 rounded-full bg-accent/20 text-accent flex items-center justify-center shrink-0 text-xs font-bold">
                        2
                      </span>
                      <span className="text-muted-foreground">Add high-quality photos of your best dishes</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="h-5 w-5 rounded-full bg-accent/20 text-accent flex items-center justify-center shrink-0 text-xs font-bold">
                        3
                      </span>
                      <span className="text-muted-foreground">Respond to inquiries within 24 hours</span>
                    </li>
                  </ul>
                </CardContent>
              </Card>
            </div>
          </div>

          <DashboardPublicEvents events={publicUpcomingEvents} />
        </main>
      </div>
    </div>
  )
}
