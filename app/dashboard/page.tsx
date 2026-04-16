import { Metadata } from "next"
import Link from "next/link"
import Image from "next/image"
import { revalidatePath } from "next/cache"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  Calendar,
  MapPin,
  Clock,
  Truck,
  Plus,
  Eye,
  Heart,
  Star,
  MessageSquare,
  TrendingUp,
  Users,
  DollarSign,
  Settings,
  Edit,
  ChevronRight,
  Bell,
  Menu,
} from "lucide-react"
import { foodTrucks } from "@/lib/data"
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

// Mock vendor data - in production this would come from auth/database
const vendorTruck = foodTrucks[0]

export default async function DashboardPage() {
  const supabase = await createClient()
  const { data: opportunities } = await supabase
    .from("truck_opportunities")
    .select("*, booking_requests(*)")
    .eq("status", "pending")
    .order("created_at", { ascending: false })
    .limit(5)

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
            <Button variant="ghost" size="icon" className="relative">
              <Bell className="h-5 w-5" />
              <span className="absolute top-1.5 right-1.5 h-2 w-2 bg-red-500 rounded-full" />
            </Button>
            <Button variant="ghost" size="icon" asChild>
              <Link href="/dashboard/settings">
                <Settings className="h-5 w-5" />
              </Link>
            </Button>
            <div className="h-8 w-8 rounded-full bg-primary/10 overflow-hidden">
              <Image
                src={vendorTruck.image}
                alt={vendorTruck.name}
                width={32}
                height={32}
                className="object-cover"
              />
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
            <NavItem href="/dashboard/analytics" icon={Eye}>Analytics</NavItem>
            <NavItem href="/dashboard/messages" icon={MessageSquare}>Messages</NavItem>
            <NavItem href="/dashboard/settings" icon={Settings}>Settings</NavItem>
          </nav>

          <div className="p-4 border-t">
            <Card className="bg-primary/5 border-primary/20">
              <CardContent className="p-4">
                <p className="text-sm font-medium mb-2">Go Premium</p>
                <p className="text-xs text-muted-foreground mb-3">
                  Get featured placement and advanced analytics
                </p>
                <Button size="sm" className="w-full">Upgrade</Button>
              </CardContent>
            </Card>
          </div>
        </aside>

        {/* Main Content */}
        <main className="flex-1 p-4 md:p-6 space-y-6">
          {/* Welcome Section */}
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
              <h1 className="font-display text-2xl md:text-3xl font-bold text-foreground">
                Welcome back, {vendorTruck.name}!
              </h1>
              <p className="text-muted-foreground">
                Here&apos;s what&apos;s happening with your truck today.
              </p>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" className="gap-2" asChild>
                <Link href={`/trucks/${vendorTruck.slug}`}>
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

          {/* Quick Stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <StatCard
              title="Profile Views"
              value="2,847"
              change="+12%"
              icon={Eye}
            />
            <StatCard
              title="Followers"
              value="1,234"
              change="+8%"
              icon={Heart}
            />
            <StatCard
              title="Avg Rating"
              value={vendorTruck.rating.toString()}
              change={`${vendorTruck.reviewCount} reviews`}
              icon={Star}
            />
            <StatCard
              title="Event Inquiries"
              value="12"
              change="3 pending"
              icon={MessageSquare}
            />
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
                  {vendorTruck.schedule[0] ? (
                    <div className="flex items-center justify-between p-4 rounded-lg bg-muted/50">
                      <div className="flex items-center gap-4">
                        <div className="h-12 w-12 rounded-full bg-green-500/10 flex items-center justify-center">
                          <MapPin className="h-6 w-6 text-green-600" />
                        </div>
                        <div>
                          <p className="font-medium text-foreground">
                            {vendorTruck.schedule[0].location}
                          </p>
                          <p className="text-sm text-muted-foreground">
                            {vendorTruck.schedule[0].startTime} - {vendorTruck.schedule[0].endTime}
                          </p>
                        </div>
                      </div>
                      <Badge className="bg-green-500 text-white border-0">
                        Currently Open
                      </Badge>
                    </div>
                  ) : (
                    <div className="text-center py-8">
                      <Calendar className="h-12 w-12 mx-auto text-muted-foreground/50 mb-4" />
                      <p className="text-muted-foreground mb-2">No schedule set for today</p>
                      <Button>Add Today&apos;s Location</Button>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Upcoming Schedule */}
              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle>Upcoming Schedule</CardTitle>
                    <Button variant="ghost" size="sm" asChild>
                      <Link href="/dashboard/schedule" className="gap-1">
                        Manage Schedule
                        <ChevronRight className="h-3.5 w-3.5" />
                      </Link>
                    </Button>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {vendorTruck.schedule.slice(0, 3).map((item) => {
                      const date = new Date(item.date)
                      return (
                        <div
                          key={item.id}
                          className="flex items-center gap-4 p-3 rounded-lg border"
                        >
                          <div className="text-center shrink-0 w-12">
                            <p className="text-xs text-muted-foreground uppercase">
                              {date.toLocaleDateString("en-US", { weekday: "short" })}
                            </p>
                            <p className="text-xl font-bold text-foreground">
                              {date.getDate()}
                            </p>
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="font-medium text-foreground truncate">
                              {item.location}
                            </p>
                            <p className="text-sm text-muted-foreground">
                              {item.startTime} - {item.endTime}
                            </p>
                          </div>
                          <Button variant="ghost" size="icon">
                            <Edit className="h-4 w-4" />
                          </Button>
                        </div>
                      )
                    })}
                  </div>
                </CardContent>
              </Card>

              {/* Quick Actions */}
              <div className="grid sm:grid-cols-3 gap-4">
                <QuickActionCard
                  title="Update Menu"
                  description="Keep your menu items current"
                  href="/dashboard/profile#menu"
                  icon={Edit}
                />
                <QuickActionCard
                  title="View Analytics"
                  description="See your performance metrics"
                  href="/dashboard/analytics"
                  icon={TrendingUp}
                />
                <QuickActionCard
                  title="Apply for Events"
                  description="Find upcoming opportunities"
                  href="/dashboard/events"
                  icon={Calendar}
                />
              </div>
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

              {/* Recent Reviews */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Star className="h-5 w-5 text-accent" />
                    Recent Reviews
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {[
                      { name: "Sarah M.", rating: 5, text: "Best tacos in Charlotte! The al pastor is incredible." },
                      { name: "Mike T.", rating: 5, text: "Great food, fast service. Will definitely be back!" },
                    ].map((review, i) => (
                      <div key={i} className="p-3 rounded-lg bg-muted/50">
                        <div className="flex items-center gap-2 mb-2">
                          <div className="flex">
                            {[...Array(review.rating)].map((_, j) => (
                              <Star key={j} className="h-3.5 w-3.5 fill-accent text-accent" />
                            ))}
                          </div>
                          <span className="text-sm font-medium">{review.name}</span>
                        </div>
                        <p className="text-sm text-muted-foreground">{review.text}</p>
                      </div>
                    ))}
                  </div>
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
}: {
  href: string
  icon: React.ElementType
  children: React.ReactNode
  active?: boolean
}) {
  return (
    <Link
      href={href}
      className={`flex items-center gap-3 px-3 py-2 rounded-lg transition-colors ${
        active
          ? "bg-primary/10 text-primary font-medium"
          : "text-muted-foreground hover:bg-muted hover:text-foreground"
      }`}
    >
      <Icon className="h-5 w-5" />
      {children}
    </Link>
  )
}

function StatCard({
  title,
  value,
  change,
  icon: Icon,
}: {
  title: string
  value: string
  change: string
  icon: React.ElementType
}) {
  return (
    <Card>
      <CardContent className="p-4">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm text-muted-foreground">{title}</span>
          <Icon className="h-4 w-4 text-muted-foreground" />
        </div>
        <p className="text-2xl font-bold text-foreground">{value}</p>
        <p className="text-xs text-muted-foreground">{change}</p>
      </CardContent>
    </Card>
  )
}

function QuickActionCard({
  title,
  description,
  href,
  icon: Icon,
}: {
  title: string
  description: string
  href: string
  icon: React.ElementType
}) {
  return (
    <Link href={href}>
      <Card className="h-full hover:border-primary/50 hover:shadow-md transition-all cursor-pointer">
        <CardContent className="p-4 flex flex-col items-center text-center">
          <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center mb-3">
            <Icon className="h-5 w-5 text-primary" />
          </div>
          <h3 className="font-medium text-foreground text-sm">{title}</h3>
          <p className="text-xs text-muted-foreground mt-1">{description}</p>
        </CardContent>
      </Card>
    </Link>
  )
}
