import { Metadata } from "next"
import Link from "next/link"
import { revalidatePath } from "next/cache"
import { createAdminSupabaseClient } from "@/lib/supabase/admin"
import { createClient } from "@/lib/supabase/server"
import { Header } from "@/components/header"
import { BookingsTable } from "@/components/admin/bookings-table"
import { fetchBookingOpportunityMetricsByBookingId } from "@/lib/admin/fetch-booking-interested-counts"
import {
  fetchAllBookingRequestsForAdmin,
  fetchBookingAdminDiagnostics,
} from "@/lib/admin/fetch-booking-admin-diagnostics"
import { AdminBookingDiagnosticsPanel } from "@/components/admin/admin-booking-diagnostics-panel"
import {
  parseAdminBookingsDashboardFilter,
  ADMIN_BOOKINGS_DASHBOARD_FILTER_LABEL,
} from "@/lib/admin/booking-admin-filters"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Inbox, Clock, CheckCircle2, AlertCircle, Calendar, Plus, ExternalLink, Truck } from "lucide-react"
import type { BookingRequest } from "@/lib/booking-types"
import { normalizeBookingRowForAdmin } from "@/lib/admin/normalize-booking-row"
import { easternDateStringToday } from "@/lib/events/public-events"
import { sendVendorApprovalWelcomeEmail } from "@/lib/email/resend-vendor-welcome"
import { checkAdminPageAccess, verifyAdminKey } from "@/lib/admin/verify-admin-key"

export const metadata: Metadata = {
  title: "Booking Requests | Admin | Food Truck CLT",
  description: "Manage food truck booking requests",
}

/** Service-role client for admin writes/reads when available. */
async function adminBookingsDbClient() {
  return createAdminSupabaseClient()
}

/** Fallback to session client for auxiliary admin panels when service role is unset. */
async function adminAuxDbClient() {
  const admin = createAdminSupabaseClient()
  return admin ?? (await createClient())
}

async function getBookings(): Promise<{
  bookings: BookingRequest[]
  loadError: string | null
  usedServiceRole: boolean
}> {
  const loaded = await fetchAllBookingRequestsForAdmin()
  return {
    bookings: loaded.bookings.map((row) => normalizeBookingRowForAdmin(row)),
    loadError: loaded.loadError,
    usedServiceRole: loaded.usedServiceRole,
  }
}

function getStatusCounts(bookings: BookingRequest[]) {
  return {
    new: bookings.filter((b) => b.status === "new").length,
    in_progress: bookings.filter((b) => ["contacted", "in_progress", "quoted"].includes(b.status)).length,
    confirmed: bookings.filter((b) => b.status === "confirmed").length,
    total: bookings.length,
  }
}

type AdminEventRow = {
  id: string
  title: string
  slug: string | null
  date: string
  location_name: string | null
  address: string | null
  active: boolean | null
  listing_status: string | null
  created_at: string | null
  updated_at: string | null
}

async function getRecentEventsForAdmin(): Promise<AdminEventRow[]> {
  const supabase = await adminAuxDbClient()
  const { data, error } = await supabase
    .from("events")
    .select("id, title, slug, date, location_name, address, active, listing_status, created_at, updated_at")
    .order("date", { ascending: false })
    .limit(30)

  if (error) {
    console.error("[admin] events list:", error)
    return []
  }
  return (data ?? []) as AdminEventRow[]
}

function slugFromBusinessName(name: string | null | undefined): string {
  if (!name) return "truck"
  const s = name
    .toLowerCase()
    .trim()
    .replace(/\s+/g, "-")
    .replace(/[^a-z0-9-]/g, "")
    .replace(/-+/g, "-")
    .replace(/^-+|-+$/g, "")
  return s || "truck"
}

function truckName(app: Record<string, unknown>): string {
  const b = app.business_name ?? app.truck_name
  return typeof b === "string" ? b.trim() : ""
}

function ownerName(app: Record<string, unknown>): string {
  const n = app.contact_name ?? app.owner_name
  return typeof n === "string" ? n.trim() : ""
}

function cuisineDisplay(app: Record<string, unknown>): string {
  const types = app.cuisine_types as string[] | null | undefined
  if (types && types.length > 0) return types.join(", ")
  const ct = app.cuisine_type as string | null | undefined
  if (typeof ct === "string" && ct.trim()) return ct.trim()
  return "—"
}

function vendorDescription(app: Record<string, unknown>): string {
  const d = app.vendor_description ?? app.description
  return typeof d === "string" ? d : ""
}

async function approveVendorApplicationBooking(formData: FormData) {
  "use server"
  if (!verifyAdminKey(formData.get("adminKey") as string | null)) return

  const applicationId = formData.get("applicationId") as string | null
  if (!applicationId) return

  const businessName =
    ((formData.get("appBusinessName") as string | null) ?? "").trim() ||
    ((formData.get("appTruckName") as string | null) ?? "").trim()
  const email = ((formData.get("appEmail") as string | null) ?? "").trim()
  const phone = ((formData.get("appPhone") as string | null) ?? "").trim()
  const website = ((formData.get("appWebsite") as string | null) ?? "").trim()
  const instagram = ((formData.get("appInstagram") as string | null) ?? "").trim()
  const vendorDescriptionVal = ((formData.get("appDescription") as string | null) ?? "").trim()
  const cuisine = ((formData.get("appCuisine") as string | null) ?? "").trim() || "General"

  const adminDb = createAdminSupabaseClient()
  if (!adminDb) return

  let slug = slugFromBusinessName(businessName || undefined)

  const { data: existing } = await adminDb.from("trucks").select("id").eq("slug", slug).maybeSingle()
  if (existing) {
    slug = `${slug}-${applicationId.slice(0, 8)}`
  }

  const { error: insertError } = await adminDb.from("trucks").insert({
    name: businessName || "Unnamed",
    slug,
    email: email || null,
    phone: phone || null,
    website: website || null,
    instagram: instagram || null,
    description: vendorDescriptionVal || null,
    cuisine,
    show_in_directory: true,
    status: "active",
    is_active: true,
    source_application_id: applicationId,
  })

  if (insertError) return

  await adminDb.from("vendor_applications").update({ status: "approved" }).eq("id", applicationId)

  const truckDisplayName = businessName || "Unnamed"
  await sendVendorApprovalWelcomeEmail({
    to: email,
    truckName: truckDisplayName,
  })

  revalidatePath("/admin/bookings")
  revalidatePath("/admin")
  revalidatePath("/trucks")
}

async function rejectVendorApplicationBooking(formData: FormData) {
  "use server"
  if (!verifyAdminKey(formData.get("adminKey") as string | null)) return

  const applicationId = formData.get("applicationId") as string | null
  if (!applicationId) return

  const adminDb = createAdminSupabaseClient()
  if (!adminDb) return
  await adminDb.from("vendor_applications").update({ status: "rejected" }).eq("id", applicationId)

  revalidatePath("/admin/bookings")
  revalidatePath("/admin")
}

function formatVendorAppliedAt(createdAt: unknown): string {
  if (typeof createdAt !== "string") return "—"
  const d = new Date(createdAt)
  if (Number.isNaN(d.getTime())) return "—"
  return d.toLocaleDateString("en-US", { dateStyle: "medium" })
}

async function getPendingVendorApplications(): Promise<Record<string, unknown>[]> {
  const supabase = await adminAuxDbClient()
  const { data, error } = await supabase
    .from("vendor_applications")
    .select("*")
    .eq("status", "pending")
    .order("created_at", { ascending: false })

  if (error) {
    console.error("[admin/bookings] vendor applications:", error)
    return []
  }
  return (data ?? []) as Record<string, unknown>[]
}

export default async function AdminBookingsPage({
  searchParams,
}: {
  searchParams: Promise<{ key?: string; filter?: string }>
}) {
  const sp = await searchParams
  const key = sp?.key
  const access = checkAdminPageAccess(key)
  if (!access.allowed) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-muted-foreground">
          {access.reason === "not_configured" ? "Admin access is not configured." : "Page not found."}
        </p>
      </div>
    )
  }

  const bookingsLoad = await getBookings()
  const bookings = bookingsLoad.bookings
  const bookingDiagnostics = await fetchBookingAdminDiagnostics()
  const dashboardFilter = parseAdminBookingsDashboardFilter(sp?.filter)
  const opportunityMetricsByBookingId = Object.fromEntries(
    (await fetchBookingOpportunityMetricsByBookingId(bookings.map((b) => b.id))).entries()
  )
  const filterBanner = dashboardFilter ? ADMIN_BOOKINGS_DASHBOARD_FILTER_LABEL[dashboardFilter] : null
  const counts = getStatusCounts(bookings)
  const vendorApplications = await getPendingVendorApplications()
  const adminEvents = await getRecentEventsForAdmin()
  const todayStr = easternDateStringToday()
  const keyQ = `?key=${encodeURIComponent(key)}`
  const newEventHref = `/admin/events/new${keyQ}`
  const eventsAdminHref = `/admin/events${keyQ}`

  return (
    <div className="min-h-screen bg-muted/30">
      <Header />
      
      <main className="pt-24 pb-16">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          {/* Header */}
          <div className="mb-8">
            <h1 className="font-display text-2xl sm:text-3xl font-bold text-foreground">
              Booking Requests
            </h1>
            <p className="mt-1 text-muted-foreground">
              Manage and respond to food truck booking inquiries
            </p>
          </div>

          <Card className="mb-8 border-primary/20">
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Truck className="h-5 w-5 text-primary" />
                Vendor Applications
              </CardTitle>
              <CardDescription>
                Applications with status pending. Approve to add a truck to the directory; reject to decline.
              </CardDescription>
            </CardHeader>
            <CardContent>
              {vendorApplications.length === 0 ? (
                <p className="text-sm text-muted-foreground">No pending vendor applications.</p>
              ) : (
                <div className="overflow-x-auto rounded-md border border-border">
                  <table className="w-full text-sm text-left">
                    <thead className="bg-muted/50 border-b">
                      <tr>
                        <th className="p-3 font-medium whitespace-nowrap">Truck name</th>
                        <th className="p-3 font-medium whitespace-nowrap">Owner name</th>
                        <th className="p-3 font-medium whitespace-nowrap">Email</th>
                        <th className="p-3 font-medium">Cuisine type</th>
                        <th className="p-3 font-medium whitespace-nowrap">Date applied</th>
                        <th className="p-3 font-medium whitespace-nowrap text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {vendorApplications.map((app) => {
                        const id = String(app.id)
                        const nameStr = truckName(app)
                        const ownerStr = ownerName(app)
                        const email = typeof app.email === "string" ? app.email.trim() : ""
                        const cuisineOne =
                          (Array.isArray(app.cuisine_types) && app.cuisine_types.length > 0
                            ? app.cuisine_types[0]
                            : typeof app.cuisine_type === "string"
                              ? app.cuisine_type
                              : null) ?? "General"
                        const desc = vendorDescription(app)
                        const phone = typeof app.phone === "string" ? app.phone : ""
                        const website = typeof app.website === "string" ? app.website : ""
                        const instagram = typeof app.instagram === "string" ? app.instagram : ""

                        return (
                          <tr key={id} className="border-b border-border/60 last:border-0 align-top">
                            <td className="p-3 font-medium text-foreground max-w-[180px]">
                              {nameStr || "—"}
                            </td>
                            <td className="p-3 text-muted-foreground whitespace-nowrap">
                              {ownerStr || "—"}
                            </td>
                            <td className="p-3 text-muted-foreground max-w-[200px] break-all">{email || "—"}</td>
                            <td className="p-3 text-muted-foreground">{cuisineDisplay(app)}</td>
                            <td className="p-3 text-muted-foreground whitespace-nowrap">
                              {formatVendorAppliedAt(app.created_at)}
                            </td>
                            <td className="p-3">
                              <div className="flex flex-wrap justify-end gap-2">
                                <form action={approveVendorApplicationBooking}>
                                  <input type="hidden" name="adminKey" value={key ?? ""} />
                                  <input type="hidden" name="applicationId" value={id} />
                                  <input type="hidden" name="appBusinessName" value={nameStr} />
                                  <input type="hidden" name="appTruckName" value={nameStr} />
                                  <input type="hidden" name="appEmail" value={email} />
                                  <input type="hidden" name="appPhone" value={phone} />
                                  <input type="hidden" name="appWebsite" value={website} />
                                  <input type="hidden" name="appInstagram" value={instagram} />
                                  <input type="hidden" name="appDescription" value={desc} />
                                  <input type="hidden" name="appCuisine" value={cuisineOne} />
                                  <Button
                                    type="submit"
                                    size="sm"
                                    className="bg-green-600 text-white hover:bg-green-700"
                                  >
                                    Approve
                                  </Button>
                                </form>
                                <form action={rejectVendorApplicationBooking}>
                                  <input type="hidden" name="adminKey" value={key ?? ""} />
                                  <input type="hidden" name="applicationId" value={id} />
                                  <Button type="submit" size="sm" variant="destructive">
                                    Reject
                                  </Button>
                                </form>
                              </div>
                            </td>
                          </tr>
                        )
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </CardContent>
          </Card>

          <Card className="mb-8 border-primary/20">
            <CardHeader className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <CardTitle className="text-lg flex items-center gap-2">
                  <Calendar className="h-5 w-5 text-primary" />
                  Events
                </CardTitle>
                <CardDescription>
                  Add or review events for the public calendar. Past events stay in the database but are hidden
                  from the site. Quick Add defaults to <strong>approved</strong> (live when date is upcoming).
                </CardDescription>
              </div>
              <div className="flex flex-wrap gap-2">
                <Button asChild>
                  <Link href={newEventHref} className="flex items-center gap-2">
                    <Plus className="h-4 w-4" />
                    Quick Add Event
                  </Link>
                </Button>
                <Button variant="outline" asChild>
                  <Link href={eventsAdminHref} className="flex items-center gap-2">
                    Full events admin
                    <ExternalLink className="h-4 w-4" />
                  </Link>
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {adminEvents.length === 0 ? (
                <p className="text-sm text-muted-foreground">No events in the database yet.</p>
              ) : (
                <div className="overflow-x-auto rounded-md border border-border">
                  <table className="w-full text-sm text-left">
                    <thead className="bg-muted/50 border-b">
                      <tr>
                        <th className="p-2 font-medium">Name</th>
                        <th className="p-2 font-medium">Date</th>
                        <th className="p-2 font-medium">Venue</th>
                        <th className="p-2 font-medium">Status</th>
                        <th className="p-2 font-medium">When</th>
                        <th className="p-2 font-medium" />
                      </tr>
                    </thead>
                    <tbody>
                      {adminEvents.map((ev) => {
                        const venue = [ev.location_name, ev.address].filter(Boolean).join(" · ") || "—"
                        const ls = (ev.listing_status ?? "").toLowerCase()
                        const statusLabel = ls || (ev.active ? "approved" : "inactive")
                        const isPast = ev.date < todayStr
                        return (
                          <tr key={ev.id} className="border-b border-border/60 last:border-0">
                            <td className="p-2 font-medium text-foreground max-w-[200px]">{ev.title}</td>
                            <td className="p-2 text-muted-foreground whitespace-nowrap">{ev.date}</td>
                            <td className="p-2 text-muted-foreground max-w-[200px]">{venue}</td>
                            <td className="p-2">
                              <Badge variant="outline" className="font-normal text-xs">
                                {statusLabel}
                              </Badge>
                            </td>
                            <td className="p-2">
                              <span className={isPast ? "text-muted-foreground" : "text-foreground font-medium"}>
                                {isPast ? "Past" : "Upcoming"}
                              </span>
                            </td>
                            <td className="p-2 text-right">
                              {ev.active && ev.slug ? (
                                <Button variant="ghost" size="sm" asChild>
                                  <Link href={`/events/${ev.slug}`} className="gap-1">
                                    View
                                    <ExternalLink className="h-3.5 w-3.5" />
                                  </Link>
                                </Button>
                              ) : (
                                "—"
                              )}
                            </td>
                          </tr>
                        )
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
            <Card>
              <CardContent className="p-4 flex items-center gap-4">
                <div className="p-2 rounded-lg bg-yellow-500/10">
                  <Inbox className="h-5 w-5 text-yellow-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-foreground">{counts.new}</p>
                  <p className="text-xs text-muted-foreground">New Requests</p>
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardContent className="p-4 flex items-center gap-4">
                <div className="p-2 rounded-lg bg-blue-500/10">
                  <Clock className="h-5 w-5 text-blue-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-foreground">{counts.in_progress}</p>
                  <p className="text-xs text-muted-foreground">In Progress</p>
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardContent className="p-4 flex items-center gap-4">
                <div className="p-2 rounded-lg bg-green-500/10">
                  <CheckCircle2 className="h-5 w-5 text-green-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-foreground">{counts.confirmed}</p>
                  <p className="text-xs text-muted-foreground">Confirmed</p>
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardContent className="p-4 flex items-center gap-4">
                <div className="p-2 rounded-lg bg-muted">
                  <AlertCircle className="h-5 w-5 text-muted-foreground" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-foreground">{counts.total}</p>
                  <p className="text-xs text-muted-foreground">Total Requests</p>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Diagnostics + internal test */}
          <Card className="mb-8 border-amber-500/20">
            <CardHeader className="pb-3">
              <CardTitle className="text-lg">Pipeline diagnostics</CardTitle>
              <CardDescription>
                Verify submissions are persisting and routing — independent of dashboard filters below.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <AdminBookingDiagnosticsPanel
                adminKey={key}
                keyQ={keyQ}
                diagnostics={bookingDiagnostics}
              />
            </CardContent>
          </Card>

          {bookingsLoad.loadError ? (
            <div className="mb-6 rounded-lg border border-destructive/40 bg-destructive/10 px-4 py-3 text-sm text-destructive">
              {bookingsLoad.loadError}
            </div>
          ) : null}

          {!bookingsLoad.usedServiceRole ? (
            <div className="mb-6 rounded-lg border border-amber-500/40 bg-amber-500/10 px-4 py-3 text-sm text-amber-900 dark:text-amber-100">
              Admin booking list requires <code className="text-xs">SUPABASE_SERVICE_ROLE_KEY</code> on
              the server. Without it, the dashboard appears empty even when requests exist in the
              database.
            </div>
          ) : null}

          {/* Bookings Table */}
          <Card>
            <CardHeader className="pb-4">
              <CardTitle className="text-lg">
                {filterBanner ? "Filtered requests" : "All requests"}
              </CardTitle>
              {filterBanner ? (
                <CardDescription className="text-sm text-foreground font-medium">
                  Showing: {filterBanner.title}
                </CardDescription>
              ) : null}
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex flex-wrap gap-2 text-xs">
                {(
                  [
                    "no-notification-sent",
                    "delivered-no-response",
                    "bounced-failed",
                    "missing-vendor-email",
                    "dashboard-only",
                  ] as const
                ).map((filterKey) => (
                  <Button
                    key={filterKey}
                    variant={dashboardFilter === filterKey ? "default" : "outline"}
                    size="sm"
                    asChild
                  >
                    <Link href={`/admin/bookings${keyQ}&filter=${filterKey}`}>
                      {ADMIN_BOOKINGS_DASHBOARD_FILTER_LABEL[filterKey].title}
                    </Link>
                  </Button>
                ))}
              </div>
              {filterBanner ? (
                <div className="flex flex-wrap items-center gap-3 rounded-lg border border-border bg-muted/40 px-4 py-3 text-sm">
                  <span className="text-muted-foreground">
                    Dashboard filter active — only matching rows are listed. Clear to see every request.
                  </span>
                  <Button variant="outline" size="sm" asChild>
                    <Link href={`/admin/bookings${keyQ}`}>Show all requests</Link>
                  </Button>
                </div>
              ) : null}
              {bookings.length > 0 ? (
                <BookingsTable
                  bookings={bookings}
                  adminKey={key}
                  opportunityMetricsByBookingId={opportunityMetricsByBookingId}
                  dashboardFilter={dashboardFilter}
                />
              ) : (
                <div className="text-center py-12">
                  <Inbox className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-foreground mb-1">
                    {bookingsLoad.loadError
                      ? "Could not load booking requests"
                      : dashboardFilter
                        ? "No requests match this filter"
                        : bookingDiagnostics.tableRowCount && bookingDiagnostics.tableRowCount > 0
                          ? "No requests in filtered view"
                          : "No booking requests yet"}
                  </h3>
                  <p className="text-sm text-muted-foreground">
                    {bookingsLoad.loadError
                      ? "Fix the server configuration above, then refresh."
                      : dashboardFilter
                        ? "Clear the dashboard filter or check the diagnostics panel for recent rows."
                        : bookingDiagnostics.tableRowCount && bookingDiagnostics.tableRowCount > 0
                          ? "The diagnostics panel shows rows in the database — check active filters."
                          : "When someone submits a booking request, it will appear here."}
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  )
}
