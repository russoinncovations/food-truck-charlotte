import { Metadata } from "next"
import Link from "next/link"
import { redirect } from "next/navigation"
import { revalidatePath } from "next/cache"
import { Header } from "@/components/header"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { TruckPhotoUploadField } from "@/components/trucks/truck-photo-upload-field"
import { TruckGalleryManager } from "@/components/trucks/truck-gallery-manager"
import { createClient } from "@/lib/supabase/server"
import {
  BROWSE_CUISINE_LABEL_WITH_OTHER,
  BROWSE_CUISINE_LABELS,
  VENDOR_SETUP_EDIT_OPTIONS,
  browseLabelsFromStoredCuisine,
  isValidBrowseCuisineLabel,
  isValidVendorSetupEditValue,
  normalizeLabelKey,
  resolveVendorSetupForEdit,
} from "@/lib/trucks/truck-classification"

export const metadata: Metadata = {
  title: "Truck Profile | FoodTruck CLT",
  description: "Edit your food truck profile and how you appear in the directory.",
}

async function updateTruckProfile(formData: FormData) {
  "use server"
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user?.email) {
    redirect("/vendor-login")
  }

  const id = formData.get("truckId") as string | null
  if (!id) {
    redirect("/dashboard/profile")
  }

  const name = (formData.get("name") as string | null) ?? ""
  const primaryRaw = ((formData.get("primary_cuisine") as string | null) ?? "").trim()
  const additional = formData
    .getAll("additional_cuisines")
    .map(String)
    .map((s) => s.trim())
    .filter((s) => BROWSE_CUISINE_LABELS.some((l) => normalizeLabelKey(l) === normalizeLabelKey(s)))
  const vendorTypeRaw = ((formData.get("vendor_type") as string | null) ?? "").trim()
  const description = (formData.get("description") as string | null) ?? ""
  const website = (formData.get("website") as string | null) ?? ""
  const instagram = (formData.get("instagram") as string | null) ?? ""
  const facebook = (formData.get("facebook") as string | null) ?? ""
  const phone = (formData.get("phone") as string | null) ?? ""
  const tagline = (formData.get("tagline") as string | null) ?? ""
  const service_areas = (formData.get("service_areas") as string | null) ?? ""
  const today_specials = (formData.get("today_specials") as string | null) ?? ""

  const primary =
    primaryRaw && isValidBrowseCuisineLabel(primaryRaw)
      ? BROWSE_CUISINE_LABEL_WITH_OTHER.find((l) => normalizeLabelKey(l) === normalizeLabelKey(primaryRaw)) ??
        null
      : null

  const cuisineTypes = [
    ...(primary && primary !== "Other" ? [primary] : []),
    ...additional.filter((l) => !primary || normalizeLabelKey(l) !== normalizeLabelKey(primary)),
  ]

  const vendor_type = isValidVendorSetupEditValue(vendorTypeRaw) ? vendorTypeRaw : null

  await supabase
    .from("trucks")
    .update({
      name: name.trim(),
      cuisine: primary && primary !== "Other" ? primary : primary === "Other" ? "Other" : null,
      cuisine_types: cuisineTypes,
      vendor_type,
      description: description.trim() || null,
      website: website.trim() || null,
      instagram: instagram.trim() || null,
      facebook: facebook.trim() || null,
      phone: phone.trim() || null,
      tagline: tagline.trim() || null,
      service_areas: service_areas.trim() || null,
      today_specials: today_specials.trim() || null,
    })
    .eq("id", id)
    .eq("email", user.email)

  revalidatePath("/dashboard/profile")
  revalidatePath("/trucks")
  redirect("/dashboard")
}

export default async function DashboardProfilePage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    redirect("/vendor-login")
  }
  if (!user.email) {
    redirect("/vendor-login")
  }

  const { data: truck } = await supabase
    .from("trucks")
    .select(
      "id, name, cuisine, cuisine_types, vendor_type, description, website, instagram, facebook, photo_url, hero_photo_url, phone, tagline, service_areas, today_specials"
    )
    .eq("email", user.email)
    .single()

  const { data: galleryPhotos } = truck
    ? await supabase
        .from("truck_photos")
        .select("id, photo_url, alt_text")
        .eq("truck_id", truck.id)
        .order("sort_order", { ascending: true })
    : { data: null }

  const cuisineDefaults = browseLabelsFromStoredCuisine(
    (truck?.cuisine as string | null) ?? null,
    (truck?.cuisine_types as string[] | null) ?? null
  )
  const vendorSetupDefault = resolveVendorSetupForEdit((truck?.vendor_type as string | null) ?? null)

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
            <h1 className="font-display text-3xl font-bold text-foreground mt-4">
              Truck profile
            </h1>
            <p className="text-muted-foreground mt-2">
              Update how your truck appears in the FoodTruck CLT directory.
            </p>
          </div>

          {!truck ? (
            <Card>
              <CardHeader>
                <CardTitle>No profile found</CardTitle>
                <CardDescription>
                  We couldn&apos;t find a truck linked to your account. Contact support if you
                  believe this is an error.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Button asChild variant="outline">
                  <Link href="/dashboard">Return to dashboard</Link>
                </Button>
              </CardContent>
            </Card>
          ) : (
            <Card>
              <CardHeader>
                <CardTitle>Edit your listing</CardTitle>
                <CardDescription>
                  Changes apply to your public directory profile and dashboard. Cuisine and vendor
                  setup control how hosts find you on Browse Trucks.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <form action={updateTruckProfile} className="space-y-6">
                  <input type="hidden" name="truckId" value={truck.id} />

                  <div className="space-y-2">
                    <Label htmlFor="name">Truck Name</Label>
                    <Input
                      id="name"
                      name="name"
                      type="text"
                      required
                      defaultValue={truck.name ?? ""}
                      autoComplete="organization"
                    />
                  </div>

                  <div className="space-y-4 rounded-lg border border-border bg-muted/20 p-4">
                    <div>
                      <h3 className="text-sm font-medium text-foreground">Browse classification</h3>
                      <p className="text-xs text-muted-foreground mt-1">
                        Set these accurately so hosts can filter your truck. Manual categories
                        override automatic text matching on /trucks.
                      </p>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="primary_cuisine">Primary cuisine / category *</Label>
                      <select
                        id="primary_cuisine"
                        name="primary_cuisine"
                        required
                        defaultValue={cuisineDefaults.primary || ""}
                        className="flex h-10 w-full rounded-md border border-input bg-background px-3 text-sm"
                      >
                        <option value="" disabled>
                          Select primary category
                        </option>
                        {BROWSE_CUISINE_LABEL_WITH_OTHER.map((label) => (
                          <option key={label} value={label}>
                            {label}
                          </option>
                        ))}
                      </select>
                    </div>

                    <fieldset className="space-y-2">
                      <legend className="text-sm font-medium text-foreground">
                        Additional cuisine tags
                      </legend>
                      <p className="text-xs text-muted-foreground">
                        Optional — select other categories where hosts should also find you.
                      </p>
                      <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                        {BROWSE_CUISINE_LABELS.map((label) => (
                          <label
                            key={label}
                            className="flex items-start gap-2 text-sm text-foreground cursor-pointer"
                          >
                            <input
                              type="checkbox"
                              name="additional_cuisines"
                              value={label}
                              defaultChecked={cuisineDefaults.additional.includes(label)}
                              className="mt-1 rounded border-input size-4 shrink-0"
                            />
                            <span>{label}</span>
                          </label>
                        ))}
                      </div>
                    </fieldset>

                    <div className="space-y-2">
                      <Label htmlFor="vendor_type">Vendor setup *</Label>
                      <select
                        id="vendor_type"
                        name="vendor_type"
                        required
                        defaultValue={vendorSetupDefault || ""}
                        className="flex h-10 w-full rounded-md border border-input bg-background px-3 text-sm"
                      >
                        <option value="" disabled>
                          Select setup type
                        </option>
                        {VENDOR_SETUP_EDIT_OPTIONS.map((opt) => (
                          <option key={opt.value} value={opt.value}>
                            {opt.label}
                          </option>
                        ))}
                      </select>
                      <p className="text-xs text-muted-foreground">
                        Used for the public vendor setup filter (food truck, trailer, cart/tent, etc.).
                      </p>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="tagline">Tagline</Label>
                    <Input
                      id="tagline"
                      name="tagline"
                      type="text"
                      defaultValue={truck.tagline ?? ""}
                      placeholder="Short line that appears with your name"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="description">Description</Label>
                    <Textarea
                      id="description"
                      name="description"
                      rows={5}
                      defaultValue={truck.description ?? ""}
                      placeholder="Tell customers about your truck, menu, and story."
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="website">Website</Label>
                    <Input
                      id="website"
                      name="website"
                      type="url"
                      defaultValue={truck.website ?? ""}
                      placeholder="https://"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="instagram">Instagram handle</Label>
                    <Input
                      id="instagram"
                      name="instagram"
                      type="text"
                      defaultValue={truck.instagram ?? ""}
                      placeholder="@yourtruck or full URL"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="facebook">Facebook page or group URL</Label>
                    <Input
                      id="facebook"
                      name="facebook"
                      type="text"
                      defaultValue={truck.facebook ?? ""}
                      placeholder="https://facebook.com/yourpage"
                    />
                  </div>

                  <div className="space-y-6 rounded-lg border border-border bg-muted/20 p-4">
                    <div>
                      <h3 className="text-sm font-medium text-foreground">Photos</h3>
                      <p className="text-xs text-muted-foreground mt-1">
                        Upload images for your public profile. No need to paste image URLs — we store the link for you.
                      </p>
                    </div>

                    <TruckPhotoUploadField
                      truckId={truck.id}
                      photoTarget="listing"
                      initialPhotoUrl={truck.photo_url ?? null}
                      description="Main photo used in the directory and cards when no hero image is set."
                    />

                    <TruckPhotoUploadField
                      truckId={truck.id}
                      photoTarget="hero"
                      initialPhotoUrl={truck.hero_photo_url ?? null}
                      description="Large banner on your public truck page. Shown first when set."
                    />

                    <TruckGalleryManager
                      truckId={truck.id}
                      initialPhotos={(galleryPhotos ?? []).map((p) => ({
                        id: String(p.id),
                        photo_url: String(p.photo_url),
                        alt_text: (p.alt_text as string | null) ?? null,
                      }))}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="phone">Phone</Label>
                    <Input
                      id="phone"
                      name="phone"
                      type="tel"
                      defaultValue={truck.phone ?? ""}
                      autoComplete="tel"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="service_areas">Service Areas</Label>
                    <Input
                      id="service_areas"
                      name="service_areas"
                      type="text"
                      defaultValue={truck.service_areas ?? ""}
                      placeholder="South End, NoDa, Ballantyne"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="today_specials">Today&apos;s Specials</Label>
                    <Textarea
                      id="today_specials"
                      name="today_specials"
                      rows={4}
                      defaultValue={truck.today_specials ?? ""}
                      placeholder="What&apos;s on the menu today?"
                    />
                  </div>

                  <Button
                    type="submit"
                    className="w-full sm:w-auto bg-[#D94F1E] text-white hover:bg-[#b8441a]"
                  >
                    Save Changes
                  </Button>
                </form>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </main>
  )
}
