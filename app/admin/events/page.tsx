import { Metadata } from "next"
import { revalidatePath } from "next/cache"
import { createClient } from "@/lib/supabase/server"
import { Header } from "@/components/header"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Calendar } from "lucide-react"

export const metadata: Metadata = {
  title: "Pending Events | Admin | Food Truck CLT",
  description: "Approve or reject vendor-submitted events.",
}

async function approveEvent(formData: FormData) {
  "use server"
  const supabase = await createClient()
  const id = formData.get("id") as string | null
  if (!id) {
    return
  }
  await supabase.from("events").update({ active: true }).eq("id", id)
  revalidatePath("/admin/events")
}

async function rejectEvent(formData: FormData) {
  "use server"
  const supabase = await createClient()
  const id = formData.get("id") as string | null
  if (!id) {
    return
  }
  await supabase.from("events").delete().eq("id", id)
  revalidatePath("/admin/events")
}

export default async function AdminEventsPage({
  searchParams,
}: {
  searchParams: Promise<{ key?: string }>
}) {
  const key = (await searchParams)?.key
  if (key !== process.env.ADMIN_KEY) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-muted-foreground">Page not found.</p>
      </div>
    )
  }

  const supabase = await createClient()
  const { data: pendingEvents } = await supabase
    .from("events")
    .select("id, title, date, location_name, description, created_at, submitted_by_truck_id, trucks(name)")
    .eq("active", false)
    .order("created_at", { ascending: false })

  const rows = pendingEvents ?? []

  return (
    <div className="min-h-screen bg-muted/30">
      <Header />

      <main className="pt-24 pb-16">
        <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8">
          <div className="mb-8">
            <h1 className="font-display text-2xl sm:text-3xl font-bold text-foreground">
              Pending events
            </h1>
            <p className="mt-1 text-muted-foreground">
              Approve or reject vendor-submitted events before they go live.
            </p>
          </div>

          {rows.length === 0 ? (
            <Card>
              <CardContent className="py-12 text-center text-muted-foreground text-sm">
                No pending events to review.
              </CardContent>
            </Card>
          ) : (
            <ul className="space-y-4">
              {rows.map((ev) => {
                const truckRel = ev.trucks as { name?: string } | { name?: string }[] | null
                const truckName = Array.isArray(truckRel)
                  ? truckRel[0]?.name
                  : truckRel?.name
                const dateObj = ev.date ? new Date(ev.date) : null
                const dateStr =
                  dateObj && !Number.isNaN(dateObj.getTime())
                    ? dateObj.toLocaleDateString("en-US", {
                        weekday: "short",
                        month: "short",
                        day: "numeric",
                        year: "numeric",
                      })
                    : ev.date
                const created = ev.created_at
                  ? new Date(ev.created_at).toLocaleString("en-US", {
                      month: "short",
                      day: "numeric",
                      year: "numeric",
                      hour: "numeric",
                      minute: "2-digit",
                    })
                  : null

                return (
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
                            {dateStr}
                          </span>
                          {created ? <span>Submitted {created}</span> : null}
                        </div>
                      </CardHeader>
                      <CardContent className="space-y-3">
                        {truckName ? (
                          <p className="text-sm">
                            <span className="font-medium text-foreground">Truck: </span>
                            {truckName}
                          </p>
                        ) : null}
                        {ev.location_name ? (
                          <p className="text-sm text-muted-foreground">{ev.location_name}</p>
                        ) : null}
                        {ev.description ? (
                          <p className="text-sm text-muted-foreground whitespace-pre-wrap">{ev.description}</p>
                        ) : null}
                        <div className="flex flex-wrap gap-2 pt-2">
                          <form action={approveEvent}>
                            <input type="hidden" name="id" value={ev.id} />
                            <Button type="submit" size="sm">
                              Approve
                            </Button>
                          </form>
                          <form action={rejectEvent}>
                            <input type="hidden" name="id" value={ev.id} />
                            <Button type="submit" variant="outline" size="sm">
                              Reject
                            </Button>
                          </form>
                        </div>
                      </CardContent>
                    </Card>
                  </li>
                )
              })}
            </ul>
          )}
        </div>
      </main>
    </div>
  )
}
