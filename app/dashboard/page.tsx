import { Metadata } from "next"
import Link from "next/link"
import { redirect } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Calendar, Clock, Plus, Eye, Inbox, Truck } from "lucide-react"
import { createClient } from "@/lib/supabase/server"
import { EVENT_TYPES } from "@/lib/booking-types"
import { ServingLocationForm } from "@/components/dashboard/serving-location-form"
import { VendorDashboardHeader } from "@/components/dashboard/vendor-dashboard-header"
import { VendorNavLinks } from "@/components/dashboard/vendor-dashboard-nav"
import {
  DashboardEventOpportunities,
  type DashboardOpportunity,
} from "@/components/dashboard-event-opportunities"

type TruckOpportunityRow = {
  id: string
  status: string
  booking_request_id: string | null
  created_at?: string
  booking_requests: unknown
}

function dedupeOpportunitiesByBookingId<T extends { id: string; booking_request_id?: string | null; created_at?: string }>(
  rows: T[]
): T[] {
  const byKey = new Map<string, T>()
  for (const row of rows) {
    const key = row.booking_request_id ? String(row.booking_request_id) : `opp-${row.id}`
    const existing = byKey.get(key)
    if (!existing) {
      byKey.set(key, row)
      continue
    }
    const t0 = new Date(existing.created_at ?? 0).getTime()
    const t1 = new Date(row.created_at ?? 0).getTime()
    if (t1 >= t0) {
      byKey.set(key, row)
    }
  }
  return [...byKey.values()].sort(
    (a, b) => new Date(b.created_at ?? 0).getTime() - new Date(a.created_at ?? 0).getTime()
  )
}

export const metadata: Metadata = {
  title: "Vendor Dashboard | FoodTruck CLT",
  description: "Manage your food truck profile, schedule, and connect with the Charlotte community.",
}

// Mock vendor data - in production this would come from auth/database
export default async function DashboardPage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) {
    redirect("/vendor-login")
  }
  const { data: truckData } = await supabase
    .from("trucks")
    .select("id, name, slug, cuisine, cuisine_types, serving_today, today_location, street_address, latitude, longitude, updated_at")
    .eq("email", user.email)
    .single()

  const publicSiteBase = (() => {
    const fromEnv = process.env.NEXT_PUBLIC_APP_URL
    if (fromEnv) return fromEnv.replace(/\/$/, "")
    const v = process.env.VERCEL_URL
    if (v) {
      const host = v.replace(/^https?:\/\//, "")
      return `https://${host.replace(/\/$/, "")}`
    }
    return "https://www.foodtruckclt.com"
  })()

  const supportEmail = process.env.NEXT_PUBLIC_SUPPORT_EMAIL ?? "support@foodtruckclt.com"

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
  let pendingCount = 0
  let upcomingEventsCount = 0

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
    const { data: rawOpportunities } = await supabase
      .from("truck_opportunities")
      .select("*, booking_requests(*)")
      .eq("truck_id", truckData.id)
      .eq("status", "pending")
      .order("created_at", { ascending: false })
      .limit(50)

    const uniques = dedupeOpportunitiesByBookingId(
      (rawOpportunities ?? []) as TruckOpportunityRow[]
    )
    pendingCount = uniques.length

    opportunityCards = uniques.slice(0, 5).map((opp) => {
      const raw = opp.booking_requests
      const br = Array.isArray(raw) ? raw[0] : raw
      const row = br as
        | {
            event_type: string | null
            event_date: string | null
            city: string | null
            guest_count: number | null
            contact_email: string | null
            venue_name: string | null
            start_time: string | null
            end_time: string | null
            street_address: string | null
            state: string | null
            zip_code: string | null
            additional_notes: string | null
          }
        | null
        | undefined
      const eventTypeLabel =
        row != null
          ? (EVENT_TYPES.find((t) => t.value === row.event_type)?.label ?? row.event_type ?? "Event")
          : "Event"
      const eventDisplayName =
        row != null && row.venue_name != null && String(row.venue_name).trim() !== ""
          ? String(row.venue_name).trim()
          : eventTypeLabel
      return {
        id: opp.id,
        status: String(opp.status),
        booking: row
          ? {
              event_type: row.event_type,
              event_date: row.event_date,
              city: row.city,
              guest_count: row.guest_count,
              contact_email: row.contact_email,
              venue_name: row.venue_name,
              event_display_name: eventDisplayName,
              start_time: row.start_time,
              end_time: row.end_time,
              street_address: row.street_address,
              state: row.state,
              zip_code: row.zip_code,
              additional_notes: row.additional_notes,
            }
          : null,
      }
    })
  }

  return (
    <div className="min-h-screen bg-muted/30">
      <VendorDashboardHeader truckNameInitial={truckData?.name?.[0] ?? "T"} />

      <div className="flex">
        <aside className="hidden md:flex flex-col w-64 bg-background border-r min-h-[calc(100vh-4rem)]">
          <div className="flex-1 p-4">
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide px-3 mb-2">Vendor</p>
            <VendorNavLinks />
          </div>
        </aside>

        {/* Main Content */}
        <main className="flex-1 p-4 md:p-6 space-y-6">
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

          {truckData?.id && (
            <Card>
              <CardContent className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 py-4">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-lg bg-muted flex items-center justify-center shrink-0">
                    <Calendar className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-foreground">Upcoming Events</p>
                    <p className="text-xs text-muted-foreground">
                      Your submitted events with a date on or after today. Past events are hidden from this count; open
                      Events to see your full list.
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-3 sm:shrink-0">
                  <span className="text-2xl font-semibold tabular-nums" aria-live="polite">
                    {upcomingEventsCount}
                  </span>
                  <Button variant="outline" size="sm" asChild>
                    <Link href="/dashboard/events">Open Events</Link>
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          <div className="space-y-4">
            {truckData?.id && pendingCount > 0 && (
              <Card className="border-primary/25 bg-primary/5">
                <CardContent className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 py-4">
                  <div className="flex gap-3 min-w-0">
                    <div className="h-10 w-10 rounded-lg bg-primary/15 flex items-center justify-center shrink-0">
                      <Inbox className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                      <h2 className="font-medium text-foreground">Requests to confirm</h2>
                      <p className="text-sm text-muted-foreground">
                        {pendingCount} booking request{pendingCount === 1 ? "" : "s"} from hosts need a response. Open
                        a card to view details, choose Interested or Pass, and email the organizer to finalize.
                      </p>
                    </div>
                  </div>
                  <Button variant="default" asChild>
                    <a href="#vendor-booking-requests" className="shrink-0">
                      View booking requests
                    </a>
                  </Button>
                </CardContent>
              </Card>
            )}
            {truckData?.id && pendingCount === 0 && (
              <p className="text-sm text-muted-foreground">
                <Link
                  href="/dashboard#vendor-booking-requests"
                  className="text-foreground font-medium underline-offset-2 hover:underline"
                >
                  Booking Requests
                </Link>{" "}
                (right column) is where host inquiries appear. Use the sidebar or{" "}
                <span className="text-foreground font-medium">menu</span> (mobile) to jump there.
              </p>
            )}
          </div>

          <div className="grid lg:grid-cols-3 gap-6">
            {/* Left Column - Schedule & Profile */}
            <div className="lg:col-span-2 space-y-6">
              {/* Today's Status */}
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
                      truck={{
                        id: truckData.id,
                        serving_today: truckData.serving_today,
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

            <div className="space-y-6" aria-label="Booking requests and tips">
              <Card id="vendor-booking-requests" className="scroll-mt-28">
                <DashboardEventOpportunities
                  opportunities={opportunityCards}
                  truckContext={truckContext}
                  siteBaseUrl={publicSiteBase}
                  supportEmail={supportEmail}
                />
              </Card>

              {/* Tips Card */}
              <Card className="bg-accent/5 border-accent/20">
                <CardHeader>
                  <CardTitle className="text-lg">Boost Your Visibility</CardTitle>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-3 text-sm">
                    <li className="flex items-start gap-2">
                      <span className="h-5 w-5 rounded-full bg-accent/20 text-accent flex items-center justify-center shrink-0 text-xs font-bold">1</span>
                      <span className="text-muted-foreground">Post your schedule at least 24 hours ahead</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="h-5 w-5 rounded-full bg-accent/20 text-accent flex items-center justify-center shrink-0 text-xs font-bold">2</span>
                      <span className="text-muted-foreground">Add high-quality photos of your best dishes</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="h-5 w-5 rounded-full bg-accent/20 text-accent flex items-center justify-center shrink-0 text-xs font-bold">3</span>
                      <span className="text-muted-foreground">Respond to inquiries within 24 hours</span>
                    </li>
                  </ul>
                </CardContent>
              </Card>
            </div>
          </div>
        </main>
      </div>
    </div>
  )
}
