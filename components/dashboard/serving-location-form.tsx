"use client"

import { useActionState, useCallback, useMemo, useState, type FormEvent } from "react"
import { startServingWithPin, stopServingAction, geocodeServingAddress, type ServingActionResult } from "@/app/dashboard/servingActions"
import { isValidTruckMapCoordinates } from "@/lib/location/truck-map-coords"
import { SERVING_REQUIRES_MAP_PIN_ERROR } from "@/lib/serving-location"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { ServingMapPreview } from "@/components/dashboard/serving-map-preview"
import { MapPin, Search } from "lucide-react"

export type TruckServingFields = {
  id: string
  serving_today: boolean | null
  today_location: string | null
  street_address: string | null
  latitude: number | string | null
  longitude: number | string | null
  /** Present when form is fed from the dashboard truck query; optional elsewhere */
  updated_at?: string | null
}

const initial: ServingActionResult | null = null

function parsePin(t: TruckServingFields): { lat: number | null; lng: number | null } {
  const la = t.latitude == null || t.latitude === "" ? NaN : Number(t.latitude)
  const lo = t.longitude == null || t.longitude === "" ? NaN : Number(t.longitude)
  if (isValidTruckMapCoordinates(la, lo)) return { lat: la, lng: lo }
  return { lat: null, lng: null }
}

export function ServingLocationForm({ truck }: { truck: TruckServingFields }) {
  const [locationName, setLocationName] = useState(() => (truck.today_location ?? "").trim() || "")
  const [street, setStreet] = useState(() => (truck.street_address ?? "").trim() || "")
  const initialPin = useMemo(() => parsePin(truck), [truck])
  const [pinLat, setPinLat] = useState<number | null>(initialPin.lat)
  const [pinLng, setPinLng] = useState<number | null>(initialPin.lng)
  const [geoError, setGeoError] = useState<string | null>(null)
  const [geocoding, setGeocoding] = useState(false)
  const [clientBlockError, setClientBlockError] = useState<string | null>(null)

  const [startState, startAction, startPending] = useActionState(startServingWithPin, initial)

  const onPositionChange = useCallback((lat: number, lng: number) => {
    setPinLat(lat)
    setPinLng(lng)
    setClientBlockError(null)
  }, [])

  async function onGeocode() {
    setGeoError(null)
    const line = [locationName.trim(), street.trim()].filter(Boolean).join(", ")
    if (!line) {
      setGeoError("Enter a location name or street first.")
      return
    }
    setGeocoding(true)
    try {
      const r = await geocodeServingAddress(line)
      if (r.success) {
        setPinLat(r.lat)
        setPinLng(r.lng)
        setClientBlockError(null)
      } else {
        setGeoError(r.error)
      }
    } finally {
      setGeocoding(false)
    }
  }

  const canSave =
    locationName.trim().length > 0 && pinLat != null && pinLng != null && isValidTruckMapCoordinates(pinLat, pinLng)

  function handleStartFormSubmit(e: FormEvent<HTMLFormElement>) {
    setClientBlockError(null)
    if (process.env.NODE_ENV === "development") {
      const form = e.currentTarget
      const hiddenLat = form.querySelector<HTMLInputElement>('input[name="latitude"]')?.value
      const hiddenLng = form.querySelector<HTMLInputElement>('input[name="longitude"]')?.value
      // eslint-disable-next-line no-console
      console.log("[ServingLocationForm] submit (start)", {
        pinLat,
        pinLng,
        hiddenLatitude: hiddenLat,
        hiddenLongitude: hiddenLng,
      })
    }
    const nameOk = locationName.trim().length > 0
    const coordsOk = pinLat != null && pinLng != null && isValidTruckMapCoordinates(pinLat, pinLng)
    if (!coordsOk) {
      e.preventDefault()
      setClientBlockError(SERVING_REQUIRES_MAP_PIN_ERROR)
      return
    }
    if (!nameOk) {
      e.preventDefault()
      return
    }
    // Submits to startServingWithPin only (action={startAction}); no other path.
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-4 rounded-lg border p-4">
        <div className="flex items-center gap-3 min-w-0">
          <div className="h-12 w-12 rounded-full bg-muted flex items-center justify-center shrink-0">
            <MapPin className="h-6 w-6 text-muted-foreground" />
          </div>
          <div>
            <p className="text-sm font-medium text-foreground">Serving status</p>
            <p className="text-xs text-muted-foreground">
              {truck.serving_today
                ? "You’re on the map with a saved pin. Update your spot below."
                : "Set your location and pin, then start serving to appear on the map."}
            </p>
          </div>
        </div>
        <div
          className={
            truck.serving_today
              ? "shrink-0 rounded-full bg-green-500 px-2.5 py-1 text-xs font-medium text-white"
              : "shrink-0 rounded-full border border-muted-foreground/30 px-2.5 py-1 text-xs"
          }
        >
          {truck.serving_today ? "Serving" : "Not serving"}
        </div>
      </div>

      <form action={startAction} onSubmit={handleStartFormSubmit} className="flex flex-col gap-3 rounded-lg border p-4">
        <input type="hidden" name="truckId" value={truck.id} />
        <input type="hidden" name="latitude" value={pinLat ?? ""} />
        <input type="hidden" name="longitude" value={pinLng ?? ""} />

        <p className="text-sm font-medium text-foreground">Start or update today&apos;s location</p>
        <p className="text-xs text-muted-foreground">
          Search to place a pin, then drag it if needed. The map only uses latitude &amp; longitude — not the text
          alone.
        </p>

        <div className="space-y-2">
          <label htmlFor="locationName" className="text-sm font-medium text-foreground">
            Location name
          </label>
          <Input
            id="locationName"
            name="locationName"
            value={locationName}
            onChange={(e) => setLocationName(e.target.value)}
            placeholder="e.g. South End Brewery, Food Truck Friday"
            required
          />
        </div>
        <div className="space-y-2">
          <label htmlFor="streetAddress" className="text-sm font-medium text-foreground">
            Street address (optional)
          </label>
          <Input
            id="streetAddress"
            name="streetAddress"
            value={street}
            onChange={(e) => setStreet(e.target.value)}
            placeholder="e.g. 123 W Tremont Ave"
          />
        </div>

        <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
          <Button type="button" variant="secondary" className="gap-2" disabled={geocoding} onClick={() => void onGeocode()}>
            <Search className="h-4 w-4" />
            {geocoding ? "Searching…" : "Find on map"}
          </Button>
          <span className="text-xs text-muted-foreground">Places or adjusts the pin (you can drag it after).</span>
        </div>
        {geoError && <p className="text-sm text-destructive">{geoError}</p>}

        <div className="space-y-1">
          <p className="text-sm font-medium text-foreground">Map preview</p>
          <ServingMapPreview latitude={pinLat} longitude={pinLng} onPositionChange={onPositionChange} />
          <p className="text-xs text-muted-foreground">Click the map to drop a pin, or drag the pin to adjust.</p>
        </div>

        {clientBlockError && (
          <p className="text-sm text-destructive" role="alert">
            {clientBlockError}
          </p>
        )}

        {startState && !startState.success && (
          <p className="text-sm text-destructive" role="alert">
            {startState.error}
          </p>
        )}

        <Button type="submit" className="w-full sm:w-auto" disabled={!canSave || startPending}>
          {startPending ? "Saving…" : truck.serving_today ? "Save location" : "Start serving"}
        </Button>
      </form>

      {truck.serving_today && (
        <form action={stopServingAction} className="rounded-lg border border-dashed p-4">
          <input type="hidden" name="truckId" value={truck.id} />
          <p className="text-sm text-muted-foreground mb-2">Stop showing as open and remove your map pin for today.</p>
          <Button type="submit" variant="outline" className="w-full sm:w-auto">
            Stop serving
          </Button>
        </form>
      )}
    </div>
  )
}
