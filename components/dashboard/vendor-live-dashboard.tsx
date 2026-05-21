"use client"

import { useEffect, useRef, useState } from "react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { ServingLocationForm, type TruckServingFields } from "@/components/dashboard/serving-location-form"
import { VendorDashboardHeader } from "@/components/dashboard/vendor-dashboard-header"
import { VendorNavLinks } from "@/components/dashboard/vendor-dashboard-nav"
import {
  clearServingReminder,
  extendServingReminderHours,
  readServingReminderUntilIso,
  setServingReminderHoursFromNow,
} from "@/lib/pwa/vendor-serving-reminder-storage"
import { MapPin, Radio, Inbox } from "lucide-react"

function formatUntil(iso: string | null): string {
  if (!iso) return "—"
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return "—"
  return d.toLocaleString("en-US", {
    weekday: "short",
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  })
}

export function VendorLiveDashboard({
  truck,
  truckDisplayName,
  pendingRequestCount,
}: {
  truck: TruckServingFields
  truckDisplayName: string
  pendingRequestCount: number
}) {
  const [reminderIso, setReminderIso] = useState<string | null>(null)
  const prevServingRef = useRef<boolean | null>(null)

  useEffect(() => {
    setReminderIso(readServingReminderUntilIso(truck.id))
  }, [truck.id, truck.serving_today, truck.updated_at])

  useEffect(() => {
    const prev = prevServingRef.current
    prevServingRef.current = truck.serving_today ?? false
    if (prev === true && truck.serving_today === false) {
      clearServingReminder(truck.id)
      setReminderIso(null)
    }
  }, [truck.serving_today, truck.id])

  function bumpHours(h: number) {
    const iso = truck.serving_today ? extendServingReminderHours(truck.id, h) : setServingReminderHoursFromNow(truck.id, h)
    setReminderIso(iso)
  }

  function setCustomUntil(value: string) {
    if (!value) return
    const d = new Date(value)
    if (Number.isNaN(d.getTime())) return
    const iso = d.toISOString()
    try {
      sessionStorage.setItem(`ftclt-serving-until-reminder:${truck.id}`, iso)
    } catch {
      // ignore
    }
    setReminderIso(iso)
  }

  const locationLine =
    [(truck.today_location ?? "").trim(), (truck.street_address ?? "").trim()].filter(Boolean).join(" · ") ||
    "—"

  const isLive = truck.serving_today === true

  return (
    <div className="min-h-screen bg-muted/30">
      <VendorDashboardHeader truckNameInitial={truckDisplayName[0] ?? "T"} />

      <div className="flex">
        <aside className="hidden md:flex flex-col w-64 bg-background border-r min-h-[calc(100vh-4rem)]">
          <div className="flex-1 p-4">
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide px-3 mb-2">Vendor</p>
            <VendorNavLinks />
          </div>
        </aside>

        <main className="flex-1 p-4 md:p-6 space-y-6 max-w-lg md:max-w-xl lg:max-w-none lg:max-w-2xl mx-auto w-full pb-24">
          <div>
            <h1 className="font-display text-2xl font-bold text-foreground flex items-center gap-2">
              <Radio className="h-7 w-7 text-primary shrink-0" />
              Go live on the map
            </h1>
            <p className="text-sm text-muted-foreground mt-1">
              Set your pin and appear on the public live map — optimized for phones.
            </p>
          </div>

          {pendingRequestCount > 0 ? (
            <Card className="border-primary/30 bg-primary/5">
              <CardHeader className="pb-2">
                <CardTitle className="text-base flex items-center gap-2">
                  <Inbox className="h-4 w-4 text-primary" />
                  Requests to confirm
                </CardTitle>
                <CardDescription>
                  You have{" "}
                  <span className="font-medium text-foreground tabular-nums">{pendingRequestCount}</span> active
                  {pendingRequestCount === 1 ? " request " : " requests "}
                  on your dashboard.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Button variant="default" size="sm" asChild>
                  <Link href="/dashboard#vendor-requests-to-confirm">Review booking leads</Link>
                </Button>
              </CardContent>
            </Card>
          ) : null}

          {isLive ? (
            <Card className="border-green-600/35 bg-green-500/10">
              <CardHeader className="pb-2">
                <CardTitle className="text-lg flex items-center gap-2">
                  <span className="relative flex h-2.5 w-2.5">
                    <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-green-600 opacity-75" />
                    <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-green-600" />
                  </span>
                  You&apos;re live on the map
                </CardTitle>
                <CardDescription>Customers can see your truck on the live map.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4 text-sm">
                <div>
                  <p className="text-xs font-medium text-muted-foreground flex items-center gap-1">
                    <MapPin className="h-3.5 w-3.5" /> Current location
                  </p>
                  <p className="font-medium text-foreground mt-0.5">{locationLine}</p>
                </div>
                <div>
                  <p className="text-xs font-medium text-muted-foreground">Serving reminder (optional)</p>
                  <p className="text-foreground mt-0.5 tabular-nums">{formatUntil(reminderIso)}</p>
                  <p className="text-[11px] text-muted-foreground mt-1 leading-snug">
                    For your planning only — not shown on the public map.
                  </p>
                </div>
                <div className="flex flex-wrap gap-2">
                  <Button type="button" variant="outline" size="sm" onClick={() => bumpHours(1)}>
                    +1 hr
                  </Button>
                  <Button type="button" variant="outline" size="sm" onClick={() => bumpHours(2)}>
                    +2 hr
                  </Button>
                  <Button type="button" variant="outline" size="sm" onClick={() => bumpHours(3)}>
                    +3 hr
                  </Button>
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="custom-until-live" className="text-xs text-muted-foreground">
                    Custom reminder time
                  </Label>
                  <Input
                    id="custom-until-live"
                    type="datetime-local"
                    className="text-sm"
                    onChange={(e) => setCustomUntil(e.target.value)}
                  />
                </div>
                <div className="flex flex-wrap gap-2 pt-1">
                  <Button
                    type="button"
                    variant="secondary"
                    size="sm"
                    onClick={() => document.getElementById("vendor-live-pin-form")?.scrollIntoView({ behavior: "smooth" })}
                  >
                    Update location
                  </Button>
                  <Button
                    type="button"
                    variant="secondary"
                    size="sm"
                    onClick={() => document.getElementById("vendor-stop-serving")?.scrollIntoView({ behavior: "smooth" })}
                  >
                    Stop serving
                  </Button>
                </div>
              </CardContent>
            </Card>
          ) : (
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-base">Go live on the map</CardTitle>
                <CardDescription>
                  Add a location name or address, tap <strong className="text-foreground">Find on map</strong>, adjust
                  the pin, then go live.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                <p className="text-xs font-medium text-muted-foreground">Serving reminder — pick an end time</p>
                <p className="text-[11px] text-muted-foreground leading-snug">
                  Used only on this screen to remember when you plan to wrap (not synced to the map).
                </p>
                <div className="flex flex-wrap gap-2">
                  <Button type="button" variant="outline" size="sm" onClick={() => bumpHours(1)}>
                    +1 hr
                  </Button>
                  <Button type="button" variant="outline" size="sm" onClick={() => bumpHours(2)}>
                    +2 hr
                  </Button>
                  <Button type="button" variant="outline" size="sm" onClick={() => bumpHours(3)}>
                    +3 hr
                  </Button>
                </div>
                {reminderIso ? (
                  <p className="text-xs text-muted-foreground tabular-nums">Reminder about: {formatUntil(reminderIso)}</p>
                ) : null}
                <div className="space-y-1.5">
                  <Label htmlFor="custom-until-prep" className="text-xs text-muted-foreground">
                    Custom reminder time
                  </Label>
                  <Input
                    id="custom-until-prep"
                    type="datetime-local"
                    className="text-sm"
                    onChange={(e) => setCustomUntil(e.target.value)}
                  />
                </div>
              </CardContent>
            </Card>
          )}

          <ServingLocationForm
            truck={truck}
            showStatusStrip={false}
            submitLabels={{ start: "Go live", update: "Save location", busy: "Saving…" }}
          />

          <p className="text-xs text-muted-foreground text-center">
            <Link href="/dashboard" className="text-primary font-medium underline-offset-2 hover:underline">
              Full vendor dashboard
            </Link>
          </p>
        </main>
      </div>
    </div>
  )
}
