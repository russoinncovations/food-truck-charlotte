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
import { createClient } from "@/lib/supabase/server"

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
  const cuisine = (formData.get("cuisine") as string | null) ?? ""
  const description = (formData.get("description") as string | null) ?? ""
  const website = (formData.get("website") as string | null) ?? ""
  const instagram = (formData.get("instagram") as string | null) ?? ""
  const phone = (formData.get("phone") as string | null) ?? ""
  const tagline = (formData.get("tagline") as string | null) ?? ""
  const service_areas = (formData.get("service_areas") as string | null) ?? ""
  const today_specials = (formData.get("today_specials") as string | null) ?? ""

  await supabase
    .from("trucks")
    .update({
      name: name.trim(),
      cuisine: cuisine.trim() || null,
      description: description.trim() || null,
      website: website.trim() || null,
      instagram: instagram.trim() || null,
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
    .select("id, name, cuisine, description, website, instagram, phone, tagline, service_areas, today_specials")
    .eq("email", user.email)
    .single()

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
                  Changes apply to your public directory profile and dashboard.
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

                  <div className="space-y-2">
                    <Label htmlFor="cuisine">Cuisine Type</Label>
                    <Input
                      id="cuisine"
                      name="cuisine"
                      type="text"
                      defaultValue={truck.cuisine ?? ""}
                      placeholder="e.g. Mexican, BBQ, Desserts"
                    />
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
