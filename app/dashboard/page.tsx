import { Metadata } from "next"
import Link from "next/link"
import { redirect } from "next/navigation"
import { revalidatePath } from "next/cache"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
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

export const metadata: Metadata = {
  title: "Vendor Dashboard | FoodTruck CLT",
  description: "Manage your food truck profile, schedule, and connect with the Charlotte community.",
}

async function updateTruckOpportunityStatus(formData: FormData) {
  "use server"
  const opportunityId = formData.get("opportunityId") as string | null
  const status = formData.get("status") as string | null
  if (!opportunityId || (status !== "interested" && status !== "pass")) return

  const supabase = await createClient()
  await supabase.from("truck_opportunities").update({ status }).eq("id", opportunityId)
  revalidatePath("/dashboard")
}

async function updateServingStatus(formData: FormData) {
  "use server"
  const truckId = formData.get("truckId") as string | null
  const servingToday = formData.get("servingToday") === "true"
  const todayLocation = (formData.get("todayLocation") as string | null) ?? ""
  if (!truckId) return

  // Geocode the location if serving
  let latitude: number | null = null
  let longitude: number | null = null
  if (servingToday && todayLocation) {
    try {
      const geo = await fetch(
        `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(todayLocation + ", Charlotte, NC")}&format=json&limit=1`,
        { headers: { "User-Agent": "foodtruckclt.com" } }
      )
      const geoData = await geo.json()
      if (geoData[0]) {
        latitude = parseFloat(geoData[0].lat)
        longitude = parseFloat(geoData[0].lon)
      }
    } catch {}
  }

  const supabase = await createClient()
  await supabase
    .from("trucks")
    .update({ serving_today: servingToday, today_location: todayLocation, latitude, longitude })
    .eq("id", truckId)
  revalidatePath("/dashboard")
  revalidatePath("/map")
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
  const { data: opportunities } = await supabase
    .from("truck_opportunities")
    .select("*, booking_requests(*)")
    .eq("status", "pending")
    .order("created_at", { ascending: false })
    .limit(5)

  const pendingCount = opportunities?.filter(o => o.status === "pending").length ?? 0

  const { data: truckData } = await supabase
    .from("trucks")
    .select("id, name, serving_today, today_location")
    .eq("email", user.email)
    .single()

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
                    <div className="space-y-4">
                      <div className="flex items-center justify-between gap-4 rounded-lg border p-4">
                        <div className="flex items-center gap-3">
                          <div className="h-12 w-12 rounded-full bg-muted flex items-center justify-center">
                            <MapPin className="h-6 w-6 text-muted-foreground" />
                          </div>
                          <div>
                            <p className="text-sm font-medium text-foreground">Serving status</p>
                            <p className="text-xs text-muted-foreground">
                              {truckData.serving_today
                                ? "You appear on the map as open today."
                                : "You are not marked as serving today."}
                            </p>
                          </div>
                        </div>
                        <Badge
                          className={
                            truckData.serving_today
                              ? "bg-green-500 text-white border-0"
                              : "border-muted-foreground/30"
                          }
                          variant={truckData.serving_today ? "default" : "secondary"}
                        >
                          {truckData.serving_today ? "Serving today" : "Not serving"}
                        </Badge>
                      </div>
                      <div className="flex flex-col gap-3 sm:flex-row">
                        <form
                          action={updateServingStatus}
                          className="flex flex-1 flex-col gap-3 rounded-lg border p-4"
                        >
                          <input type="hidden" name="truckId" value={truckData.id} />
                          <input type="hidden" name="servingToday" value="true" />
                          <div className="space-y-2">
                            <label
                              htmlFor="todayLocation-start"
                              className="text-sm font-medium text-foreground"
                            >
                              Current Location
                            </label>
                            <Input
                              id="todayLocation-start"
                              name="todayLocation"
                              type="text"
                              placeholder="e.g. South End Brewery"
                              defaultValue={truckData.today_location ?? ""}
                            />
                          </div>
                          <Button type="submit" className="w-full sm:w-auto">
                            Start Serving
                          </Button>
                        </form>
                        <form
                          action={updateServingStatus}
                          className="flex flex-1 flex-col gap-3 rounded-lg border p-4"
                        >
                          <input type="hidden" name="truckId" value={truckData.id} />
                          <input type="hidden" name="servingToday" value="false" />
                          <div className="space-y-2">
                            <label
                              htmlFor="todayLocation-stop"
                              className="text-sm font-medium text-foreground"
                            >
                              Current Location
                            </label>
                            <Input
                              id="todayLocation-stop"
                              name="todayLocation"
                              type="text"
                              placeholder="e.g. South End Brewery"
                              defaultValue={truckData.today_location ?? ""}
                            />
                          </div>
                          <Button type="submit" variant="outline" className="w-full sm:w-auto">
                            Stop Serving
                          </Button>
                        </form>
                      </div>
                    </div>
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
              {/* Event Opportunities */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Calendar className="h-5 w-5 text-primary" />
                    Event Opportunities
                  </CardTitle>
                  <CardDescription>
                    Events looking for food trucks in your area
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {(opportunities ?? []).map((opp) => {
                      const raw = opp.booking_requests
                      const br = Array.isArray(raw) ? raw[0] : raw
                      const eventTypeLabel =
                        EVENT_TYPES.find((t) => t.value === br?.event_type)?.label ??
                        br?.event_type ??
                        "—"
                      const dateStr = br?.event_date
                        ? new Date(br.event_date).toLocaleDateString("en-US", {
                            month: "short",
                            day: "numeric",
                            year: "numeric",
                          })
                        : "—"
                      return (
                        <div
                          key={opp.id}
                          className="p-3 rounded-lg border hover:bg-muted/50 transition-colors space-y-3"
                        >
                          <div className="flex items-start gap-3">
                            <div className="h-12 w-12 rounded-lg bg-muted flex items-center justify-center shrink-0">
                              <Calendar className="h-6 w-6 text-muted-foreground" />
                            </div>
                            <div className="flex-1 min-w-0 space-y-1">
                              <p className="font-medium text-foreground text-sm truncate">
                                {eventTypeLabel}
                              </p>
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
                          {opp.status === "pending" && (
                            <div className="flex gap-2 pt-1">
                              <form action={updateTruckOpportunityStatus} className="flex-1">
                                <input type="hidden" name="opportunityId" value={opp.id} />
                                <input type="hidden" name="status" value="interested" />
                                <Button type="submit" size="sm" className="w-full">
                                  Interested
                                </Button>
                              </form>
                              <form action={updateTruckOpportunityStatus} className="flex-1">
                                <input type="hidden" name="opportunityId" value={opp.id} />
                                <input type="hidden" name="status" value="pass" />
                                <Button type="submit" variant="outline" size="sm" className="w-full">
                                  Pass
                                </Button>
                              </form>
                            </div>
                          )}
                        </div>
                      )
                    })}
                  </div>
                  <Button variant="outline" className="w-full mt-4" asChild>
                    <Link href="/dashboard/events">View All Events</Link>
                  </Button>
                </CardContent>
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

