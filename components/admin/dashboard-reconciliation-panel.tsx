"use client"

import { useState, useTransition } from "react"
import Link from "next/link"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  RECONCILIATION_CATEGORY_LABELS,
  type DashboardReconciliationReport,
  type DashboardReconciliationRow,
  type ReconciliationApplyResult,
} from "@/lib/admin/fetch-dashboard-opportunity-reconciliation"
import type { RecheckOpportunityResult } from "@/lib/admin/fetch-dashboard-opportunity-reconciliation"
import {
  recheckDashboardOpportunityVisibility,
  reconcileHistoricalPendingOpportunities,
} from "@/app/admin/bookings/dashboard-reconciliation-actions"

type Props = {
  adminKey: string
  keyQ: string
  report: DashboardReconciliationReport
}

function formatTs(iso: string | null): string {
  if (!iso) return "—"
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return iso
  return d.toLocaleString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  })
}

function categoryBadgeVariant(
  category: DashboardReconciliationRow["category"]
): "secondary" | "destructive" | "outline" {
  if (category === "visible_healthy") return "secondary"
  if (category === "needs_manual_review" || category === "identity_email_mismatch") return "destructive"
  return "outline"
}

export function DashboardReconciliationPanel({ adminKey, keyQ, report }: Props) {
  const [pending, startTransition] = useTransition()
  const [applyResult, setApplyResult] = useState<ReconciliationApplyResult | null>(null)
  const [recheckResults, setRecheckResults] = useState<Record<string, RecheckOpportunityResult>>({})
  const [message, setMessage] = useState<string | null>(null)

  const scopedRows = report.rows.filter((r) => r.inAuditScope)

  function runReconcile(dryRun: boolean) {
    setMessage(null)
    const fd = new FormData()
    fd.set("adminKey", adminKey)
    fd.set("dryRun", dryRun ? "true" : "false")
    startTransition(async () => {
      const res = await reconcileHistoricalPendingOpportunities(fd)
      if (!res.ok) {
        setMessage(res.error ?? "Reconciliation failed")
        return
      }
      setApplyResult(res.result ?? null)
      setMessage(
        dryRun
          ? `Dry-run preview: ${res.result?.proposedFixCount ?? 0} fix(es) proposed.`
          : `Applied ${res.result?.appliedCount ?? 0} fix(es); skipped ${res.result?.skippedCount ?? 0}.`
      )
    })
  }

  function runRecheck(opportunityId: string) {
    const fd = new FormData()
    fd.set("adminKey", adminKey)
    fd.set("opportunityId", opportunityId)
    startTransition(async () => {
      const res = await recheckDashboardOpportunityVisibility(fd)
      if (!res.ok || !res.result || "error" in res.result) {
        setMessage(res.error ?? "Recheck failed")
        return
      }
      setRecheckResults((prev) => ({ ...prev, [opportunityId]: res.result as RecheckOpportunityResult }))
    })
  }

  return (
    <div className="space-y-6">
      {report.summary.fetchError ? (
        <p className="text-destructive text-sm">{report.summary.fetchError}</p>
      ) : null}

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4 text-sm">
        <div className="rounded-lg border p-3">
          <p className="text-muted-foreground text-xs">Pending fetched</p>
          <p className="text-2xl font-semibold tabular-nums">{report.summary.totalPendingFetched}</p>
        </div>
        <div className="rounded-lg border p-3">
          <p className="text-muted-foreground text-xs">In audit scope</p>
          <p className="text-2xl font-semibold tabular-nums">{report.summary.inAuditScopeCount}</p>
        </div>
        <div className="rounded-lg border p-3">
          <p className="text-muted-foreground text-xs">Dashboard visible</p>
          <p className="text-2xl font-semibold tabular-nums text-emerald-700 dark:text-emerald-400">
            {report.summary.visibleCount}
          </p>
        </div>
        <div className="rounded-lg border p-3">
          <p className="text-muted-foreground text-xs">Not visible</p>
          <p className="text-2xl font-semibold tabular-nums text-destructive">{report.summary.notVisibleCount}</p>
        </div>
      </div>

      <div className="rounded-lg border p-4 space-y-2">
        <p className="font-medium text-sm">By category (in audit scope)</p>
        <ul className="grid sm:grid-cols-2 gap-1 text-xs">
          {(Object.entries(report.summary.byCategory) as [keyof typeof report.summary.byCategory, number][]).map(
            ([cat, n]) => (
              <li key={cat} className="flex justify-between gap-2">
                <span className="text-muted-foreground">{RECONCILIATION_CATEGORY_LABELS[cat]}</span>
                <span className="font-medium tabular-nums">{n}</span>
              </li>
            )
          )}
        </ul>
      </div>

      <div className="flex flex-wrap gap-2 items-center">
        <Button type="button" size="sm" variant="outline" disabled={pending} onClick={() => runReconcile(true)}>
          {pending ? "Running…" : "Dry-run reconcile preview"}
        </Button>
        <Button type="button" size="sm" disabled={pending} onClick={() => runReconcile(false)}>
          Apply safe reconciliation fixes
        </Button>
        <p className="text-xs text-muted-foreground w-full">
          Read-only recheck per row below. Bulk apply only normalizes non-lowercase pending status — no emails, no
          notification audit changes, no duplicate rows.
        </p>
        {message ? <p className="text-xs text-muted-foreground w-full">{message}</p> : null}
      </div>

      {applyResult && applyResult.logs.length > 0 ? (
        <div className="rounded-lg border p-4 space-y-2 text-xs">
          <p className="font-medium text-sm">
            {applyResult.dryRun ? "Dry-run log" : "Apply log"} ({applyResult.proposedFixCount} proposed)
          </p>
          <ul className="space-y-2 max-h-48 overflow-y-auto">
            {applyResult.logs.map((log) => (
              <li key={`${log.opportunityId}-${log.before}`} className="border-b border-border/50 pb-2 last:border-0">
                <span className="font-mono">{log.opportunityId.slice(0, 8)}…</span> — {log.fixType}:{" "}
                <code>{log.before}</code> → <code>{log.after}</code> — visible {String(log.visibleBefore)} →{" "}
                {String(log.visibleAfter)}
                {log.error ? <span className="text-destructive block">{log.error}</span> : null}
              </li>
            ))}
          </ul>
        </div>
      ) : null}

      <div className="overflow-x-auto rounded-lg border">
        <table className="w-full text-left text-xs">
          <thead className="bg-muted/50 border-b">
            <tr>
              <th className="p-2 font-medium">Booking</th>
              <th className="p-2 font-medium">Event</th>
              <th className="p-2 font-medium">Host</th>
              <th className="p-2 font-medium">Truck</th>
              <th className="p-2 font-medium">Created</th>
              <th className="p-2 font-medium">Notification</th>
              <th className="p-2 font-medium">Visible</th>
              <th className="p-2 font-medium">Category</th>
              <th className="p-2 font-medium">Actions</th>
            </tr>
          </thead>
          <tbody>
            {scopedRows.length === 0 ? (
              <tr>
                <td colSpan={9} className="p-6 text-center text-muted-foreground">
                  No pending opportunities in audit scope.
                </td>
              </tr>
            ) : (
              scopedRows.map((row) => {
                const recheck = recheckResults[row.opportunityId]
                const visible = recheck?.visibleInRequestsToConfirm ?? row.visibleInRequestsToConfirm
                return (
                  <tr key={row.opportunityId} className="border-b border-border/60 align-top last:border-0">
                    <td className="p-2">
                      {row.bookingRequestId ? (
                        <Link
                          href={`/admin/bookings/${row.bookingRequestId}${keyQ}`}
                          className="text-primary hover:underline font-mono"
                        >
                          {row.bookingRequestId.slice(0, 8)}…
                        </Link>
                      ) : (
                        "—"
                      )}
                    </td>
                    <td className="p-2 whitespace-nowrap">{row.eventDate ?? "—"}</td>
                    <td className="p-2 max-w-[120px]">
                      <div>{row.hostName ?? "—"}</div>
                      <div className="text-muted-foreground break-all">{row.hostEmail ?? ""}</div>
                    </td>
                    <td className="p-2 max-w-[140px]">
                      <div className="font-medium">{row.truckName ?? "—"}</div>
                      <div className="font-mono text-[10px] text-muted-foreground break-all">{row.truckId ?? ""}</div>
                      <div className="break-all">{row.canonicalTruckEmail ?? row.truckEmail ?? "—"}</div>
                    </td>
                    <td className="p-2 whitespace-nowrap tabular-nums">{formatTs(row.opportunityCreatedAt)}</td>
                    <td className="p-2">
                      <div>{row.notificationStatus ?? "—"}</div>
                      <div className="text-muted-foreground">{row.notificationTrackingKind}</div>
                    </td>
                    <td className="p-2">
                      <Badge variant={visible ? "secondary" : "destructive"} className="font-normal">
                        {visible ? "Yes" : "No"}
                      </Badge>
                      <div className="text-muted-foreground mt-1">{row.expectedSection}</div>
                      {!visible && row.exclusionReasons.length > 0 ? (
                        <ul className="mt-1 text-[10px] text-destructive list-disc pl-3 max-w-[180px]">
                          {row.exclusionReasons.map((r) => (
                            <li key={r}>{r}</li>
                          ))}
                        </ul>
                      ) : null}
                      {recheck ? (
                        <p className="mt-1 text-[10px] text-muted-foreground">
                          Recheck: {recheck.expectedSection} / {recheck.category}
                        </p>
                      ) : null}
                    </td>
                    <td className="p-2">
                      <Badge variant={categoryBadgeVariant(row.category)} className="font-normal text-[10px]">
                        {RECONCILIATION_CATEGORY_LABELS[row.category]}
                      </Badge>
                    </td>
                    <td className="p-2">
                      <Button
                        type="button"
                        size="sm"
                        variant="ghost"
                        className="h-7 text-[11px]"
                        disabled={pending}
                        onClick={() => runRecheck(row.opportunityId)}
                      >
                        Recheck visibility
                      </Button>
                    </td>
                  </tr>
                )
              })
            )}
          </tbody>
        </table>
      </div>

      {report.rows.some((r) => !r.inAuditScope) ? (
        <details className="text-xs text-muted-foreground">
          <summary className="cursor-pointer font-medium text-foreground">
            Out of audit scope ({report.rows.filter((r) => !r.inAuditScope).length})
          </summary>
          <ul className="mt-2 space-y-1 list-disc pl-4">
            {report.rows
              .filter((r) => !r.inAuditScope)
              .map((r) => (
                <li key={r.opportunityId}>
                  {r.opportunityId.slice(0, 8)}… — {r.auditScopeNote}
                </li>
              ))}
          </ul>
        </details>
      ) : null}
    </div>
  )
}
