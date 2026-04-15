import { Metadata } from "next"
import { createClient } from "@/lib/supabase/server"
import { Header } from "@/components/header"
import { BookingsTable } from "@/components/admin/bookings-table"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Inbox, Clock, CheckCircle2, AlertCircle } from "lucide-react"
import type { BookingRequest } from "@/lib/booking-types"

export const metadata: Metadata = {
  title: "Booking Requests | Admin | Food Truck CLT",
  description: "Manage food truck booking requests",
}

async function getBookings(): Promise<BookingRequest[]> {
  const supabase = await createClient()
  
  const { data, error } = await supabase
    .from("booking_requests")
    .select("*")
    .order("created_at", { ascending: false })

  if (error) {
    console.error("[v0] Error fetching bookings:", error)
    return []
  }

  return data || []
}

function getStatusCounts(bookings: BookingRequest[]) {
  return {
    new: bookings.filter(b => b.status === "new").length,
    in_progress: bookings.filter(b => ["contacted", "in_progress", "quoted"].includes(b.status)).length,
    confirmed: bookings.filter(b => b.status === "confirmed").length,
    total: bookings.length,
  }
}

export default async function AdminBookingsPage() {
  const bookings = await getBookings()
  const counts = getStatusCounts(bookings)

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

          {/* Bookings Table */}
          <Card>
            <CardHeader className="pb-4">
              <CardTitle className="text-lg">All Requests</CardTitle>
            </CardHeader>
            <CardContent>
              {bookings.length > 0 ? (
                <BookingsTable bookings={bookings} />
              ) : (
                <div className="text-center py-12">
                  <Inbox className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-foreground mb-1">
                    No booking requests yet
                  </h3>
                  <p className="text-sm text-muted-foreground">
                    When someone submits a booking request, it will appear here.
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
