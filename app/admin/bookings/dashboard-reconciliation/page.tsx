import { Metadata } from "next"
import Link from "next/link"
import { Header } from "@/components/header"
import { Button } from "@/components/ui/button"
import { ArrowLeft } from "lucide-react"
import { checkAdminPageAccess } from "@/lib/admin/verify-admin-key"
import { fetchDashboardOpportunityReconciliation } from "@/lib/admin/fetch-dashboard-opportunity-reconciliation"
import { DashboardReconciliationPanel } from "@/components/admin/dashboard-reconciliation-panel"

export const metadata: Metadata = {
  title: "Dashboard Reconciliation | Admin | Food Truck CLT",
  description: "Audit pending truck opportunities against vendor dashboard visibility rules.",
}

export default async function DashboardReconciliationPage({
  searchParams,
}: {
  searchParams: Promise<{ key?: string }>
}) {
  const key = (await searchParams)?.key
  const access = checkAdminPageAccess(key)
  if (!access.allowed) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-muted-foreground">
          {access.reason === "not_configured" ? "Admin access is not configured." : "Page not found."}
        </p>
      </div>
    )
  }

  const keyQ = `?key=${encodeURIComponent(key!)}`
  const report = await fetchDashboardOpportunityReconciliation()

  return (
    <div className="min-h-screen bg-muted/30">
      <Header />
      <main className="container max-w-7xl py-8 px-4 space-y-6">
        <div className="flex flex-wrap items-center gap-4">
          <Button variant="ghost" size="sm" asChild>
            <Link href={`/admin/bookings${keyQ}`}>
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to bookings
            </Link>
          </Button>
        </div>

        <div>
          <h1 className="font-display text-2xl font-bold">Vendor dashboard reconciliation</h1>
          <p className="text-sm text-muted-foreground mt-1 max-w-3xl">
            Evaluates every pending <code className="text-xs">truck_opportunity</code> using the same rules as{" "}
            <strong>Requests to Confirm</strong> on <code className="text-xs">/dashboard</code>. Does not send email or
            modify notification audit fields. Reviewed at {new Date(report.summary.reviewedAt).toLocaleString()}.
          </p>
        </div>

        <DashboardReconciliationPanel adminKey={key!} keyQ={keyQ} report={report} />
      </main>
    </div>
  )
}
