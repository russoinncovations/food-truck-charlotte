import { Metadata } from "next"
import Link from "next/link"
import { notFound } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import { Header } from "@/components/header"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { 
  ArrowLeft, 
  Calendar, 
  Clock, 
  MapPin, 
  Users, 
  Mail, 
  Phone, 
  Building2,
  DollarSign,
  Utensils,
  MessageSquare,
  ExternalLink,
} from "lucide-react"
import { cn } from "@/lib/utils"
import { EVENT_TYPES, BUDGET_RANGES, type BookingRequest, type BookingStatus } from "@/lib/booking-types"

export const metadata: Metadata = {
  title: "Booking Details | Admin | Food Truck CLT",
}

const STATUS_CONFIG: Record<BookingStatus, { label: string; color: string }> = {
  new: { label: "New", color: "bg-yellow-500" },
  contacted: { label: "Contacted", color: "bg-blue-500" },
  in_progress: { label: "In Progress", color: "bg-blue-500" },
  quoted: { label: "Quoted", color: "bg-purple-500" },
  confirmed: { label: "Confirmed", color: "bg-green-500" },
  completed: { label: "Completed", color: "bg-gray-500" },
  cancelled: { label: "Cancelled", color: "bg-red-500" },
}

async function getBooking(id: string): Promise<BookingRequest | null> {
  const supabase = await createClient()
  
  const { data, error } = await supabase
    .from("booking_requests")
    .select("*")
    .eq("id", id)
    .single()

  if (error) {
    console.error("[v0] Error fetching booking:", error)
    return null
  }

  return data
}

export default async function BookingDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const booking = await getBooking(id)

  if (!booking) {
    notFound()
  }

  const eventType = EVENT_TYPES.find((t) => t.value === booking.event_type)
  const budgetRange = BUDGET_RANGES.find((b) => b.value === booking.budget_range)
  const statusConfig = STATUS_CONFIG[booking.status]

  const formatDate = (dateString: string) => {
    const [year, month, day] = dateString.split("-").map(Number)
    const date = new Date(year, month - 1, day)
    return date.toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric", year: "numeric" })
  }

  const formatTime = (timeString: string | undefined) => {
    if (!timeString) return null
    const [hours, minutes] = timeString.split(":")
    const hour = parseInt(hours)
    const ampm = hour >= 12 ? "PM" : "AM"
    const hour12 = hour % 12 || 12
    return `${hour12}:${minutes} ${ampm}`
  }

  return (
    <div className="min-h-screen bg-muted/30">
      <Header />
      
      <main className="pt-24 pb-16">
        <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8">
          {/* Header */}
          <div className="mb-6">
            <Button variant="ghost" size="sm" asChild className="mb-4">
              <Link href="/admin/bookings">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to Bookings
              </Link>
            </Button>

            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div>
                <div className="flex items-center gap-3 mb-2">
                  <h1 className="font-display text-2xl font-bold text-foreground">
                    Booking Request
                  </h1>
                  <Badge className={cn("text-white", statusConfig.color)}>
                    {statusConfig.label}
                  </Badge>
                </div>
                <p className="text-sm text-muted-foreground">
                  ID: {booking.id.slice(0, 8).toUpperCase()} &middot; 
                  Submitted {new Date(booking.created_at).toLocaleDateString()}
                </p>
              </div>
              <div className="flex gap-2">
                <Button variant="outline" size="sm">
                  <Mail className="h-4 w-4 mr-2" />
                  Send Email
                </Button>
                <Button size="sm">
                  Update Status
                </Button>
              </div>
            </div>
          </div>

          <div className="grid gap-6 md:grid-cols-3">
            {/* Main Content */}
            <div className="md:col-span-2 space-y-6">
              {/* Event Details */}
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-lg flex items-center gap-2">
                    <Calendar className="h-5 w-5 text-primary" />
                    Event Details
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm text-muted-foreground">Event Type</p>
                      <p className="font-medium">{eventType?.label || booking.event_type}</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Date</p>
                      <p className="font-medium">{formatDate(booking.event_date)}</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Time</p>
                      <p className="font-medium">
                        {booking.event_start_time && booking.event_end_time
                          ? `${formatTime(booking.event_start_time)} - ${formatTime(booking.event_end_time)}`
                          : booking.event_start_time
                          ? `Starts at ${formatTime(booking.event_start_time)}`
                          : "Not specified"}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Expected Guests</p>
                      <p className="font-medium">{booking.expected_guests} people</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Location */}
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-lg flex items-center gap-2">
                    <MapPin className="h-5 w-5 text-primary" />
                    Location
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {booking.venue_name && (
                    <p className="font-medium mb-1">{booking.venue_name}</p>
                  )}
                  <p className="text-muted-foreground">{booking.venue_address}</p>
                  <p className="text-muted-foreground">
                    {booking.venue_city}, {booking.venue_state} {booking.venue_zip}
                  </p>
                  <Button variant="outline" size="sm" className="mt-3" asChild>
                    <a
                      href={`https://maps.google.com/?q=${encodeURIComponent(
                        `${booking.venue_address}, ${booking.venue_city}, ${booking.venue_state}`
                      )}`}
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      <ExternalLink className="h-4 w-4 mr-2" />
                      View on Map
                    </a>
                  </Button>
                </CardContent>
              </Card>

              {/* Preferences */}
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-lg flex items-center gap-2">
                    <Utensils className="h-5 w-5 text-primary" />
                    Preferences
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <p className="text-sm text-muted-foreground mb-2">Budget Range</p>
                    <Badge variant="secondary">{budgetRange?.label || "Not specified"}</Badge>
                  </div>

                  {booking.cuisine_preferences && booking.cuisine_preferences.length > 0 && (
                    <div>
                      <p className="text-sm text-muted-foreground mb-2">Cuisine Preferences</p>
                      <div className="flex flex-wrap gap-2">
                        {booking.cuisine_preferences.map((cuisine) => (
                          <Badge key={cuisine} variant="outline">{cuisine}</Badge>
                        ))}
                      </div>
                    </div>
                  )}

                  {booking.specific_trucks && booking.specific_trucks.length > 0 && (
                    <div>
                      <p className="text-sm text-muted-foreground mb-2">Requested Trucks</p>
                      <div className="flex flex-wrap gap-2">
                        {booking.specific_trucks.map((truck) => (
                          <Badge key={truck} variant="secondary">{truck}</Badge>
                        ))}
                      </div>
                    </div>
                  )}

                  {booking.dietary_requirements && booking.dietary_requirements.length > 0 && (
                    <div>
                      <p className="text-sm text-muted-foreground mb-2">Dietary Requirements</p>
                      <div className="flex flex-wrap gap-2">
                        {booking.dietary_requirements.map((req) => (
                          <Badge key={req} variant="destructive" className="bg-orange-500">{req}</Badge>
                        ))}
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Additional Notes */}
              {booking.additional_notes && (
                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-lg flex items-center gap-2">
                      <MessageSquare className="h-5 w-5 text-primary" />
                      Additional Notes
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-muted-foreground whitespace-pre-wrap">
                      {booking.additional_notes}
                    </p>
                  </CardContent>
                </Card>
              )}
            </div>

            {/* Sidebar */}
            <div className="space-y-6">
              {/* Contact Info */}
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-lg">Contact</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-start gap-3">
                    <div className="p-2 rounded-lg bg-muted">
                      <Users className="h-4 w-4" />
                    </div>
                    <div>
                      <p className="font-medium">{booking.contact_name}</p>
                      {booking.organization_name && (
                        <p className="text-sm text-muted-foreground">{booking.organization_name}</p>
                      )}
                    </div>
                  </div>

                  <Separator />

                  <div className="space-y-3">
                    <a
                      href={`mailto:${booking.contact_email}`}
                      className="flex items-center gap-3 text-sm hover:text-primary transition-colors"
                    >
                      <Mail className="h-4 w-4 text-muted-foreground" />
                      {booking.contact_email}
                    </a>
                    {booking.contact_phone && (
                      <a
                        href={`tel:${booking.contact_phone}`}
                        className="flex items-center gap-3 text-sm hover:text-primary transition-colors"
                      >
                        <Phone className="h-4 w-4 text-muted-foreground" />
                        {booking.contact_phone}
                      </a>
                    )}
                  </div>
                </CardContent>
              </Card>

              {/* Quick Actions */}
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-lg">Quick Actions</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  <Button className="w-full" variant="outline" size="sm">
                    Mark as Contacted
                  </Button>
                  <Button className="w-full" variant="outline" size="sm">
                    Send to Trucks
                  </Button>
                  <Button className="w-full" variant="outline" size="sm">
                    Add Note
                  </Button>
                  <Separator className="my-3" />
                  <Button className="w-full" variant="destructive" size="sm">
                    Cancel Request
                  </Button>
                </CardContent>
              </Card>

              {/* Source */}
              {booking.how_heard_about_us && (
                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm text-muted-foreground">How They Found Us</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm">{booking.how_heard_about_us}</p>
                  </CardContent>
                </Card>
              )}
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}
