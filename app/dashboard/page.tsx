import { Metadata } from "next"
import Link from "next/link"
import { redirect } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import {
  Calendar,
  MapPin,
  Clock,
  Truck,
  Plus,
  Eye,
  MessageSquare,
  TrendingUp,
  Settings,
  Edit,
  Bell,
  Menu,
} from "lucide-react"
import { createClient } from "@/lib/supabase/server"
import { EVENT_TYPES } from "@/lib/booking-types"
import { ServingLocationForm } from "@/components/dashboard/serving-location-form"
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

  if (truckData?.id) {
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
      {/* Dashboard Header */}
      <header className="sticky top-0 z-50 bg-background border-b">
        <div className="flex items-center justify-between h-16 px-4 md:px-6">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon" className="md:hidden">
              <Menu className="h-5 w-5" />
            </Button>
            <Link href="/" className="flex items-center gap-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary">
                <Truck className="h-4 w-4 text-primary-foreground" />
              </div>
              <span className="font-display font-bold hidden sm:block">FoodTruck CLT</span>
            </Link>
            <Badge variant="secondary" className="hidden md:flex">Vendor Dashboard</Badge>
          </div>

          <div className="flex items-center gap-2">
            <Link href="/dashboard">
              <Button variant="ghost" size="icon" className="relative">
                <Bell className="h-5 w-5" />
                {pendingCount > 0 && (
                  <span className="absolute top-1.5 right-1.5 h-2 w-2 bg-red-500 rounded-full" />
                )}
              </Button>
            </Link>
            <Button variant="ghost" size="icon" asChild>
              <Link href="/dashboard/settings">
                <Settings className="h-5 w-5" />
              </Link>
            </Button>
            <div className="h-8 w-8 rounded-full bg-primary flex items-center justify-center text-white text-sm font-bold">
              {truckData?.name?.[0] ?? "T"}
            </div>
          </div>
        </div>
      </header>

      <div className="flex">
        {/* Sidebar - Desktop */}
        <aside className="hidden md:flex flex-col w-64 bg-background border-r min-h-[calc(100vh-4rem)]">
          <nav className="flex-1 p-4 space-y-2">
            <NavItem href="/dashboard" icon={TrendingUp} active>Overview</NavItem>
            <NavItem href="/dashboard/schedule" icon={Calendar}>Schedule</NavItem>
            <NavItem href="/dashboard/profile" icon={Truck}>Truck Profile</NavItem>
            <NavItem href="/dashboard/events" icon={MapPin}>Events</NavItem>
            <NavItem href="#" className="opacity-50 cursor-not-allowed pointer-events-none" icon={Eye}>
              <span className="flex items-center gap-2">
                Analytics
                <Badge variant="secondary" className="text-[10px] px-1.5 py-0 font-normal shrink-0 bg-muted text-muted-foreground border-0">
                  Soon
                </Badge>
              </span>
            </NavItem>
            <NavItem href="#" className="opacity-50 cursor-not-allowed pointer-events-none" icon={MessageSquare}>
              <span className="flex items-center gap-2">
                Messages
                <Badge variant="secondary" className="text-[10px] px-1.5 py-0 font-normal shrink-0 bg-muted text-muted-foreground border-0">
                  Soon
                </Badge>
              </span>
            </NavItem>
            <NavItem href="/dashboard/settings" icon={Settings}>
              Settings
            </NavItem>
          </nav>
        </aside>

        {/* Main Content */}
        <main className="flex-1 p-4 md:p-6 space-y-6">
          {/* Welcome Section */}
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
              <Button className="gap-2">
                <Plus className="h-4 w-4" />
                Add Schedule
              </Button>
            </div>
          </div>

          {/* Main Content Grid */}
          <div className="grid lg:grid-cols-3 gap-6">
            {/* Left Column - Schedule & Profile */}
            <div className="lg:col-span-2 space-y-6">
              {/* Today's Status */}
              <Card>
                <CardHeader className="pb-4">
                  <div className="flex items-center justify-between">
                    <CardTitle className="flex items-center gap-2">
                      <Clock className="h-5 w-5 text-primary" />
                      Today&apos;s Status
                    </CardTitle>
                    <Button variant="outline" size="sm" className="gap-1">
                      <Edit className="h-3.5 w-3.5" />
                      Edit
                    </Button>
                  </div>
                </CardHeader>
                <CardContent>
                  {truckData?.id ? (
                    <ServingLocationForm
                      key={truckData.id}
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

            {/* Right Column - Events & Tips */}
            <div className="space-y-6">
              {/* Event Opportunities — one row per booking for this truck (real data from truck_opportunities) */}
              <Card>
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

function NavItem({
  href,
  icon: Icon,
  children,
  active = false,
  className,
}: {
  href: string
  icon: React.ElementType
  children: React.ReactNode
  active?: boolean
  className?: string
}) {
  return (
    <Link
      href={href}
      className={`flex items-center gap-3 px-3 py-2 rounded-lg transition-colors ${
        active
          ? "bg-primary/10 text-primary font-medium"
          : "text-muted-foreground hover:bg-muted hover:text-foreground"
      }${className ? ` ${className}` : ""}`}
    >
      <Icon className="h-5 w-5" />
      {children}
    </Link>
  )
}

