import { Metadata } from "next"
import Link from "next/link"
import { redirect } from "next/navigation"
import { revalidatePath } from "next/cache"
import { Header } from "@/components/header"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { createClient } from "@/lib/supabase/server"
import { isValidTruckMapCoordinates } from "@/lib/location/truck-map-coords"
import { formatStopDate, formatStopTime, type TruckScheduledStopRow } from "@/lib/schedule/scheduled-stops"

export const metadata: Metadata = {
  title: "Scheduled Stops | FoodTruck CLT",
  description: "Plan date-based stops that appear on the public map automatically.",
}

async function geocodeAddress(address: string): Promise<{ lat: number | null; lng: number | null }> {
  if (!address.trim()) return { lat: null, lng: null }
  try {
    const geoRes = await fetch(
      `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(address)}&format=json&limit=1`,
      { headers: { "User-Agent": "foodtruckclt.com" }, signal: AbortSignal.timeout(4000) }
    )
    const geoData = (await geoRes.json()) as { lat?: string; lon?: string }[]
    const lat = geoData[0]?.lat ? parseFloat(geoData[0].lat) : null
    const lng = geoData[0]?.lon ? parseFloat(geoData[0].lon) : null
    if (lat != null && lng != null && isValidTruckMapCoordinates(lat, lng)) {
      return { lat, lng }
    }
    return { lat: null, lng: null }
  } catch {
    return { lat: null, lng: null }
  }
}

async function addScheduledStop(formData: FormData) {
  "use server"
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user?.email) redirect("/vendor-login")

  const truckId = formData.get("truckId") as string | null
  if (!truckId) return

  const { data: owned } = await supabase
    .from("trucks")
    .select("id")
    .eq("id", truckId)
    .eq("email", user.email)
    .single()
  if (!owned) return

  const stop_date = ((formData.get("stop_date") as string | null) ?? "").trim()
  const start_time = (formData.get("start_time") as string | null) ?? ""
  const end_time = (formData.get("end_time") as string | null) ?? ""
  const location_name = ((formData.get("location_name") as string | null) ?? "").trim()
  const address = ((formData.get("address") as string | null) ?? "").trim()
  const is_public = formData.get("is_public") === "on"
  const notes = ((formData.get("notes") as string | null) ?? "").trim() || null
  const menu_note = ((formData.get("menu_note") as string | null) ?? "").trim() || null

  if (!stop_date || !location_name || !start_time || !end_time) return

  const { lat, lng } = await geocodeAddress(address)

  await supabase.from("truck_scheduled_stops").insert({
    truck_id: truckId,
    stop_date,
    start_time,
    end_time,
    location_name,
    address: address || null,
    latitude: lat,
    longitude: lng,
    is_public,
    notes,
    menu_note,
    status: "scheduled",
  })

  revalidatePath("/dashboard/scheduled-stops")
  revalidatePath("/map")
}

async function cancelScheduledStop(formData: FormData) {
  "use server"
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user?.email) redirect("/vendor-login")

  const id = formData.get("id") as string | null
  if (!id) return

  const { data: row } = await supabase.from("truck_scheduled_stops").select("truck_id").eq("id", id).single()
  if (!row?.truck_id) return

  const { data: owned } = await supabase
    .from("trucks")
    .select("id")
    .eq("id", row.truck_id)
    .eq("email", user.email)
    .single()
  if (!owned) return

  await supabase.from("truck_scheduled_stops").update({ status: "canceled" }).eq("id", id)

  revalidatePath("/dashboard/scheduled-stops")
  revalidatePath("/map")
}

export default async function DashboardScheduledStopsPage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) redirect("/vendor-login")

  const { data: truck } = await supabase.from("trucks").select("id, name, slug").eq("email", user.email).single()

  const { data: stops } = truck
    ? await supabase
        .from("truck_scheduled_stops")
        .select("*")
        .eq("truck_id", truck.id)
        .order("stop_date", { ascending: true })
        .order("start_time", { ascending: true })
    : { data: null }

  const rows = (stops ?? []) as TruckScheduledStopRow[]

  return (
    <main className="min-h-screen bg-muted/30">
      <Header />

      <div className="pt-24 pb-16">
        <div className="mx-auto max-w-2xl px-4 sm:px-6 lg:px-8">
          <div className="mb-8">
            <Link href="/dashboard" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
              ← Back to dashboard
            </Link>
            <h1 className="font-display text-3xl font-bold text-foreground mt-4">Scheduled stops</h1>
            <p className="text-muted-foreground mt-2">
              Plan where {truck?.name ?? "your truck"} will be. Public stops with coordinates appear on the map
              automatically during their time window. Manual Go Live still overrides schedule for last-minute changes.
            </p>
            <p className="text-xs text-muted-foreground mt-2">
              Weekly recurring pattern?{" "}
              <Link href="/dashboard/schedule" className="text-primary hover:underline">
                Edit weekly schedule
              </Link>
            </p>
          </div>

          {!truck ? (
            <Card>
              <CardHeader>
                <CardTitle>No truck found</CardTitle>
                <CardDescription>We couldn&apos;t find a truck linked to your account.</CardDescription>
              </CardHeader>
            </Card>
          ) : (
            <div className="space-y-8">
              <Card>
                <CardHeader>
                  <CardTitle>Add a scheduled stop</CardTitle>
                  <CardDescription>Date, time window, location, and visibility for the public map.</CardDescription>
                </CardHeader>
                <CardContent>
                  <form action={addScheduledStop} className="space-y-4">
                    <input type="hidden" name="truckId" value={truck.id} />

                    <div className="space-y-2">
                      <Label htmlFor="stop_date">Date</Label>
                      <Input id="stop_date" name="stop_date" type="date" required />
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="start_time">Start time</Label>
                        <Input id="start_time" name="start_time" type="time" required />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="end_time">End time</Label>
                        <Input id="end_time" name="end_time" type="time" required />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="location_name">Location name</Label>
                      <Input id="location_name" name="location_name" required placeholder="e.g. South End Food Truck Lot" />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="address">Address</Label>
                      <Input id="address" name="address" placeholder="1320 S Tryon St, Charlotte NC" />
                      <p className="text-xs text-muted-foreground">
                        We geocode the address for map pins. Charlotte-area addresses work best.
                      </p>
                    </div>

                    <label className="flex items-center gap-2 text-sm cursor-pointer">
                      <input type="checkbox" name="is_public" defaultChecked className="rounded border-input" />
                      Public stop (show on map &amp; truck profile)
                    </label>

                    <div className="space-y-2">
                      <Label htmlFor="menu_note">Menu note (optional)</Label>
                      <Input id="menu_note" name="menu_note" placeholder="e.g. Tacos + loaded fries today" />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="notes">Notes (optional, vendor-only)</Label>
                      <Textarea id="notes" name="notes" rows={2} placeholder="Internal notes — not shown publicly" />
                    </div>

                    <Button type="submit" className="bg-[#D94F1E] text-white hover:bg-[#b8441a]">
                      Save scheduled stop
                    </Button>
                  </form>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Your scheduled stops</CardTitle>
                </CardHeader>
                <CardContent>
                  {rows.length === 0 ? (
                    <p className="text-sm text-muted-foreground">No scheduled stops yet.</p>
                  ) : (
                    <ul className="space-y-3">
                      {rows.map((entry) => {
                        const hasCoords =
                          entry.latitude != null &&
                          entry.longitude != null &&
                          isValidTruckMapCoordinates(entry.latitude, entry.longitude)
                        return (
                          <li key={entry.id} className="rounded-lg border p-4 space-y-2">
                            <div className="flex flex-wrap items-center gap-2">
                              <p className="font-medium">{formatStopDate(entry.stop_date)}</p>
                              <Badge variant="outline" className="text-[10px]">
                                {entry.status}
                              </Badge>
                              {!entry.is_public ? (
                                <Badge variant="secondary" className="text-[10px]">
                                  Private
                                </Badge>
                              ) : null}
                              {!hasCoords && entry.status === "scheduled" ? (
                                <Badge variant="destructive" className="text-[10px]">
                                  Missing map coordinates
                                </Badge>
                              ) : null}
                            </div>
                            <p className="text-sm text-muted-foreground">{entry.location_name}</p>
                            {entry.address ? <p className="text-sm text-muted-foreground">{entry.address}</p> : null}
                            <p className="text-sm text-muted-foreground">
                              {formatStopTime(entry.start_time)} – {formatStopTime(entry.end_time)}
                            </p>
                            {entry.menu_note ? (
                              <p className="text-sm">
                                <span className="font-medium">Menu:</span> {entry.menu_note}
                              </p>
                            ) : null}
                            {entry.status === "scheduled" ? (
                              <form action={cancelScheduledStop}>
                                <input type="hidden" name="id" value={entry.id} />
                                <Button type="submit" variant="outline" size="sm">
                                  Cancel stop
                                </Button>
                              </form>
                            ) : null}
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
