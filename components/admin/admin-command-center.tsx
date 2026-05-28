import Link from "next/link"
import {
  AlertTriangle,
  ArrowRight,
  CalendarDays,
  Camera,
  ClipboardList,
  CheckCircle2,
  Clock,
  ImageOff,
  Inbox,
  LayoutDashboard,
  MapPin,
  Users,
} from "lucide-react"
import type { AdminCommandCenterData } from "@/lib/admin/command-center-data"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"

type Props = {
  keyQ: string
  data: AdminCommandCenterData
}

function fmtTime(iso: string): string {
  if (!iso) return "—"
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return iso
  return d.toLocaleString("en-US", {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  })
}

export function AdminCommandCenter({ keyQ, data }: Props) {
  const { needsAction, bookingSummary, vendorSummary, eventSummary, recentActivity, usedServiceRole } = data

  const na = [
    {
      title: "Vendor applications",
      count: needsAction.pendingVendorApps,
      desc: "Awaiting approve / reject",
      href: `/admin/vendors${keyQ}`,
      icon: Users,
    },
    {
      title: "Event submissions",
      count: needsAction.pendingEventSubmissions,
      desc: "Pending vendor or listing review",
      href: `/admin/events${keyQ}`,
      icon: CalendarDays,
    },
    {
      title: "Open booking requests",
      count: bookingSummary.openPipeline,
      desc: "Customer requests still in the booking pipeline",
      href: `/admin/bookings${keyQ}&filter=open`,
      icon: Inbox,
    },
    {
      title: "Requests with no vendor responses",
      count: needsAction.bookingsNoVendorResponse,
      desc: "No vendors have marked interested or not available yet",
      href: `/admin/bookings${keyQ}&filter=no-vendor-response`,
      icon: ClipboardList,
    },
    {
      title: "Requests with vendor interest",
      count: bookingSummary.withVendorResponse,
      desc: "At least one vendor has responded",
      href: `/admin/bookings${keyQ}&filter=vendor-interest`,
      icon: CheckCircle2,
    },
    {
      title: "Needs admin follow-up",
      count: bookingSummary.needsFollowUp,
      desc: "Requests that may need a customer or vendor follow-up",
      href: `/admin/bookings${keyQ}&filter=needs-follow-up`,
      icon: Clock,
    },
    {
      title: "Trucks missing photos",
      count: needsAction.trucksMissingPhotos,
      desc: "Live listings without custom hero image",
      href: `/admin/vendors${keyQ}`,
      icon: Camera,
    },
    {
      title: "Events missing images",
      count: needsAction.eventsMissingImages,
      desc: "No uploaded image on record",
      href: `/admin/events${keyQ}`,
      icon: ImageOff,
    },
  ]

  return (
    <div className="space-y-10 mb-12">
      <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4">
        <div>
          <h1 className="font-display text-2xl sm:text-3xl font-bold text-foreground flex items-center gap-2">
            <LayoutDashboard className="h-8 w-8 text-primary shrink-0" />
            Command Center
          </h1>
          <p className="mt-1 text-sm text-muted-foreground max-w-2xl">
            What needs attention, recent movement, and shortcuts — open a section below or jump to a full admin page.
          </p>
        </div>
      </div>

      {!usedServiceRole ? (
        <div className="rounded-lg border border-amber-500/35 bg-amber-500/10 px-4 py-3 text-sm text-amber-950 dark:text-amber-100 flex gap-2 items-start">
          <AlertTriangle className="h-4 w-4 shrink-0 mt-0.5" />
          <p>
            Set <code className="text-xs">SUPABASE_SERVICE_ROLE_KEY</code> for full accuracy (bookings, opportunities,
            and some counts may be incomplete without it).
          </p>
        </div>
      ) : null}

      <section>
        <h2 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground mb-3">Quick links</h2>
        <div className="flex flex-wrap gap-2">
          <Button variant="default" size="sm" asChild>
            <Link href={`/admin/bookings${keyQ}`}>Manage bookings</Link>
          </Button>
          <Button variant="outline" size="sm" asChild>
            <Link href={`/admin/vendors${keyQ}`}>Manage vendors</Link>
          </Button>
          <Button variant="outline" size="sm" asChild>
            <Link href={`/admin/events${keyQ}`}>Manage events</Link>
          </Button>
          <Button variant="outline" size="sm" asChild>
            <Link href={`/admin/vendor-status-audit${keyQ}`}>Vendor visibility audit</Link>
          </Button>
          <Button variant="outline" size="sm" asChild>
            <Link href="/trucks">View public trucks</Link>
          </Button>
          <Button variant="outline" size="sm" asChild>
            <Link href="/events">View public events</Link>
          </Button>
          <Button variant="outline" size="sm" asChild>
            <Link href="/map">
              <MapPin className="h-4 w-4 mr-1.5" />
              View map
            </Link>
          </Button>
        </div>
      </section>

      <section>
        <h2 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground mb-3">Needs action</h2>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {na.map((item) => (
            <Card key={item.title} className="border-border hover:border-primary/25 transition-colors">
              <CardHeader className="pb-2">
                <div className="flex items-start justify-between gap-2">
                  <item.icon className="h-5 w-5 text-primary shrink-0" />
                  <span className="text-2xl font-bold tabular-nums text-foreground">{item.count}</span>
                </div>
                <CardTitle className="text-base">{item.title}</CardTitle>
                <CardDescription className="text-xs">{item.desc}</CardDescription>
              </CardHeader>
              <CardContent className="pt-0">
                <Button variant="ghost" size="sm" className="px-0 h-auto text-primary" asChild>
                  <Link href={item.href} className="inline-flex items-center gap-1">
                    Open <ArrowRight className="h-3.5 w-3.5" />
                  </Link>
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>

      <section className="grid gap-6 lg:grid-cols-3">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Booking summary</CardTitle>
          </CardHeader>
          <CardContent className="text-sm space-y-2">
            <div className="flex justify-between gap-2">
              <span className="text-muted-foreground">Total requests</span>
              <span className="font-medium tabular-nums">{bookingSummary.total}</span>
            </div>
            <div className="flex justify-between gap-2">
              <span className="text-muted-foreground">Open booking requests</span>
              <span className="font-medium tabular-nums">{bookingSummary.openPipeline}</span>
            </div>
            <div className="flex justify-between gap-2">
              <span className="text-muted-foreground">Requests with vendor interest</span>
              <span className="font-medium tabular-nums">{bookingSummary.withVendorResponse}</span>
            </div>
            <div className="flex justify-between gap-2">
              <span className="text-muted-foreground">Needs admin follow-up</span>
              <span className="font-medium tabular-nums">{bookingSummary.needsFollowUp}</span>
            </div>
            <Button variant="outline" size="sm" className="w-full mt-2" asChild>
              <Link href={`/admin/bookings${keyQ}`}>All bookings</Link>
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Vendor &amp; trucks</CardTitle>
          </CardHeader>
          <CardContent className="text-sm space-y-2">
            <div className="flex justify-between gap-2">
              <span className="text-muted-foreground">Active public trucks</span>
              <span className="font-medium tabular-nums">{vendorSummary.activePublicTrucks}</span>
            </div>
            <div className="flex justify-between gap-2">
              <span className="text-muted-foreground">Pending applications</span>
              <span className="font-medium tabular-nums">{vendorSummary.pendingApplications}</span>
            </div>
            <div className="flex justify-between gap-2">
              <span className="text-muted-foreground">Missing photos (scan)</span>
              <span className="font-medium tabular-nums">{vendorSummary.trucksMissingPhotos}</span>
            </div>
            <div className="flex justify-between gap-2">
              <span className="text-muted-foreground">Hidden / not public-active</span>
              <span className="font-medium tabular-nums">{vendorSummary.hiddenOrInactive}</span>
            </div>
            <Button variant="outline" size="sm" className="w-full mt-2" asChild>
              <Link href={`/admin/vendors${keyQ}`}>Vendors &amp; photos</Link>
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Event summary</CardTitle>
          </CardHeader>
          <CardContent className="text-sm space-y-2">
            <div className="flex justify-between gap-2">
              <span className="text-muted-foreground">Upcoming public</span>
              <span className="font-medium tabular-nums">{eventSummary.upcomingPublic}</span>
            </div>
            <div className="flex justify-between gap-2">
              <span className="text-muted-foreground">Pending submissions</span>
              <span className="font-medium tabular-nums">{eventSummary.pendingSubmissions}</span>
            </div>
            <div className="flex justify-between gap-2">
              <span className="text-muted-foreground">Active, missing image</span>
              <span className="font-medium tabular-nums">{eventSummary.activeMissingImages}</span>
            </div>
            <Button variant="outline" size="sm" className="w-full mt-2" asChild>
              <Link href={`/admin/events${keyQ}`}>All events</Link>
            </Button>
          </CardContent>
        </Card>
      </section>

      <section>
        <h2 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground mb-3">Recent activity</h2>
        <Card>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="bg-muted/50">
                    <TableHead className="w-[110px]">Type</TableHead>
                    <TableHead>Item</TableHead>
                    <TableHead className="w-[100px]">Status</TableHead>
                    <TableHead className="w-[140px] whitespace-nowrap">When</TableHead>
                    <TableHead className="w-[90px]" />
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {recentActivity.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={5} className="text-center text-muted-foreground py-10 text-sm">
                        No recent items yet.
                      </TableCell>
                    </TableRow>
                  ) : (
                    recentActivity.map((row) => (
                      <TableRow key={`${row.kind}-${row.id}`}>
                        <TableCell className="text-xs font-medium text-muted-foreground whitespace-nowrap">
                          {row.label}
                        </TableCell>
                        <TableCell className="font-medium text-foreground max-w-[220px] truncate">{row.title}</TableCell>
                        <TableCell className="text-xs">
                          {row.status ? (
                            <Badge variant="secondary" className="font-normal capitalize truncate max-w-[96px]">
                              {row.status}
                            </Badge>
                          ) : (
                            <span className="text-muted-foreground">—</span>
                          )}
                        </TableCell>
                        <TableCell className="text-xs text-muted-foreground whitespace-nowrap tabular-nums">
                          {fmtTime(row.at)}
                        </TableCell>
                        <TableCell>
                          <Button variant="ghost" size="sm" className="h-8 px-2" asChild>
                            <Link href={row.href}>Open</Link>
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      </section>
    </div>
  )
}
