import { Metadata } from "next"
import Link from "next/link"
import { redirect } from "next/navigation"
import { revalidatePath } from "next/cache"
import { Header } from "@/components/header"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { createClient } from "@/lib/supabase/server"

export const metadata: Metadata = {
  title: "Weekly Schedule | FoodTruck CLT",
  description: "Manage your food truck weekly schedule and locations.",
}

const DAY_OPTIONS = [
  { value: "0", label: "Monday" },
  { value: "1", label: "Tuesday" },
  { value: "2", label: "Wednesday" },
  { value: "3", label: "Thursday" },
  { value: "4", label: "Friday" },
  { value: "5", label: "Saturday" },
  { value: "6", label: "Sunday" },
]

function dayLabel(dayOfWeek: number | null | undefined): string {
  if (dayOfWeek == null || dayOfWeek < 0 || dayOfWeek > 6) return "—"
  return DAY_OPTIONS[dayOfWeek]?.label ?? "—"
}

function formatTime(t: string | null | undefined): string {
  if (!t) return "—"
  const s = String(t).slice(0, 5)
  return s
}

async function addScheduleEntry(formData: FormData) {
  "use server"
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user?.email) {
    redirect("/vendor-login")
  }

  const truckId = formData.get("truckId") as string | null
  if (!truckId) {
    return
  }

  const { data: owned } = await supabase
    .from("trucks")
    .select("id")
    .eq("id", truckId)
    .eq("email", user.email)
    .single()
  if (!owned) {
    return
  }

  const dayRaw = formData.get("day_of_week") as string | null
  const day_of_week = dayRaw != null && dayRaw !== "" ? parseInt(dayRaw, 10) : NaN
  const location_name = ((formData.get("location_name") as string | null) ?? "").trim()
  const latRaw = ((formData.get("latitude") as string | null) ?? "").trim()
  const lngRaw = ((formData.get("longitude") as string | null) ?? "").trim()
  const start_time = (formData.get("start_time") as string | null) ?? ""
  const end_time = (formData.get("end_time") as string | null) ?? ""

  if (Number.isNaN(day_of_week) || !location_name || !start_time || !end_time) {
    return
  }

  const latitude = latRaw === "" ? null : parseFloat(latRaw)
  const longitude = lngRaw === "" ? null : parseFloat(lngRaw)

  await supabase.from("truck_schedule").insert({
    truck_id: truckId,
    day_of_week,
    location_name,
    latitude: latitude != null && !Number.isNaN(latitude) ? latitude : null,
    longitude: longitude != null && !Number.isNaN(longitude) ? longitude : null,
    start_time,
    end_time,
  })

  revalidatePath("/dashboard/schedule")
}

async function deleteScheduleEntry(formData: FormData) {
  "use server"
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user?.email) {
    redirect("/vendor-login")
  }

  const id = formData.get("id") as string | null
  if (!id) {
    return
  }

  const { data: row } = await supabase.from("truck_schedule").select("truck_id").eq("id", id).single()
  if (!row?.truck_id) {
    return
  }

  const { data: owned } = await supabase
    .from("trucks")
    .select("id")
    .eq("id", row.truck_id)
    .eq("email", user.email)
    .single()
  if (!owned) {
    return
  }

  await supabase.from("truck_schedule").delete().eq("id", id)

  revalidatePath("/dashboard/schedule")
}

export default async function DashboardSchedulePage() {
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

  const { data: schedule } = truck
    ? await supabase
        .from("truck_schedule")
        .select("*")
        .eq("truck_id", truck.id)
        .order("day_of_week")
    : { data: null }

  const rows = schedule ?? []

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
            <h1 className="font-display text-3xl font-bold text-foreground mt-4">Weekly Schedule</h1>
            <p className="text-muted-foreground mt-2">
              {truck?.name ? `Plan where ${truck.name} will be each week.` : "Manage your weekly stops."}
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
                  <CardTitle>Add a stop</CardTitle>
                  <CardDescription>Add a location and time window for a day of the week.</CardDescription>
                </CardHeader>
                <CardContent>
                  <form action={addScheduleEntry} className="space-y-4">
                    <input type="hidden" name="truckId" value={truck.id} />

                    <div className="space-y-2">
                      <Label htmlFor="day_of_week">Day of week</Label>
                      <select
                        id="day_of_week"
                        name="day_of_week"
                        required
                        className="border-input flex h-9 w-full rounded-md border bg-transparent px-3 py-1 text-base shadow-xs outline-none focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px] md:text-sm"
                      >
                        {DAY_OPTIONS.map((d) => (
                          <option key={d.value} value={d.value}>
                            {d.label}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="location_name">Location name</Label>
                      <Input
                        id="location_name"
                        name="location_name"
                        type="text"
                        required
                        placeholder="e.g. South End Brewery"
                      />
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
                      <p className="text-sm font-medium text-foreground">GPS Coordinates (optional)</p>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label htmlFor="latitude">Latitude</Label>
                          <Input
                            id="latitude"
                            name="latitude"
                            type="text"
                            inputMode="decimal"
                            placeholder="35.2271"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="longitude">Longitude</Label>
                          <Input
                            id="longitude"
                            name="longitude"
                            type="text"
                            inputMode="decimal"
                            placeholder="-80.8431"
                          />
                        </div>
                      </div>
                    </div>

                    <Button
                      type="submit"
                      className="bg-[#D94F1E] text-white hover:bg-[#b8441a]"
                    >
                      Add to Schedule
                    </Button>
                  </form>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Your schedule</CardTitle>
                </CardHeader>
                <CardContent>
                  {rows.length === 0 ? (
                    <p className="text-sm text-muted-foreground">No schedule entries yet</p>
                  ) : (
                    <ul className="space-y-3">
                      {rows.map((entry: Record<string, unknown>) => {
                        const id = String(entry.id)
                        const dow = Number(entry.day_of_week)
                        const loc = String(entry.location_name ?? "")
                        const start = formatTime(entry.start_time as string)
                        const end = formatTime(entry.end_time as string)
                        return (
                          <li
                            key={id}
                            className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 rounded-lg border p-4"
                          >
                            <div>
                              <p className="font-medium text-foreground">{dayLabel(dow)}</p>
                              <p className="text-sm text-muted-foreground">{loc}</p>
                              <p className="text-sm text-muted-foreground">
                                {start} – {end}
                              </p>
                            </div>
                            <form action={deleteScheduleEntry}>
                              <input type="hidden" name="id" value={id} />
                              <Button type="submit" variant="outline" size="sm">
                                Delete
                              </Button>
                            </form>
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
