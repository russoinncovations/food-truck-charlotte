
import { Metadata } from "next"
import { revalidatePath } from "next/cache"
import { createClient } from "@/lib/supabase/server"
import { Header } from "@/components/header"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

export const metadata: Metadata = {
  title: "Vendor Applications | Admin | Food Truck CLT",
  description: "Review and approve vendor applications",
}

function slugFromBusinessName(name: string | null | undefined): string {
  if (!name) return "truck"
  const s = name
    .toLowerCase()
    .trim()
    .replace(/\s+/g, "-")
    .replace(/[^a-z0-9-]/g, "")
    .replace(/-+/g, "-")
    .replace(/^-+|-+$/g, "")
  return s || "truck"
}

async function approveVendor(formData: FormData) {
  "use server"
  const applicationId = formData.get("applicationId") as string | null
  if (!applicationId) return

  const businessName = (formData.get("appBusinessName") as string | null) ?? ""
  const email = (formData.get("appEmail") as string | null) ?? ""
  const phone = (formData.get("appPhone") as string | null) ?? ""
  const website = (formData.get("appWebsite") as string | null) ?? ""
  const instagram = (formData.get("appInstagram") as string | null) ?? ""
  const vendorDescription = (formData.get("appDescription") as string | null) ?? ""
  const cuisine = (formData.get("appCuisine") as string | null) ?? "General"

  const supabase = await createClient()
  let slug = slugFromBusinessName(businessName || undefined)

  const { data: existing } = await supabase.from("trucks").select("id").eq("slug", slug).maybeSingle()
  if (existing) {
    slug = `${slug}-${applicationId.slice(0, 8)}`
  }

  const { error: insertError } = await supabase.from("trucks").insert({
    name: businessName.trim() || "Unnamed",
    slug,
    email: email.trim() || null,
    phone: phone.trim() || null,
    website: website.trim() || null,
    instagram: instagram.trim() || null,
    description: vendorDescription.trim() || null,
    cuisine,
    show_in_directory: true,
    status: "active",
    is_active: true,
  })

  if (insertError) return

  await supabase.from("vendor_applications").update({ status: "approved" }).eq("id", applicationId)

  revalidatePath("/admin/vendors")
}

async function rejectVendor(formData: FormData) {
  "use server"
  const applicationId = formData.get("applicationId") as string | null
  if (!applicationId) return

  const supabase = await createClient()
  await supabase.from("vendor_applications").update({ status: "rejected" }).eq("id", applicationId)

  revalidatePath("/admin/vendors")
}

export default async function AdminVendorsPage({
  searchParams,
}: {
  searchParams: Promise<{ key?: string }>
}) {
  const key = (await searchParams)?.key
  if (key !== process.env.ADMIN_KEY) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-muted-foreground">Page not found.</p>
      </div>
    )
  }

  const supabase = await createClient()
  const { data: applications } = await supabase
    .from("vendor_applications")
    .select("*")
    .eq("status", "pending")
    .order("created_at", { ascending: false })

  const list = (applications ?? []) as Record<string, unknown>[]

  return (
    <div className="min-h-screen bg-muted/30">
      <Header />

      <main className="pt-24 pb-16">
        <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8">
          <h1 className="font-display text-2xl sm:text-3xl font-bold text-foreground mb-8">
            Vendor Applications
          </h1>

          {list.length === 0 ? (
            <p className="text-muted-foreground">No pending applications</p>
          ) : (
            <ul className="space-y-6">
              {list.map((app) => {
                const id = String(app.id)
                const businessName = (app.business_name as string | null | undefined) ?? ""
                const contactName = (app.contact_name as string | null | undefined) ?? "—"
                const email = (app.email as string | null | undefined) ?? ""
                const cuisineTypes = app.cuisine_types as string[] | null | undefined
                const cuisineLabel =
                  cuisineTypes && cuisineTypes.length > 0 ? cuisineTypes.join(", ") : "—"
                const description = (app.vendor_description as string | null | undefined) ?? ""

                return (
                  <li key={id}>
                    <Card>
                      <CardHeader>
                        <CardTitle className="text-lg">{businessName || "—"}</CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-3 text-sm">
                        <p>
                          <span className="font-medium text-foreground">Contact:</span> {contactName}
                        </p>
                        <p>
                          <span className="font-medium text-foreground">Email:</span> {email || "—"}
                        </p>
                        <p>
                          <span className="font-medium text-foreground">Cuisine types:</span>{" "}
                          {cuisineLabel}
                        </p>
                        <p>
                          <span className="font-medium text-foreground">Description:</span>{" "}
                          <span className="text-muted-foreground whitespace-pre-wrap">
                            {description || "—"}
                          </span>
                        </p>
                        <div className="flex flex-wrap gap-3 pt-2">
                          <form action={approveVendor}>
                            <input type="hidden" name="applicationId" value={id} />
                            <input type="hidden" name="appBusinessName" value={businessName} />
                            <input type="hidden" name="appEmail" value={email} />
                            <input
                              type="hidden"
                              name="appPhone"
                              value={(app.phone as string | null | undefined) ?? ""}
                            />
                            <input
                              type="hidden"
                              name="appWebsite"
                              value={(app.website as string | null | undefined) ?? ""}
                            />
                            <input
                              type="hidden"
                              name="appInstagram"
                              value={(app.instagram as string | null | undefined) ?? ""}
                            />
                            <input type="hidden" name="appDescription" value={description} />
                            <input
                              type="hidden"
                              name="appCuisine"
                              value={cuisineTypes?.[0] ?? "General"}
                            />
                            <Button
                              type="submit"
                              className="bg-green-600 text-white hover:bg-green-700"
                            >
                              Approve
                            </Button>
                          </form>
                          <form action={rejectVendor}>
                            <input type="hidden" name="applicationId" value={id} />
                            <Button type="submit" variant="destructive">
                              Reject
                            </Button>
                          </form>
                        </div>
                      </CardContent>
                    </Card>
                  </li>
                )
              })}
            </ul>
          )}
        </div>
      </main>
    </div>
  )
}
