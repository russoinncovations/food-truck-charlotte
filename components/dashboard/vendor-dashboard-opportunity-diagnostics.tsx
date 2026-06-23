import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import type { VendorOpportunityAuditRow } from "@/lib/dashboard/vendor-booking-opportunities"

const EXCLUSION_LABELS: Record<string, string> = {
  booking_not_embedded:
    "Booking details not embedded (RLS or missing booking_requests row for this opportunity).",
  booking_terminal_status: "Booking request status is closed/fulfilled — excluded from active list.",
  internal_test_hidden: "Internal test booking hidden from non-demo trucks.",
  not_pending_status: "Opportunity status is not pending.",
}

export function VendorDashboardOpportunityDiagnostics(props: {
  authEmail: string
  truckId: string
  truckEmail: string | null
  rawPendingCount: number
  activePendingCount: number
  pendingOpportunityIds: string[]
  audits: VendorOpportunityAuditRow[]
  resolutionNote: string | null
}) {
  const excluded = props.audits.filter((a) => !a.includedInActiveList)

  return (
    <Card className="border-amber-500/40 bg-amber-500/5">
      <CardHeader className="pb-2">
        <CardTitle className="text-base">Internal demo — booking visibility diagnostics</CardTitle>
        <CardDescription>
          Admin-safe debug panel for the FoodTruckCLT Demo Vendor only. Not shown to production vendors.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-3 text-xs font-mono">
        <dl className="grid gap-1 sm:grid-cols-2">
          <div>
            <dt className="text-muted-foreground">Auth email</dt>
            <dd className="text-foreground break-all">{props.authEmail || "—"}</dd>
          </div>
          <div>
            <dt className="text-muted-foreground">Truck ID</dt>
            <dd className="text-foreground break-all">{props.truckId}</dd>
          </div>
          <div>
            <dt className="text-muted-foreground">Trucks.email</dt>
            <dd className="text-foreground break-all">{props.truckEmail ?? "—"}</dd>
          </div>
          <div>
            <dt className="text-muted-foreground">Pending (raw → active)</dt>
            <dd className="text-foreground tabular-nums">
              {props.rawPendingCount} → {props.activePendingCount}
            </dd>
          </div>
        </dl>
        {props.resolutionNote ? (
          <p className="text-amber-800 dark:text-amber-200">{props.resolutionNote}</p>
        ) : null}
        {props.pendingOpportunityIds.length > 0 ? (
          <div>
            <p className="text-muted-foreground mb-1">Active pending opportunity IDs</p>
            <ul className="space-y-0.5 break-all">
              {props.pendingOpportunityIds.map((id) => (
                <li key={id}>{id}</li>
              ))}
            </ul>
          </div>
        ) : null}
        {excluded.length > 0 ? (
          <div className="space-y-2 pt-2 border-t border-amber-500/20">
            <p className="text-muted-foreground font-sans text-sm font-medium">
              Excluded pending opportunities
            </p>
            {excluded.map((audit) => (
              <div key={audit.opportunityId} className="rounded border border-border/80 p-2 space-y-1">
                <p className="break-all">{audit.opportunityId}</p>
                <p className="text-muted-foreground">
                  opp={audit.opportunityStatus} · booking={audit.bookingStatus ?? "—"}
                </p>
                <div className="flex flex-wrap gap-1">
                  {audit.exclusionReasons.map((reason) => (
                    <Badge key={reason} variant="outline" className="font-sans font-normal text-[10px]">
                      {reason}
                    </Badge>
                  ))}
                </div>
                <ul className="font-sans text-[11px] text-muted-foreground list-disc pl-4">
                  {audit.exclusionReasons.map((reason) => (
                    <li key={reason}>{EXCLUSION_LABELS[reason] ?? reason}</li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        ) : null}
      </CardContent>
    </Card>
  )
}
