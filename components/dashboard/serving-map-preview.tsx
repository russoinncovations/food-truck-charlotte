"use client"

import { cn } from "@/lib/utils"

type Props = {
  latitude: number | null
  longitude: number | null
  onPositionChange: (lat: number, lng: number) => void
  className?: string
}

/**
 * Vendor serving pin — Leaflet removed; Google Maps to be added later.
 * Geocoded coordinates still flow from the parent; map interaction TBD.
 */
export function ServingMapPreview({
  latitude,
  longitude,
  onPositionChange: _onPositionChange,
  className,
}: Props) {
  return (
    <div
      className={cn(
        "flex min-h-[220px] w-full flex-col items-center justify-center gap-2 rounded-md border border-dashed border-border bg-muted/30 p-4 text-center",
        className
      )}
    >
      <p className="text-sm font-medium text-foreground">Google Maps integration pending</p>
      {latitude != null && longitude != null && (
        <p className="text-xs text-muted-foreground font-mono tabular-nums">
          Pin: {latitude.toFixed(5)}, {longitude.toFixed(5)}
        </p>
      )}
      {latitude == null && longitude == null && (
        <p className="text-xs text-muted-foreground">
          Use Find on map or set a location after Google Maps is connected.
        </p>
      )}
    </div>
  )
}
