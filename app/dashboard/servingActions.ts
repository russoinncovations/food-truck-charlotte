"use server"

import { revalidatePath } from "next/cache"
import { createClient } from "@/lib/supabase/server"
import { geocodeCharlotteArea } from "@/lib/location/nominatim"
import { isValidTruckMapCoordinates } from "@/lib/location/truck-map-coords"
import { SERVING_REQUIRES_MAP_PIN_ERROR } from "@/lib/serving-location"

export type ServingActionResult = { success: true } | { success: false; error: string }

export async function geocodeServingAddress(addressLine: string): Promise<
  { success: true; lat: number; lng: number } | { success: false; error: string }
> {
  const g = await geocodeCharlotteArea(addressLine)
  if (!g.ok) return { success: false, error: g.error }
  return { success: true, lat: g.lat, lng: g.lng }
}

async function getOwnedTruckId(supabase: Awaited<ReturnType<typeof createClient>>, email: string) {
  const { data: truck } = await supabase.from("trucks").select("id").eq("email", email).maybeSingle()
  return truck?.id ?? null
}

export async function stopServingAction(formData: FormData): Promise<ServingActionResult> {
  const id = (formData.get("truckId") as string | null) ?? ""
  if (!id) return { success: false, error: "Missing truck" }
  return stopServing(id)
}

/** Stop serving: clear coordinates so map never shows a stale pin. */
export async function stopServing(truckId: string): Promise<ServingActionResult> {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user?.email) return { success: false, error: "Unauthorized" }

  const owned = await getOwnedTruckId(supabase, user.email)
  if (!owned || owned !== truckId) return { success: false, error: "Not allowed" }

  const { error } = await supabase
    .from("trucks")
    .update({
      serving_today: false,
      latitude: null,
      longitude: null,
    })
    .eq("id", truckId)

  if (error) return { success: false, error: error.message }
  revalidatePath("/dashboard")
  revalidatePath("/map")
  return { success: true }
}

/**
 * Only server path that sets `serving_today: true`. Requires valid lat/lng (no other "start serving" action).
 */
export async function startServingWithPin(
  _prev: ServingActionResult | null,
  formData: FormData
): Promise<ServingActionResult> {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user?.email) return { success: false, error: "Unauthorized" }

  const truckId = (formData.get("truckId") as string | null)?.trim() ?? ""
  if (!truckId) return { success: false, error: "Missing truck" }

  const owned = await getOwnedTruckId(supabase, user.email)
  if (!owned || owned !== truckId) return { success: false, error: "Not allowed" }

  const locationName = ((formData.get("locationName") as string | null) ?? "").trim()
  const streetAddress = ((formData.get("streetAddress") as string | null) ?? "").trim()
  const latRaw = formData.get("latitude") as string | null
  const lngRaw = formData.get("longitude") as string | null
  const lat = latRaw != null && latRaw !== "" ? parseFloat(latRaw) : NaN
  const lng = lngRaw != null && lngRaw !== "" ? parseFloat(lngRaw) : NaN

  if (!locationName) {
    return { success: false, error: "Enter a location name (e.g. where you’re parked)." }
  }
  if (!isValidTruckMapCoordinates(lat, lng)) {
    return { success: false, error: SERVING_REQUIRES_MAP_PIN_ERROR }
  }

  const { error } = await supabase
    .from("trucks")
    .update({
      serving_today: true,
      today_location: locationName,
      street_address: streetAddress || null,
      latitude: lat,
      longitude: lng,
    })
    .eq("id", truckId)

  if (error) return { success: false, error: error.message }
  revalidatePath("/dashboard")
  revalidatePath("/map")
  return { success: true }
}
