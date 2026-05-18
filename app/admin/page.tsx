
import { Metadata } from "next"
import { revalidatePath } from "next/cache"
import { createClient } from "@/lib/supabase/server"
import { Header } from "@/components/header"
import { fetchAdminCommandCenterData } from "@/lib/admin/command-center-data"
import { AdminCommandCenter } from "@/components/admin/admin-command-center"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Truck } from "lucide-react"

export const metadata: Metadata = {
  title: "Admin | Food Truck CLT",
  description: "Admin dashboard — truck applications and shortcuts",
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

function truckName(app: Record<string, unknown>): string {
  const b = app.business_name ?? app.truck_name
  return typeof b === "string" ? b.trim() : ""
}

function ownerName(app: Record<string, unknown>): string {
  const n = app.contact_name ?? app.owner_name
  return typeof n === "string" ? n.trim() : ""
}

function cuisineDisplay(app: Record<string, unknown>): string {
  const types = app.cuisine_types as string[] | null | undefined
  if (types && types.length > 0) return types.join(", ")
  const ct = app.cuisine_type as string | null | undefined
  if (typeof ct === "string" && ct.trim()) return ct.trim()
  return "—"
}

function vendorDescription(app: Record<string, unknown>): string {
  const d = app.vendor_description ?? app.description
  return typeof d === "string" ? d : ""
}

async function approveTruckApplication(formData: FormData) {
  "use server"
  const applicationId = formData.get("applicationId") as string | null
  if (!applicationId) return

  const businessName =
    ((formData.get("appBusinessName") as string | null) ?? "").trim() ||
    ((formData.get("appTruckName") as string | null) ?? "").trim()
  const email = ((formData.get("appEmail") as string | null) ?? "").trim()
  const phone = ((formData.get("appPhone") as string | null) ?? "").trim()
  const website = ((formData.get("appWebsite") as string | null) ?? "").trim()
  const instagram = ((formData.get("appInstagram") as string | null) ?? "").trim()
  const vendorDescriptionVal = ((formData.get("appDescription") as string | null) ?? "").trim()
  const cuisine = ((formData.get("appCuisine") as string | null) ?? "").trim() || "General"

  const supabase = await createClient()
  let slug = slugFromBusinessName(businessName || undefined)

  const { data: existing } = await supabase.from("trucks").select("id").eq("slug", slug).maybeSingle()
  if (existing) {
    slug = `${slug}-${applicationId.slice(0, 8)}`
  }

  const { error: insertError } = await supabase.from("trucks").insert({
    name: businessName || "Unnamed",
    slug,
    email: email || null,
    phone: phone || null,
    website: website || null,
    instagram: instagram || null,
    description: vendorDescriptionVal || null,
    cuisine,
    show_in_directory: true,
    status: "active",
    is_active: true,
    source_application_id: applicationId,
  })

  if (insertError) return

  await supabase.from("vendor_applications").update({ status: "approved" }).eq("id", applicationId)

  revalidatePath("/admin")
  revalidatePath("/trucks")
}

async function rejectTruckApplication(formData: FormData) {
  "use server"
  const applicationId = formData.get("applicationId") as string | null
  if (!applicationId) return

  const supabase = await createClient()
  await supabase.from("vendor_applications").update({ status: "rejected" }).eq("id", applicationId)

  revalidatePath("/admin")
}

function formatAppliedAt(createdAt: unknown): string {
  if (typeof createdAt !== "string") return "—"
  const d = new Date(createdAt)
  if (Number.isNaN(d.getTime())) return "—"
  return d.toLocaleDateString("en-US", { dateStyle: "medium" })
}

export default async function AdminDashboardPage({
  searchParams,
}: {
  searchParams: Promise<{ key?: string }>
}) {
  const key = (await searchParams)?.key
  const adminKey = process.env.ADMIN_KEY ?? "7985"
  if (key !== adminKey) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-muted-foreground">Page not found.</p>
      </div>
    )
  }

  const keyQ = `?key=${encodeURIComponent(key ?? "")}`
  const commandData = await fetchAdminCommandCenterData(key ?? "")

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
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <AdminCommandCenter keyQ={keyQ} data={commandData} />

          <Card className="border-primary/20">
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Truck className="h-5 w-5 text-primary" />
                Truck Applications
              </CardTitle>
              <CardDescription>
                Applications with status pending. Approve to add a truck to the directory; reject to decline.
              </CardDescription>
            </CardHeader>
            <CardContent>
              {list.length === 0 ? (
                <p className="text-sm text-muted-foreground">No pending truck applications.</p>
              ) : (
                <div className="overflow-x-auto rounded-md border border-border">
                  <table className="w-full text-sm text-left">
                    <thead className="bg-muted/50 border-b">
                      <tr>
                        <th className="p-3 font-medium whitespace-nowrap">Truck name</th>
                        <th className="p-3 font-medium whitespace-nowrap">Owner name</th>
                        <th className="p-3 font-medium whitespace-nowrap">Email</th>
                        <th className="p-3 font-medium">Cuisine type</th>
                        <th className="p-3 font-medium whitespace-nowrap">Date applied</th>
                        <th className="p-3 font-medium whitespace-nowrap text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {list.map((app) => {
                        const id = String(app.id)
                        const nameStr = truckName(app)
                        const ownerStr = ownerName(app)
                        const email = typeof app.email === "string" ? app.email.trim() : ""
                        const cuisineOne =
                          (Array.isArray(app.cuisine_types) && app.cuisine_types.length > 0
                            ? app.cuisine_types[0]
                            : typeof app.cuisine_type === "string"
                              ? app.cuisine_type
                              : null) ?? "General"
                        const desc = vendorDescription(app)
                        const phone = typeof app.phone === "string" ? app.phone : ""
                        const website = typeof app.website === "string" ? app.website : ""
                        const instagram = typeof app.instagram === "string" ? app.instagram : ""

                        return (
                          <tr key={id} className="border-b border-border/60 last:border-0 align-top">
                            <td className="p-3 font-medium text-foreground max-w-[180px]">
                              {nameStr || "—"}
                            </td>
                            <td className="p-3 text-muted-foreground whitespace-nowrap">
                              {ownerStr || "—"}
                            </td>
                            <td className="p-3 text-muted-foreground max-w-[200px] break-all">{email || "—"}</td>
                            <td className="p-3 text-muted-foreground">{cuisineDisplay(app)}</td>
                            <td className="p-3 text-muted-foreground whitespace-nowrap">
                              {formatAppliedAt(app.created_at)}
                            </td>
                            <td className="p-3">
                              <div className="flex flex-wrap justify-end gap-2">
                                <form action={approveTruckApplication}>
                                  <input type="hidden" name="applicationId" value={id} />
                                  <input type="hidden" name="appBusinessName" value={nameStr} />
                                  <input type="hidden" name="appTruckName" value={nameStr} />
                                  <input type="hidden" name="appEmail" value={email} />
                                  <input type="hidden" name="appPhone" value={phone} />
                                  <input type="hidden" name="appWebsite" value={website} />
                                  <input type="hidden" name="appInstagram" value={instagram} />
                                  <input type="hidden" name="appDescription" value={desc} />
                                  <input type="hidden" name="appCuisine" value={cuisineOne} />
                                  <Button
                                    type="submit"
                                    size="sm"
                                    className="bg-green-600 text-white hover:bg-green-700"
                                  >
                                    Approve
                                  </Button>
                                </form>
                                <form action={rejectTruckApplication}>
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
