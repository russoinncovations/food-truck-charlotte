"use client"

import dynamic from "next/dynamic"
import type { MapEventMarker } from "@/lib/events/map-event-markers"
import type { ServingTruckRow } from "@/lib/map/serving-row-to-food-truck"

const MapPreview = dynamic(() => import("@/components/map-preview"), {
  ssr: false,
  loading: () => (
    <section className="py-16 md:py-24 bg-muted/30" aria-hidden>
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="mb-8 space-y-2">
          <div className="h-8 w-64 max-w-full rounded bg-muted animate-pulse" />
          <div className="h-4 w-96 max-w-full rounded bg-muted/80 animate-pulse" />
        </div>
        <div className="h-[min(60vw,500px)] min-h-[240px] rounded-xl border bg-[#f2efe9] animate-pulse" />
      </div>
    </section>
  ),
})

export function MapPreviewClient({
  trucks,
  mapEvents,
}: {
  trucks: ServingTruckRow[]
  mapEvents: MapEventMarker[]
}) {
  return <MapPreview trucks={trucks} mapEvents={mapEvents} />
}
