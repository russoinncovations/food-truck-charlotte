
import { Metadata } from "next"
import Link from "next/link"
import { revalidatePath } from "next/cache"
import { redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import { Header } from "@/components/header"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"

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

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
}

async function approveVendor(formData: FormData) {
  "use server"
  const applicationId = formData.get("applicationId") as string | null
  const adminKey = ((formData.get("adminKey") as string | null) ?? "").trim()
  if (!applicationId) return

  const businessName = ((formData.get("appBusinessName") as string | null) ?? "").trim()
  const email = ((formData.get("appEmail") as string | null) ?? "").trim()
  const phone = ((formData.get("appPhone") as string | null) ?? "").trim()
  const website = ((formData.get("appWebsite") as string | null) ?? "").trim()
  const instagram = ((formData.get("appInstagram") as string | null) ?? "").trim()
  const vendorDescription = ((formData.get("appDescription") as string | null) ?? "").trim()
  const baseCity = ((formData.get("appBaseCity") as string | null) ?? "").trim()
  const cuisineTypes = formData.getAll("cuisine_types").map(String).filter(Boolean)
  const cuisineDisplay =
    cuisineTypes.length > 0
      ? cuisineTypes.join(", ")
      : ((formData.get("appCuisineFallback") as string | null) ?? "General")

  const supabase = await createClient()

  if (email.length > 0) {
    const { data: dupByEmail } = await supabase.from("trucks").select("id").ilike("email", email).maybeSingle()
    if (dupByEmail) {
      redirect(`/admin/vendors?key=${encodeURIComponent(adminKey)}&duplicate=1`)
    }
  }

  if (businessName.length > 0) {
    const { data: dupByName } = await supabase.from("trucks").select("id").ilike("name", businessName).maybeSingle()
    if (dupByName) {
      redirect(`/admin/vendors?key=${encodeURIComponent(adminKey)}&duplicate=1`)
    }
  }

  let slug = slugFromBusinessName(businessName || undefined)

  const { data: existingSlug } = await supabase.from("trucks").select("id").eq("slug", slug).maybeSingle()
  if (existingSlug) {
    slug = `${slug}-${applicationId.slice(0, 8)}`
  }

  const insertPayload: Record<string, unknown> = {
    name: businessName || "Unnamed",
    slug,
    email: email || null,
    phone: phone || null,
    website: website || null,
    instagram: instagram || null,
    description: vendorDescription || null,
    cuisine: cuisineDisplay,
    cuisine_types: cuisineTypes.length > 0 ? cuisineTypes : ["General"],
    base_city: baseCity || null,
    show_in_directory: true,
    status: "active",
    is_active: true,
    source_application_id: applicationId,
  }

  const { data: inserted, error: insertError } = await supabase
    .from("trucks")
    .insert(insertPayload)
    .select("id")
    .maybeSingle()

  if (insertError || !inserted?.id) {
    return
  }

  await supabase
    .from("vendor_applications")
    .update({
      status: "approved",
      approved_truck_id: inserted.id as string,
    })
    .eq("id", applicationId)

  const resendKey = process.env.RESEND_API_KEY
  const from =
    process.env.RESEND_FROM_EMAIL?.trim() || "FoodTruck CLT <noreply@foodtruckclt.com>"
  const toEmail = email.trim()
  const truckNameForEmail = businessName || "there"

  if (resendKey && toEmail) {
    try {
      const { Resend } = await import("resend")
      const resend = new Resend(resendKey)
      const safeName = escapeHtml(truckNameForEmail)
      await resend.emails.send({
        from,
        to: toEmail,
        subject: "You're live on FoodTruckCLT",
        html: `
<p>Hi ${safeName},</p>
<p>You're now live on FoodTruckCLT.</p>
<p><strong>Quick setup:</strong></p>
<ol>
  <li>Log in: <a href="https://www.foodtruckclt.com/vendor-login">https://www.foodtruckclt.com/vendor-login</a></li>
  <li>Complete your profile (menu, photos, contact info)</li>
  <li>When you're out serving, drop your location on the map so people can find you in real time</li>
</ol>
<p><strong>Optional:</strong></p>
<ul>
  <li>Add upcoming events</li>
  <li>Respond to booking requests from your dashboard</li>
</ul>
<p>Questions? Just reply to this email.</p>
<p>– FoodTruckCLT</p>
`,
      })
    } catch (e) {
      console.error("[admin/vendors] Resend onboarding email failed:", e)
    }
  }

  revalidatePath("/admin/vendors")
  revalidatePath("/admin/bookings")
  revalidatePath("/admin")
  revalidatePath("/trucks")
}

async function rejectVendor(formData: FormData) {
  "use server"
  const applicationId = formData.get("applicationId") as string | null
  if (!applicationId) return

  const supabase = await createClient()
  await supabase.from("vendor_applications").update({ status: "rejected" }).eq("id", applicationId)

  revalidatePath("/admin/vendors")
  revalidatePath("/admin/bookings")
  revalidatePath("/admin")
}

function formatSubmitted(iso: unknown): string {
  if (typeof iso !== "string") return "—"
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return "—"
  return d.toLocaleString("en-US", { dateStyle: "medium", timeStyle: "short" })
}

function cuisineLabel(app: Record<string, unknown>): string {
  const types = app.cuisine_types as string[] | null | undefined
  if (types && types.length > 0) return types.join(", ")
  return "—"
}

function locationLabel(app: Record<string, unknown>): string {
  const city = app.base_city as string | null | undefined
  const areas = app.service_areas as string[] | null | undefined
  if (city?.trim()) return city.trim()
  if (areas && areas.length > 0) return areas.join(", ")
  return "—"
}

export default async function AdminVendorsPage({
  searchParams,
}: {
  searchParams: Promise<{ key?: string; duplicate?: string }>
}) {
  const params = await searchParams
  const key = params?.key
  const duplicateNotice = params?.duplicate === "1"
  const adminKey = process.env.ADMIN_KEY ?? "7985"
  if (key !== adminKey) {
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
  const keyQ = `?key=${encodeURIComponent(key ?? "")}`

  return (
    <div className="min-h-screen bg-muted/30">
      <Header />

      <main className="pt-24 pb-16">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <h1 className="font-display text-2xl sm:text-3xl font-bold text-foreground">
                Vendor applications
              </h1>
              <p className="mt-1 text-muted-foreground text-sm">
                Approve listings to create directory trucks — no manual copy/paste.
              </p>
            </div>
            <Button variant="outline" size="sm" asChild>
              <Link href={`/admin/bookings${keyQ}`}>Booking admin</Link>
            </Button>
          </div>

          {duplicateNotice ? (
            <div className="mb-6 rounded-lg border border-destructive/40 bg-destructive/10 px-4 py-3 text-sm text-destructive">
              Truck may already exist
            </div>
          ) : null}

          <Card className="border-primary/20">
            <CardHeader>
              <CardTitle className="text-lg">Pending applications</CardTitle>
              <CardDescription>
                Rows with status <Badge variant="outline">pending</Badge>. Approve creates a public truck listing;
                reject archives the application without creating a truck.
              </CardDescription>
            </CardHeader>
            <CardContent>
              {list.length === 0 ? (
                <p className="text-sm text-muted-foreground">No pending applications.</p>
              ) : (
                <div className="overflow-x-auto rounded-md border border-border">
                  <table className="w-full text-sm text-left">
                    <thead className="bg-muted/50 border-b">
                      <tr>
                        <th className="p-3 font-medium whitespace-nowrap">Business / truck</th>
                        <th className="p-3 font-medium whitespace-nowrap">Contact</th>
                        <th className="p-3 font-medium whitespace-nowrap">Email</th>
                        <th className="p-3 font-medium whitespace-nowrap">Phone</th>
                        <th className="p-3 font-medium min-w-[140px]">Cuisine</th>
                        <th className="p-3 font-medium min-w-[120px]">City / location</th>
                        <th className="p-3 font-medium whitespace-nowrap">Submitted</th>
                        <th className="p-3 font-medium whitespace-nowrap">Status</th>
                        <th className="p-3 font-medium whitespace-nowrap text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {list.map((app) => {
                        const id = String(app.id)
                        const businessName = (app.business_name as string | null | undefined) ?? ""
                        const contactName = (app.contact_name as string | null | undefined) ?? ""
                        const email = (app.email as string | null | undefined) ?? ""
                        const phone = (app.phone as string | null | undefined) ?? ""
                        const cuisineTypes = app.cuisine_types as string[] | null | undefined
                        const cuisineFallback =
                          cuisineTypes && cuisineTypes.length > 0 ? cuisineTypes[0] : "General"
                        const description = (app.vendor_description as string | null | undefined) ?? ""
                        const baseCity = ((app.base_city as string | null | undefined) ?? "").trim()

                        return (
                          <tr key={id} className="border-b border-border/60 last:border-0 align-top">
                            <td className="p-3 font-medium text-foreground max-w-[160px]">
                              {businessName || "—"}
                            </td>
                            <td className="p-3 text-muted-foreground whitespace-nowrap">{contactName || "—"}</td>
                            <td className="p-3 text-muted-foreground max-w-[180px] break-all">{email || "—"}</td>
                            <td className="p-3 text-muted-foreground whitespace-nowrap">{phone || "—"}</td>
                            <td className="p-3 text-muted-foreground">{cuisineLabel(app)}</td>
                            <td className="p-3 text-muted-foreground">{locationLabel(app)}</td>
                            <td className="p-3 text-muted-foreground whitespace-nowrap">
                              {formatSubmitted(app.created_at)}
                            </td>
                            <td className="p-3">
                              <Badge variant="secondary" className="font-normal">
                                pending
                              </Badge>
                            </td>
                            <td className="p-3">
                              <div className="flex flex-wrap justify-end gap-2">
                                <form action={approveVendor}>
                                  <input type="hidden" name="applicationId" value={id} />
                                  <input type="hidden" name="adminKey" value={key ?? ""} />
                                  <input type="hidden" name="appBusinessName" value={businessName} />
                                  <input type="hidden" name="appEmail" value={email} />
                                  <input type="hidden" name="appPhone" value={phone} />
                                  <input type="hidden" name="appWebsite" value={(app.website as string | null | undefined) ?? ""} />
                                  <input type="hidden" name="appInstagram" value={(app.instagram as string | null | undefined) ?? ""} />
                                  <input type="hidden" name="appDescription" value={description} />
                                  <input type="hidden" name="appBaseCity" value={baseCity} />
                                  <input type="hidden" name="appCuisineFallback" value={cuisineFallback} />
                                  {(cuisineTypes ?? []).map((t, idx) => (
                                    <input key={`${id}-ct-${idx}`} type="hidden" name="cuisine_types" value={t} />
                                  ))}
                                  <Button
                                    type="submit"
                                    size="sm"
                                    className="bg-green-600 text-white hover:bg-green-700"
                                  >
                                    Approve
                                  </Button>
                                </form>
                                <form action={rejectVendor}>
                                  <input type="hidden" name="applicationId" value={id} />
                                  <Button type="submit" size="sm" variant="destructive">
                                    Reject
                                  </Button>
                                </form>
                              </div>
                            </td>
                          </tr>
                        )
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  )
}
