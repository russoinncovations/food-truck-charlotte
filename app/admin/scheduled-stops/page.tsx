import { Metadata } from "next"
import Link from "next/link"
import { Header } from "@/components/header"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { createAdminSupabaseClient } from "@/lib/supabase/admin"
import { isValidTruckMapCoordinates } from "@/lib/location/truck-map-coords"
import { fetchAllUpcomingStopsForAdmin } from "@/lib/schedule/scheduled-stop-map"
import { formatStopDate, formatStopTime } from "@/lib/schedule/scheduled-stops"
import { ChevronLeft } from "lucide-react"

export const metadata: Metadata = {
  title: "Scheduled Stops | Admin | Food Truck CLT",
  description: "Upcoming vendor scheduled stops across the directory",
}

export default async function AdminScheduledStopsPage({
  searchParams,
}: {
  searchParams: Promise<{ key?: string }>
}) {
  const params = await searchParams
  const key = params?.key
  const adminKey = process.env.ADMIN_KEY ?? "7985"

  if (key !== adminKey) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-muted-foreground">Page not found.</p>
      </div>
    )
  }

  const admin = createAdminSupabaseClient()
  const stops = admin ? await fetchAllUpcomingStopsForAdmin(admin, 21) : []
  const keyQ = `?key=${encodeURIComponent(key ?? "")}`

  const scheduledCount = stops.filter((s) => s.status === "scheduled").length
  const canceledCount = stops.filter((s) => s.status === "canceled").length
  const missingCoords = stops.filter(
    (s) =>
      s.status === "scheduled" &&
      s.is_public &&
      (s.latitude == null ||
        s.longitude == null ||
        !isValidTruckMapCoordinates(s.latitude, s.longitude))
  ).length

  return (
    <div className="min-h-screen bg-muted/30">
      <Header />

      <main className="pt-24 pb-16">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="mb-8">
            <Button variant="ghost" size="sm" className="h-8 px-2 -ml-2 mb-2" asChild>
              <Link href={`/admin${keyQ}`}>
                <ChevronLeft className="h-4 w-4 mr-1" />
                Command center
              </Link>
            </Button>
            <h1 className="font-display text-2xl sm:text-3xl font-bold text-foreground">Scheduled stops</h1>
            <p className="mt-1 text-sm text-muted-foreground">
              Upcoming vendor-entered stops for map and profile visibility (next 21 days).
            </p>
          </div>

          <div className="grid gap-3 sm:grid-cols-3 mb-6 text-sm">
            <div className="rounded-lg border bg-card px-3 py-2">
              <p className="text-xs text-muted-foreground">Scheduled</p>
              <p className="text-lg font-semibold tabular-nums">{scheduledCount}</p>
            </div>
            <div className="rounded-lg border bg-card px-3 py-2">
              <p className="text-xs text-muted-foreground">Canceled</p>
              <p className="text-lg font-semibold tabular-nums">{canceledCount}</p>
            </div>
            <div className="rounded-lg border bg-card px-3 py-2">
              <p className="text-xs text-muted-foreground">Public stops missing coords</p>
              <p className="text-lg font-semibold tabular-nums text-destructive">{missingCoords}</p>
            </div>
          </div>

          <Card>
            <CardHeader>
              <CardTitle className="text-lg">All upcoming stops</CardTitle>
              <CardDescription>
                Public private stops show visibility only — addresses stay hidden on the public map when private.
              </CardDescription>
            </CardHeader>
            <CardContent className="overflow-x-auto">
              {!admin ? (
                <p className="text-sm text-destructive">Set SUPABASE_SERVICE_ROLE_KEY to load stops.</p>
              ) : stops.length === 0 ? (
                <p className="text-sm text-muted-foreground">No scheduled stops in the next 21 days.</p>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Truck</TableHead>
                      <TableHead>Date / time</TableHead>
                      <TableHead>Location</TableHead>
                      <TableHead>Visibility</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Coords</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {stops.map((stop) => {
                      const hasCoords =
                        stop.latitude != null &&
                        stop.longitude != null &&
                        isValidTruckMapCoordinates(stop.latitude, stop.longitude)
                      return (
                        <TableRow key={stop.id}>
                          <TableCell className="align-top">
                            <p className="font-medium">{stop.truck_name ?? "—"}</p>
                            {stop.truck_slug ? (
                              <p className="text-xs text-muted-foreground font-mono">/{stop.truck_slug}</p>
                            ) : null}
                          </TableCell>
                          <TableCell className="align-top text-sm">
                            <p>{formatStopDate(stop.stop_date)}</p>
                            <p className="text-muted-foreground">
                              {formatStopTime(stop.start_time)} – {formatStopTime(stop.end_time)}
                            </p>
                          </TableCell>
                          <TableCell className="align-top text-sm max-w-[200px]">
                            <p>{stop.location_name}</p>
                            {stop.is_public && stop.address ? (
                              <p className="text-muted-foreground break-all">{stop.address}</p>
                            ) : !stop.is_public ? (
                              <p className="text-muted-foreground italic">Private event</p>
                            ) : null}
                            {stop.menu_note ? (
                              <p className="text-xs mt-1">
                                <span className="font-medium">Menu:</span> {stop.menu_note}
                              </p>
                            ) : null}
                          </TableCell>
                          <TableCell className="align-top">
                            <Badge variant={stop.is_public ? "secondary" : "outline"} className="text-[10px]">
                              {stop.is_public ? "Public" : "Private"}
                            </Badge>
                          </TableCell>
                          <TableCell className="align-top">
                            <Badge
                              variant={stop.status === "scheduled" ? "secondary" : "outline"}
                              className="text-[10px]"
                            >
                              {stop.status}
                            </Badge>
                          </TableCell>
                          <TableCell className="align-top text-sm">
                            {hasCoords ? (
                              <span className="text-green-700 dark:text-green-400">OK</span>
                            ) : (
                              <span className="text-destructive">Missing</span>
                            )}
                          </TableCell>
                        </TableRow>
                      )
                    })}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  )
}
