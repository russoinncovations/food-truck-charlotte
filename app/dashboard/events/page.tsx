import { Metadata } from "next"
import Link from "next/link"
import { redirect } from "next/navigation"
import { revalidatePath } from "next/cache"
import { Header } from "@/components/header"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { createClient } from "@/lib/supabase/server"
import { buildGeocodableLineFromParts } from "@/lib/events/event-address"
import { geocodeEventAddressForStorage } from "@/lib/events/event-geocode"

export const metadata: Metadata = {
  title: "Events | FoodTruck CLT",
  description: "Submit events your truck is attending and track approval status.",
}

function slugFromTitle(title: string): string {
  const base = title
    .toLowerCase()
    .trim()
    .replace(/\s+/g, "-")
    .replace(/[^a-z0-9-]/g, "")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "")
  return base || `event-${Date.now()}`
}

async function submitEvent(formData: FormData) {
  "use server"
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user?.email) {
    redirect("/vendor-login")
  }

  const { data: truck } = await supabase.from("trucks").select("id").eq("email", user.email).single()
  if (!truck) {
    return
  }

  const title = ((formData.get("title") as string | null) ?? "").trim()
  const date = (formData.get("date") as string | null) ?? ""
  const location_name = ((formData.get("location_name") as string | null) ?? "").trim()
  const address = ((formData.get("address") as string | null) ?? "").trim()
  const description = ((formData.get("description") as string | null) ?? "").trim()
  const start_time = (formData.get("start_time") as string | null) ?? ""
  const end_time = (formData.get("end_time") as string | null) ?? ""

  if (!title || !date) {
    return
  }

  const slug = slugFromTitle(title)

  const geoLine = buildGeocodableLineFromParts({
    address: address || null,
    location_name: location_name || null,
    address_line1: null,
    city: null,
    state: null,
    zip: null,
  })
  const coords = geoLine ? await geocodeEventAddressForStorage(geoLine) : null
  if (geoLine && !coords) {
    console.warn("[dashboard/events] Geocode did not return coordinates for:", geoLine)
  }

  await supabase.from("events").insert({
    title,
    date,
    location_name: location_name || null,
    address: address || null,
    description: description || null,
    start_time: start_time || null,
    end_time: end_time || null,
    submitted_by_truck_id: truck.id,
    active: false,
    listing_status: "pending",
    slug,
    latitude: coords?.lat ?? null,
    longitude: coords?.lng ?? null,
  })

  revalidatePath("/dashboard/events")
  revalidatePath("/")
  revalidatePath("/map")
}

export default async function DashboardEventsPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    redirect("/vendor-login")
  }

  const { data: truck } = await supabase
    .from("trucks")
    .select("id, name")
    .eq("email", user.email)
    .single()

  const { data: myEvents } = truck
    ? await supabase
        .from("events")
        .select("id, title, date, location_name, active, slug")
        .eq("submitted_by_truck_id", truck.id)
        .order("date", { ascending: false })
    : { data: null }

  const events = myEvents ?? []

  return (
    <main className="min-h-screen bg-muted/30">
      <Header />

      <div className="pt-24 pb-16">
        <div className="mx-auto max-w-2xl px-4 sm:px-6 lg:px-8">
          <div className="mb-8">
            <Link
              href="/dashboard"
              className="text-sm text-muted-foreground hover:text-foreground transition-colors"
            >
              ← Back to dashboard
            </Link>
            <h1 className="font-display text-3xl font-bold text-foreground mt-4">Events</h1>
            <p className="text-muted-foreground mt-2">
              Submit events you&apos;ll be attending and track when they go live.
            </p>
          </div>

          {!truck ? (
            <Card>
              <CardHeader>
                <CardTitle>No truck found</CardTitle>
                <CardDescription>
                  We couldn&apos;t find a truck linked to your account.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Button asChild variant="outline">
                  <Link href="/dashboard">Return to dashboard</Link>
                </Button>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-8">
              <Card>
                <CardHeader>
                  <CardTitle>Submit an event</CardTitle>
                  <CardDescription>
                    Submitted events are reviewed before appearing on the public calendar.
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <form action={submitEvent} className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="title">Event name</Label>
                      <Input id="title" name="title" type="text" required placeholder="Event name" />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="date">Date</Label>
                      <Input id="date" name="date" type="date" required />
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="start_time">Start time</Label>
                        <Input id="start_time" name="start_time" type="time" />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="end_time">End time</Label>
                        <Input id="end_time" name="end_time" type="time" />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="location_name">Location name</Label>
                      <Input
                        id="location_name"
                        name="location_name"
                        type="text"
                        placeholder='e.g. "South End Brewery"'
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="address">Address</Label>
                      <Input id="address" name="address" type="text" placeholder="Street address" />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="description">Description</Label>
                      <Textarea id="description" name="description" rows={4} placeholder="Details about the event" />
                    </div>

                    <Button
                      type="submit"
                      className="bg-[#D94F1E] text-white hover:bg-[#b8441a]"
                    >
                      Submit event
                    </Button>
                  </form>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Your submitted events</CardTitle>
                </CardHeader>
                <CardContent>
                  {events.length === 0 ? (
                    <p className="text-sm text-muted-foreground">No events submitted yet</p>
                  ) : (
                    <ul className="space-y-3">
                      {events.map((ev: { id: string; title: string; date: string; active: boolean | null }) => {
                        const d = ev.date ? new Date(ev.date) : null
                        const dateStr =
                          d && !Number.isNaN(d.getTime())
                            ? d.toLocaleDateString("en-US", {
                                weekday: "short",
                                month: "short",
                                day: "numeric",
                                year: "numeric",
                              })
                            : ev.date
                        return (
                          <li
                            key={ev.id}
                            className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 rounded-lg border p-4"
                          >
                            <div>
                              <p className="font-medium text-foreground">{ev.title}</p>
                              <p className="text-sm text-muted-foreground">{dateStr}</p>
                            </div>
                            <Badge variant={ev.active ? "default" : "secondary"}>
                              {ev.active ? "Live" : "Pending"}
                            </Badge>
                          </li>
                        )
                      })}
                    </ul>
                  )}
                </CardContent>
              </Card>
            </div>
          )}
        </div>
      </div>
    </main>
  )
}
