import { Metadata } from "next"
import Link from "next/link"
import { createClient } from "@/lib/supabase/server"
import { Header } from "@/components/header"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Calendar, Plus, ExternalLink } from "lucide-react"
import { approveEventById, rejectEventById } from "./actions"

export const metadata: Metadata = {
  title: "Events | Admin | FoodTruck CLT",
  description: "Review and manage event listings.",
}

type EventAdminRow = {
  id: string
  title: string
  date: string
  location_name: string | null
  address: string | null
  active: boolean | null
  listing_status: string | null
  created_at: string | null
  updated_at: string | null
  slug: string | null
  submitted_by_truck_id: string | null
}

function fmtDate(s: string | null | undefined): string {
  if (!s) return "—"
  const d = new Date(s)
  if (Number.isNaN(d.getTime())) return s
  return d.toLocaleString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  })
}

function dayOnly(dateStr: string | null | undefined): string {
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

function statusLabel(row: EventAdminRow): string {
  const ls = (row.listing_status ?? "").toLowerCase()
  if (ls) return ls
  if (row.active) return "approved"
  return "draft"
}

export default async function AdminEventsPage({ searchParams }: { searchParams: Promise<{ key?: string }> }) {
  const key = (await searchParams)?.key
  const adminKey = process.env.ADMIN_KEY ?? "7985"
  if (key !== adminKey) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-muted-foreground">Page not found.</p>
      </div>
    )
  }

  const hasServiceRole = Boolean(process.env.SUPABASE_SERVICE_ROLE_KEY)
  const supabase = await createClient()
  const { data: allEvents } = await supabase
    .from("events")
    .select(
      "id, title, date, location_name, address, active, listing_status, created_at, updated_at, slug, submitted_by_truck_id"
    )
    .order("date", { ascending: false })

  const rows = (allEvents ?? []) as EventAdminRow[]
  const pending = rows.filter((r) => {
    if (r.active) return false
    if (r.listing_status === "rejected" || r.listing_status === "draft") return false
    if (r.listing_status === "pending") return true
    if (r.submitted_by_truck_id) return r.listing_status == null
    return false
  })
  const keyQ = `?key=${encodeURIComponent(key)}`
  const newHref = `/admin/events/new${keyQ}`

  return (
    <div className="min-h-screen bg-muted/30">
      <Header />
      <main className="pt-24 pb-16">
        <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4 mb-8">
            <div>
              <h1 className="font-display text-2xl sm:text-3xl font-bold text-foreground">Events</h1>
              <p className="mt-1 text-muted-foreground">Manage public listings, drafts, and vendor submissions.</p>
            </div>
            <Button asChild className="w-fit">
              <Link href={newHref} className="flex items-center gap-2">
                <Plus className="h-4 w-4" />
                Quick Add Event
              </Link>
            </Button>
          </div>

          {!hasServiceRole ? (
            <p className="mb-6 rounded-md border border-amber-500/30 bg-amber-500/10 px-4 py-3 text-sm text-amber-900 dark:text-amber-100">
              <strong>Admin actions need the service key.</strong> Set{" "}
              <code className="text-xs">SUPABASE_SERVICE_ROLE_KEY</code> in the server environment for Quick Add,
              Approve, and Reject. Public read still works.
            </p>
          ) : null}

          {pending.length > 0 && (
            <div className="mb-10">
              <h2 className="text-lg font-semibold text-foreground mb-3">Pending vendor submissions</h2>
              <ul className="space-y-4">
                {pending.map((ev) => (
                    <li key={ev.id}>
                      <Card>
                        <CardHeader className="pb-2">
                          <div className="flex flex-wrap items-start justify-between gap-2">
                            <CardTitle className="text-lg">{ev.title}</CardTitle>
                            <Badge variant="secondary">Pending</Badge>
                          </div>
                          <div className="flex flex-wrap gap-x-4 gap-y-1 text-sm text-muted-foreground pt-1">
                            <span className="flex items-center gap-1">
                              <Calendar className="h-4 w-4 shrink-0" />
                              {dayOnly(ev.date)}
                            </span>
                            {ev.created_at ? <span>Submitted {fmtDate(ev.created_at)}</span> : null}
                          </div>
                        </CardHeader>
                        <CardContent className="space-y-3">
                          {ev.location_name ? <p className="text-sm text-muted-foreground">{ev.location_name}</p> : null}
                          <div className="flex flex-wrap gap-2 pt-2">
                            <form action={approveEventById}>
                              <input type="hidden" name="id" value={ev.id} />
                              <input type="hidden" name="adminKey" value={key} />
                              <Button type="submit" size="sm" disabled={!hasServiceRole}>
                                Approve
                              </Button>
                            </form>
                            <form action={rejectEventById}>
                              <input type="hidden" name="id" value={ev.id} />
                              <input type="hidden" name="adminKey" value={key} />
                              <Button type="submit" variant="outline" size="sm" disabled={!hasServiceRole}>
                                Reject
                              </Button>
                            </form>
                          </div>
                        </CardContent>
                      </Card>
                    </li>
                  ))}
              </ul>
            </div>
          )}

          <h2 className="text-lg font-semibold text-foreground mb-3">All events</h2>
          {rows.length === 0 ? (
            <Card>
              <CardContent className="py-12 text-center text-muted-foreground text-sm">No events yet.</CardContent>
            </Card>
          ) : (
            <div className="overflow-x-auto rounded-md border border-border">
              <table className="w-full text-sm text-left">
                <thead className="bg-muted/50 border-b border-border">
                  <tr>
                    <th className="p-3 font-medium">Name</th>
                    <th className="p-3 font-medium">Date</th>
                    <th className="p-3 font-medium">Venue</th>
                    <th className="p-3 font-medium">Status</th>
                    <th className="p-3 font-medium">Created</th>
                    <th className="p-3 font-medium">Updated</th>
                    <th className="p-3 font-medium">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {rows.map((ev) => {
                    const venue = [ev.location_name, ev.address].filter(Boolean).join(" · ") || "—"
                    const canView = Boolean(ev.active && ev.slug)
                    return (
                      <tr key={ev.id} className="border-b border-border/80 last:border-0">
                        <td className="p-3 align-top font-medium text-foreground max-w-[200px]">{ev.title}</td>
                        <td className="p-3 align-top text-muted-foreground whitespace-nowrap">{dayOnly(ev.date)}</td>
                        <td className="p-3 align-top text-muted-foreground max-w-[220px]">{venue}</td>
                        <td className="p-3 align-top">
                          <Badge variant="outline" className="font-normal">
                            {statusLabel(ev)}
                          </Badge>
                        </td>
                        <td className="p-3 align-top text-muted-foreground whitespace-nowrap">{fmtDate(ev.created_at)}</td>
                        <td className="p-3 align-top text-muted-foreground whitespace-nowrap">{fmtDate(ev.updated_at)}</td>
                        <td className="p-3 align-top">
                          {canView && ev.slug ? (
                            <Button variant="ghost" size="sm" asChild>
                              <Link href={`/events/${ev.slug}`} className="gap-1">
                                <ExternalLink className="h-3.5 w-3.5" />
                                View
                              </Link>
                            </Button>
                          ) : (
                            <span className="text-muted-foreground">—</span>
                          )}
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          )}

        </div>
      </main>
    </div>
  )
}
