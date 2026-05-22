import { Metadata } from "next"
import Link from "next/link"
import { redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import { VendorLiveDashboard } from "@/components/dashboard/vendor-live-dashboard"
import { countVendorActivePendingBookingOpportunities } from "@/lib/dashboard/vendor-pending-opportunities"
import { PWA_ICON_CACHE_QUERY } from "@/lib/pwa-icon-cache"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"

export const metadata: Metadata = {
  title: "Go Live | Vendor | Food Truck CLT",
  description: "Start or update your live map pin from your phone.",
  /** Overrides default `/manifest.webmanifest` so Add to Home Screen uses vendor start URL. */
  manifest: `/manifest-vendor.webmanifest${PWA_ICON_CACHE_QUERY}`,
}

export default async function VendorLivePage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) {
    redirect("/vendor-login")
  }

  const { data: truckData } = await supabase
    .from("trucks")
    .select("id, name, serving_today, today_location, street_address, latitude, longitude, updated_at")
    .eq("email", user.email)
    .single()

  if (!truckData?.id) {
    return (
      <div className="min-h-screen bg-muted/30 flex items-center justify-center p-6">
        <Card className="max-w-md w-full">
          <CardHeader>
            <CardTitle>No truck profile</CardTitle>
            <CardDescription>We couldn&apos;t find a truck linked to your login email.</CardDescription>
          </CardHeader>
          <CardContent className="flex flex-wrap gap-2">
            <Button asChild variant="outline">
              <Link href="/dashboard">Back to dashboard</Link>
            </Button>
            <Button asChild>
              <Link href="/list-your-truck">List your truck</Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  const pendingRequestCount = await countVendorActivePendingBookingOpportunities(supabase, truckData.id)

  return (
    <VendorLiveDashboard
      truck={{
        id: truckData.id,
        serving_today: truckData.serving_today,
        today_location: truckData.today_location,
        street_address: truckData.street_address,
        latitude: truckData.latitude,
        longitude: truckData.longitude,
        updated_at: truckData.updated_at,
      }}
      truckDisplayName={truckData.name ?? "Your truck"}
      pendingRequestCount={pendingRequestCount}
    />
  )
}
