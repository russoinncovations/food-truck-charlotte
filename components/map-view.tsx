"use client"

import { type FoodTruck } from "@/lib/data"

interface MapViewProps {
  trucks: FoodTruck[]
  selectedTruck: FoodTruck | null
  onSelectTruck: (truck: FoodTruck | null) => void
}

/**
 * Full /map view — Leaflet removed; Google Maps to be added later.
 * Keeps the same public props so map-explorer and list selection still compile.
 */
export default function MapView({ trucks, selectedTruck, onSelectTruck }: MapViewProps) {
  void onSelectTruck
  return (
    <div className="h-full w-full min-h-[320px] flex flex-col items-center justify-center gap-2 bg-muted/50 border border-dashed border-border p-6 text-center">
      <p className="text-sm font-medium text-foreground">Google Maps integration pending</p>
      <p className="text-xs text-muted-foreground tabular-nums" aria-live="polite">
        {trucks.length} truck{trucks.length === 1 ? "" : "s"} passed in
      </p>
      {selectedTruck != null && (
        <p className="text-xs text-muted-foreground">
          Selected: <span className="font-medium text-foreground">{selectedTruck.name}</span>
        </p>
      )}
    </div>
  )
}
