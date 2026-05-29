import { Metadata } from "next"
import Link from "next/link"
import { Header } from "@/components/header"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { VendorStatusAuditClient } from "@/components/admin/vendor-status-audit-client"
import { fetchVendorStatusAudit } from "@/lib/admin/vendor-status-audit"
import { ClipboardList, ChevronLeft } from "lucide-react"

export const metadata: Metadata = {
  title: "Vendor Status Audit | Admin | Food Truck CLT",
  description: "Diagnose vendor listing, map visibility, and dashboard connection issues",
}

export default async function AdminVendorStatusAuditPage({
  searchParams,
}: {
  searchParams: Promise<{ key?: string; q?: string }>
}) {
  const params = await searchParams
  const key = params?.key
  const initialQuery = params?.q?.trim() ?? ""
  const adminKey = process.env.ADMIN_KEY ?? "7985"

  if (key !== adminKey) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-muted-foreground">Page not found.</p>
      </div>
    )
  }

  const keyQ = `?key=${encodeURIComponent(key ?? "")}`
  const { groups, summary } = await fetchVendorStatusAudit(`/admin/vendors${keyQ}`)

  return (
    <div className="min-h-screen bg-muted/30">
      <Header />

      <main className="pt-24 pb-16">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div
            className="mb-6 rounded-lg border border-primary/30 bg-primary/5 px-4 py-3 text-sm"
            data-audit-deploy-marker="grouped-audit-v2"
          >
            <p className="font-semibold tracking-wide text-foreground">GROUPED AUDIT V2 ACTIVE</p>
            <dl className="mt-2 grid gap-x-6 gap-y-1 text-xs text-muted-foreground sm:grid-cols-2 lg:grid-cols-4">
              <div>
                <dt className="inline">Total groups: </dt>
                <dd className="inline font-medium tabular-nums text-foreground">{summary.totalGroups}</dd>
              </div>
              <div>
                <dt className="inline">Primary truck groups: </dt>
                <dd className="inline font-medium tabular-nums text-foreground">{summary.truckRows}</dd>
              </div>
              <div>
                <dt className="inline">Application-only groups: </dt>
                <dd className="inline font-medium tabular-nums text-foreground">{summary.applicationOnlyRecords}</dd>
              </div>
              <div>
                <dt className="inline">Historical linked applications: </dt>
                <dd className="inline font-medium tabular-nums text-foreground">
                  {summary.historicalApplicationRecords}
                </dd>
              </div>
            </dl>
          </div>

          <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <div className="flex items-center gap-2 text-sm text-muted-foreground mb-2">
                <Button variant="ghost" size="sm" className="h-8 px-2 -ml-2" asChild>
                  <Link href={`/admin${keyQ}`}>
                    <ChevronLeft className="h-4 w-4 mr-1" />
                    Command center
                  </Link>
                </Button>
              </div>
              <h1 className="font-display text-2xl sm:text-3xl font-bold text-foreground flex items-center gap-2">
                <ClipboardList className="h-8 w-8 text-primary shrink-0" />
                Vendor visibility audit
              </h1>
              <p className="mt-1 text-sm text-muted-foreground max-w-3xl">
                Search a truck or vendor email to see directory listing, live map eligibility, dashboard connection, and
                issue flags. Map pins require public listing +{" "}
                <code className="text-xs">serving_today</code> + valid Charlotte-area coordinates.
              </p>
            </div>
            <div className="flex flex-wrap gap-2">
              <Button variant="outline" size="sm" asChild>
                <Link href={`/admin/vendors${keyQ}`}>Vendor applications</Link>
              </Button>
              <Button variant="outline" size="sm" asChild>
                <Link href={`/map`} target="_blank" rel="noopener noreferrer">
                  Live map
                </Link>
              </Button>
            </div>
          </div>

          <Card className="border-border mb-8">
            <CardHeader>
              <CardTitle className="text-lg">How to read this audit</CardTitle>
              <CardDescription className="text-sm space-y-2">
                <p>
                  <strong className="text-foreground">Visible on directory</strong> —{" "}
                  <code className="text-xs">show_in_directory</code>, <code className="text-xs">is_active</code>,{" "}
                  <code className="text-xs">status=active</code>, and legacy <code className="text-xs">active</code>{" "}
                  pass.
                </p>
                <p>
                  <strong className="text-foreground">Map pin now</strong> — listed + currently serving + valid lat/lng
                  (same rules as the public live map).
                </p>
                <p>
                  <strong className="text-foreground">Go Live dashboard</strong> — vendor can sign in if{" "}
                  <code className="text-xs">trucks.email</code> matches their login email; auth user id shown when
                  discoverable via service role.
                </p>
              </CardDescription>
            </CardHeader>
            <CardContent>
              <VendorStatusAuditClient groups={groups} summary={summary} initialQuery={initialQuery} />
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  )
}
