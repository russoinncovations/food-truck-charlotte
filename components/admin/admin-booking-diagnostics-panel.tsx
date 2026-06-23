"use client"

import { useState, useTransition } from "react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { createInternalTestBooking } from "@/app/admin/bookings/internal-test-actions"
import type { BookingAdminDiagnostics } from "@/lib/admin/fetch-booking-admin-diagnostics"

type Props = {
  adminKey: string
  keyQ: string
  diagnostics: BookingAdminDiagnostics
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

export function AdminBookingDiagnosticsPanel({ adminKey, keyQ, diagnostics }: Props) {
  const [pending, startTransition] = useTransition()
  const [testMessage, setTestMessage] = useState<string | null>(null)
  const [testBookingId, setTestBookingId] = useState<string | null>(null)

  function runInternalTest(mode: "specific" | "open") {
    setTestMessage(null)
    setTestBookingId(null)
    const fd = new FormData()
    fd.set("adminKey", adminKey)
    fd.set("mode", mode)
    startTransition(async () => {
      const result = await createInternalTestBooking(fd)
      if (result.ok && result.bookingId) {
        setTestBookingId(result.bookingId)
        setTestMessage("Internal test booking created.")
      } else {
        setTestMessage(result.error ?? "Could not create test booking.")
      }
    })
  }

  return (
    <div className="rounded-lg border border-amber-500/30 bg-amber-500/5 p-4 space-y-4 text-sm">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="font-medium text-foreground">Booking pipeline diagnostics</p>
          <p className="text-xs text-muted-foreground mt-1 max-w-2xl">
            Raw reads from <code className="text-[11px]">booking_requests</code> (ignores dashboard
            filters). Public submissions use{" "}
            <code className="text-[11px]">app/actions/submitBookingRequest.ts</code> →{" "}
            <code className="text-[11px]">completeBookingRequest</code>.
          </p>
        </div>
        <Badge variant={diagnostics.usedServiceRole ? "secondary" : "destructive"} className="font-normal">
          {diagnostics.usedServiceRole ? "Service role connected" : "No service role"}
        </Badge>
      </div>

      {diagnostics.envHints.length > 0 ? (
        <ul className="text-xs text-amber-900 dark:text-amber-100 space-y-1">
          {diagnostics.envHints.map((hint) => (
            <li key={hint}>• {hint}</li>
          ))}
        </ul>
      ) : null}

      {diagnostics.loadError ? (
        <p className="text-destructive text-sm">{diagnostics.loadError}</p>
      ) : (
        <p className="text-muted-foreground text-xs">
          Total rows in <code className="text-[11px]">booking_requests</code>:{" "}
          <span className="font-medium text-foreground tabular-nums">
            {diagnostics.tableRowCount ?? "—"}
          </span>
        </p>
      )}

      <div className="overflow-x-auto rounded-md border border-border bg-background">
        <table className="w-full text-left text-xs">
          <thead className="bg-muted/50 border-b">
            <tr>
              <th className="p-2 font-medium">Created</th>
              <th className="p-2 font-medium">Status</th>
              <th className="p-2 font-medium">Type</th>
              <th className="p-2 font-medium">Contact</th>
              <th className="p-2 font-medium">Opps</th>
              <th className="p-2 font-medium">Routing</th>
              <th className="p-2 font-medium" />
            </tr>
          </thead>
          <tbody>
            {diagnostics.latest.length === 0 ? (
              <tr>
                <td colSpan={7} className="p-4 text-center text-muted-foreground">
                  No rows returned from booking_requests.
                </td>
              </tr>
            ) : (
              diagnostics.latest.map((row) => (
                <tr key={row.id} className="border-b border-border/60 last:border-0 align-top">
                  <td className="p-2 whitespace-nowrap tabular-nums">{formatTs(row.created_at)}</td>
                  <td className="p-2">{row.status ?? "—"}</td>
                  <td className="p-2">
                    {row.request_type ?? "—"}
                    {row.isInternalTest ? (
                      <Badge variant="outline" className="ml-1 text-[10px] font-normal">
                        INTERNAL TEST
                      </Badge>
                    ) : null}
                  </td>
                  <td className="p-2 max-w-[140px] break-all">
                    <div>{row.contact_name ?? "—"}</div>
                    <div className="text-muted-foreground">{row.contact_email ?? ""}</div>
                  </td>
                  <td className="p-2 tabular-nums">{row.opportunityCount}</td>
                  <td className="p-2 max-w-[180px]">
                    {row.routingAttempted ? (
                      row.routingError ? (
                        <span className="text-destructive">{row.routingError}</span>
                      ) : (
                        <span className="text-muted-foreground">OK ({row.opportunityCount})</span>
                      )
                    ) : (
                      "—"
                    )}
                  </td>
                  <td className="p-2">
                    <Link
                      href={`/admin/bookings/${row.id}${keyQ}`}
                      className="text-primary hover:underline whitespace-nowrap"
                    >
                      Detail
                    </Link>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      <div className="border-t border-border/60 pt-4 space-y-2">
        <p className="font-medium text-foreground text-sm">Create internal test booking</p>
        <p className="text-xs text-muted-foreground max-w-2xl">
          Admin-only. Routes to the hidden FoodTruckCLT Demo Vendor (or open request including demo
          truck in broadcast). Uses test host email only — never visible on the public site.
        </p>
        <div className="flex flex-wrap gap-2">
          <Button
            type="button"
            size="sm"
            variant="outline"
            disabled={pending || !diagnostics.usedServiceRole}
            onClick={() => runInternalTest("specific")}
          >
            {pending ? "Creating…" : "INTERNAL TEST — specific demo vendor"}
          </Button>
          <Button
            type="button"
            size="sm"
            variant="outline"
            disabled={pending || !diagnostics.usedServiceRole}
            onClick={() => runInternalTest("open")}
          >
            {pending ? "Creating…" : "INTERNAL TEST — open request"}
          </Button>
        </div>
        {testMessage ? <p className="text-xs text-muted-foreground">{testMessage}</p> : null}
        {testBookingId ? (
          <Link href={`/admin/bookings/${testBookingId}${keyQ}`} className="text-xs text-primary hover:underline">
            Open test booking detail →
          </Link>
        ) : null}
      </div>
    </div>
  )
}
