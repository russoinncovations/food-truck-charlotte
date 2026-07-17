import { Metadata } from "next"
import Link from "next/link"
import { redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import { VendorDashboardHeader } from "@/components/dashboard/vendor-dashboard-header"
import { VendorNavLinks } from "@/components/dashboard/vendor-dashboard-nav"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { resolveVendorTruckForDashboard } from "@/lib/dashboard/vendor-booking-opportunities"
import {
  fetchVendorAnalyticsSummary,
  formatAverageResponseTime,
  parseVendorAnalyticsWindow,
  type VendorAnalyticsWindow,
} from "@/lib/dashboard/vendor-analytics"
import { cn } from "@/lib/utils"

export const metadata: Metadata = {
  title: "Activity Summary | Vendor | Food Truck CLT",
  description: "See how your FoodTruckCLT profile and booking opportunities are performing.",
}

function MetricCard({
  label,
  value,
  hint,
}: {
  label: string
  value: string | number
  hint?: string
}) {
  return (
    <div className="rounded-lg border border-border/70 bg-background px-4 py-3">
      <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">{label}</p>
      <p className="mt-1 font-display text-2xl font-bold tabular-nums text-foreground">{value}</p>
      {hint ? <p className="mt-1 text-xs text-muted-foreground">{hint}</p> : null}
    </div>
  )
}

function formatEventDate(dateString: string | null): string {
  if (!dateString) return "—"
  const [year, month, day] = dateString.split("-").map(Number)
  if (!year || !month || !day) return dateString
  return new Date(year, month - 1, day).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  })
}

function WindowToggle({ active }: { active: VendorAnalyticsWindow }) {
  const items: { key: VendorAnalyticsWindow; label: string }[] = [
    { key: "30d", label: "Last 30 days" },
    { key: "all", label: "All time" },
  ]
  return (
    <div className="inline-flex rounded-md border border-border bg-background p-0.5">
      {items.map((item) => (
        <Link
          key={item.key}
          href={item.key === "30d" ? "/dashboard/analytics" : "/dashboard/analytics?window=all"}
          className={cn(
            "rounded px-3 py-1.5 text-sm transition-colors",
            active === item.key
              ? "bg-primary/10 font-medium text-primary"
              : "text-muted-foreground hover:text-foreground"
          )}
        >
          {item.label}
        </Link>
      ))}
    </div>
  )
}

export default async function VendorAnalyticsPage({
  searchParams,
}: {
  searchParams: Promise<{ window?: string }>
}) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) redirect("/vendor-login")

  const params = await searchParams
  const window = parseVendorAnalyticsWindow(params.window)

  const { truck } = await resolveVendorTruckForDashboard(supabase, user.email)

  if (!truck?.id) {
    return (
      <div className="min-h-screen bg-muted/30">
        <VendorDashboardHeader truckNameInitial="T" />
        <div className="mx-auto max-w-lg p-6">
          <Card>
            <CardHeader>
              <CardTitle>No truck profile</CardTitle>
              <CardDescription>
                We couldn&apos;t find a truck linked to your login email.
              </CardDescription>
            </CardHeader>
            <CardContent className="flex flex-wrap gap-2">
              <Button asChild variant="outline">
                <Link href="/dashboard">Back to dashboard</Link>
              </Button>
              <Button asChild>
                <Link href="/list-your-truck">List your truck</Link>
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    )
  }

  const summary = await fetchVendorAnalyticsSummary(supabase, truck, window)
  const { bookings, response, email, recent, liveSchedule } = summary
  const hasOpportunities = bookings.received > 0

  return (
    <div className="min-h-screen bg-muted/30">
      <VendorDashboardHeader truckNameInitial={truck.name?.[0] ?? "T"} />

      <div className="flex">
        <aside className="hidden min-h-[calc(100vh-4rem)] w-64 flex-col border-r bg-background md:flex">
          <div className="flex-1 p-4">
            <p className="mb-2 px-3 text-xs font-medium uppercase tracking-wide text-muted-foreground">
              Vendor
            </p>
            <VendorNavLinks />
          </div>
        </aside>

        <main className="flex-1 space-y-6 p-4 md:p-6">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <h1 className="font-display text-2xl font-bold tracking-tight text-foreground md:text-3xl">
                Activity Summary
              </h1>
              <p className="mt-1 max-w-xl text-muted-foreground">
                See how your FoodTruckCLT profile and booking opportunities are performing.
              </p>
            </div>
            <WindowToggle active={window} />
          </div>

          {/* Booking Opportunities */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-lg">Booking opportunities</CardTitle>
              <CardDescription>{summary.windowLabel}</CardDescription>
            </CardHeader>
            <CardContent>
              {!hasOpportunities ? (
                <p className="text-sm leading-relaxed text-muted-foreground">
                  No opportunities yet. Keep your profile complete so hosts can find you.
                </p>
              ) : (
                <div className="grid grid-cols-2 gap-3 lg:grid-cols-5">
                  <MetricCard label="Received" value={bookings.received} />
                  <MetricCard label="Interested" value={bookings.interested} />
                  <MetricCard label="Not available" value={bookings.notAvailable} />
                  <MetricCard label="No response / expired" value={bookings.expiredOrNoResponse} />
                  <MetricCard label="Pending" value={bookings.pending} />
                </div>
              )}
            </CardContent>
          </Card>

          {/* Response Activity */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-lg">Response activity</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {!hasOpportunities ? (
                <p className="text-sm text-muted-foreground">
                  When booking requests reach your truck, your response rate will show up here.
                </p>
              ) : (
                <>
                  <p className="text-base text-foreground">
                    You responded to{" "}
                    <span className="font-semibold tabular-nums">{response.responded}</span> of{" "}
                    <span className="font-semibold tabular-nums">{response.total}</span> opportunities.
                  </p>
                  <p className="text-sm text-muted-foreground">
                    Average response time:{" "}
                    <span className="text-foreground">
                      {formatAverageResponseTime(response.averageResponseHours)}
                    </span>
                  </p>
                </>
              )}
            </CardContent>
          </Card>

          {/* Recent Opportunities */}
          <Card>
            <CardHeader className="pb-3">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div>
                  <CardTitle className="text-lg">Recent opportunities</CardTitle>
                  <CardDescription>No host contact details are shown here.</CardDescription>
                </div>
                {hasOpportunities ? (
                  <Button asChild variant="outline" size="sm">
                    <Link href="/dashboard#vendor-requests-to-confirm">View requests</Link>
                  </Button>
                ) : null}
              </div>
            </CardHeader>
            <CardContent>
              {recent.length === 0 ? (
                <p className="text-sm text-muted-foreground">
                  No opportunities yet. Keep your profile complete so hosts can find you.
                </p>
              ) : (
                <ul className="divide-y divide-border/70 rounded-lg border border-border/70">
                  {recent.map((opp) => (
                    <li
                      key={opp.id}
                      className="flex flex-col gap-2 px-4 py-3 sm:flex-row sm:items-center sm:justify-between"
                    >
                      <div className="min-w-0">
                        <p className="font-medium text-foreground">{opp.eventTypeLabel}</p>
                        <p className="mt-0.5 text-sm text-muted-foreground">
                          {formatEventDate(opp.eventDate)}
                          {opp.city ? ` · ${opp.city}` : ""}
                          {opp.guestCount != null ? ` · ${opp.guestCount} guests` : ""}
                        </p>
                      </div>
                      <div className="flex flex-wrap gap-1.5">
                        <Badge variant="secondary" className="font-normal">
                          {opp.responseStatusLabel}
                        </Badge>
                        {opp.emailStatusLabel ? (
                          <Badge variant="outline" className="font-normal">
                            {opp.emailStatusLabel}
                          </Badge>
                        ) : null}
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </CardContent>
          </Card>

          {/* Email Engagement */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-lg">Email engagement</CardTitle>
              <CardDescription>
                From booking opportunity emails only. Email opens can be approximate.
              </CardDescription>
            </CardHeader>
            <CardContent>
              {!hasOpportunities || email.sent === 0 ? (
                <p className="text-sm text-muted-foreground">
                  No booking emails to report yet for this period.
                </p>
              ) : (
                <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
                  <MetricCard label="Sent" value={email.sent} />
                  <MetricCard label="Delivered" value={email.delivered} />
                  <MetricCard label="Opened" value={email.opened} hint="Approximate" />
                  <MetricCard label="Clicked" value={email.clicked} />
                  <MetricCard label="Bounced / failed" value={email.bouncedOrFailed} />
                </div>
              )}
            </CardContent>
          </Card>

          {/* Live & Scheduled */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-lg">Live &amp; scheduled activity</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
                <MetricCard
                  label="Currently live"
                  value={liveSchedule.currentlyLive ? "Yes" : "No"}
                  hint={
                    liveSchedule.currentlyLive
                      ? "Your pin is on the public map"
                      : "Go Live when you are serving"
                  }
                />
                <MetricCard
                  label="Scheduled stops this month"
                  value={liveSchedule.scheduledStopsThisMonth}
                />
                <MetricCard
                  label="Weekly schedule"
                  value={`${liveSchedule.weeklyScheduleDaysSet} day${liveSchedule.weeklyScheduleDaysSet === 1 ? "" : "s"}`}
                  hint={liveSchedule.weeklyScheduleLabel}
                />
              </div>
              <div className="mt-4 flex flex-wrap gap-2">
                <Button asChild variant="outline" size="sm">
                  <Link href="/dashboard/live">Go Live</Link>
                </Button>
                <Button asChild variant="outline" size="sm">
                  <Link href="/dashboard/scheduled-stops">Scheduled stops</Link>
                </Button>
                <Button asChild variant="outline" size="sm">
                  <Link href="/dashboard/schedule">Weekly schedule</Link>
                </Button>
              </div>
            </CardContent>
          </Card>
        </main>
      </div>
    </div>
  )
}
