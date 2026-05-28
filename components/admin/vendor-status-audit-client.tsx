"use client"

import { useMemo, useState } from "react"
import Link from "next/link"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import { Input } from "@/components/ui/input"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import type { VendorStatusAuditRow, VendorStatusIssueFlag, VendorStatusAuditSummary } from "@/lib/admin/vendor-status-audit"
import { Copy, ExternalLink } from "lucide-react"

const ISSUE_LABELS: Record<VendorStatusIssueFlag, string> = {
  application_not_approved: "Application not approved",
  missing_vendor_email: "Missing vendor email",
  duplicate_email: "Duplicate email",
  duplicate_truck_name: "Duplicate truck name",
  no_slug: "No slug",
  hidden_from_directory: "Hidden / unlisted",
  missing_location: "Missing location fields",
  not_connected_to_vendor_account: "No auth account for email",
  not_map_eligible: "Not map eligible",
  no_recent_activity: "No recent activity (60d+)",
  missing_photo: "Missing photo",
  live_no_valid_coords: "Live but invalid coords",
  listed_inactive: "Listed flag but inactive status",
  blocked_by_rls: "Blocked by legacy active flag",
}

function fmtTime(iso: string | null): string {
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

function YesNo({ value }: { value: boolean }) {
  return (
    <span className={value ? "text-green-700 dark:text-green-400 font-medium" : "text-muted-foreground"}>
      {value ? "Yes" : "No"}
    </span>
  )
}

function CopyButton({ text, label }: { text: string; label: string }) {
  const [copied, setCopied] = useState(false)
  return (
    <Button
      type="button"
      variant="ghost"
      size="sm"
      className="h-7 px-2 text-xs"
      onClick={async () => {
        try {
          await navigator.clipboard.writeText(text)
          setCopied(true)
          window.setTimeout(() => setCopied(false), 1500)
        } catch {
          /* ignore */
        }
      }}
    >
      <Copy className="h-3 w-3 mr-1" />
      {copied ? "Copied" : label}
    </Button>
  )
}

type Props = {
  rows: VendorStatusAuditRow[]
  summary: VendorStatusAuditSummary
  initialQuery?: string
}

export function VendorStatusAuditClient({ rows, summary, initialQuery = "" }: Props) {
  const [query, setQuery] = useState(initialQuery)
  const [onlyIssues, setOnlyIssues] = useState(false)
  const [onlyNotMapEligible, setOnlyNotMapEligible] = useState(false)
  const [onlyNotConnected, setOnlyNotConnected] = useState(false)
  const [onlyHidden, setOnlyHidden] = useState(false)

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    return rows.filter((row) => {
      if (onlyIssues && row.issueFlags.length === 0) return false
      if (onlyNotMapEligible && row.eligibleForLiveMap) return false
      if (onlyNotConnected && !row.issueFlags.includes("not_connected_to_vendor_account")) return false
      if (onlyHidden && row.visibleOnDirectory) return false
      if (!q) return true
      const hay = [
        row.truckName,
        row.slug ?? "",
        row.vendorEmail ?? "",
        row.truckId ?? "",
        row.applicationId ?? "",
        row.applicationStatus ?? "",
        row.issueFlags.map((f) => ISSUE_LABELS[f]).join(" "),
      ]
        .join(" ")
        .toLowerCase()
      return hay.includes(q)
    })
  }, [rows, query, onlyIssues, onlyNotMapEligible, onlyNotConnected, onlyHidden])

  return (
    <div className="space-y-6">
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5 text-sm">
        <div className="rounded-lg border bg-card px-3 py-2">
          <p className="text-xs text-muted-foreground">Total rows</p>
          <p className="text-lg font-semibold tabular-nums">{summary.totalRows}</p>
        </div>
        <div className="rounded-lg border bg-card px-3 py-2">
          <p className="text-xs text-muted-foreground">With issues</p>
          <p className="text-lg font-semibold tabular-nums text-amber-700 dark:text-amber-400">{summary.withIssues}</p>
        </div>
        <div className="rounded-lg border bg-card px-3 py-2">
          <p className="text-xs text-muted-foreground">Not map eligible</p>
          <p className="text-lg font-semibold tabular-nums">{summary.notMapEligible}</p>
        </div>
        <div className="rounded-lg border bg-card px-3 py-2">
          <p className="text-xs text-muted-foreground">No auth account</p>
          <p className="text-lg font-semibold tabular-nums">{summary.notConnected}</p>
        </div>
        <div className="rounded-lg border bg-card px-3 py-2">
          <p className="text-xs text-muted-foreground">Hidden / unlisted</p>
          <p className="text-lg font-semibold tabular-nums">{summary.hiddenOrUnlisted}</p>
        </div>
      </div>

      {!summary.usedServiceRole ? (
        <p className="text-sm text-destructive">
          Set <code className="text-xs">SUPABASE_SERVICE_ROLE_KEY</code> to load the full truck + application audit (bypasses
          RLS for admin diagnostics).
        </p>
      ) : null}

      <div className="flex flex-col gap-4 rounded-lg border bg-card p-4">
        <div className="flex flex-col sm:flex-row gap-3 sm:items-center">
          <Input
            placeholder="Search truck name, email, slug, issue…"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="max-w-md"
          />
          <p className="text-xs text-muted-foreground tabular-nums">
            Showing {filtered.length} of {rows.length}
          </p>
        </div>
        <div className="flex flex-wrap gap-x-5 gap-y-2 text-sm">
          <label className="flex items-center gap-2 cursor-pointer">
            <Checkbox checked={onlyIssues} onCheckedChange={(v) => setOnlyIssues(v === true)} />
            Show only issues
          </label>
          <label className="flex items-center gap-2 cursor-pointer">
            <Checkbox checked={onlyNotMapEligible} onCheckedChange={(v) => setOnlyNotMapEligible(v === true)} />
            Not map eligible
          </label>
          <label className="flex items-center gap-2 cursor-pointer">
            <Checkbox checked={onlyNotConnected} onCheckedChange={(v) => setOnlyNotConnected(v === true)} />
            Not connected to vendor account
          </label>
          <label className="flex items-center gap-2 cursor-pointer">
            <Checkbox checked={onlyHidden} onCheckedChange={(v) => setOnlyHidden(v === true)} />
            Hidden / unlisted
          </label>
        </div>
      </div>

      <div className="overflow-x-auto rounded-lg border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="min-w-[160px]">Truck</TableHead>
              <TableHead>Email / app</TableHead>
              <TableHead>Listing</TableHead>
              <TableHead>Live / map</TableHead>
              <TableHead>Issues</TableHead>
              <TableHead className="min-w-[140px]">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filtered.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center text-muted-foreground py-10">
                  No rows match your filters.
                </TableCell>
              </TableRow>
            ) : (
              filtered.map((row) => (
                <TableRow key={`${row.rowKind}-${row.truckId ?? row.applicationId}`}>
                  <TableCell className="align-top">
                    <div className="space-y-1">
                      <p className="font-medium text-foreground">{row.truckName}</p>
                      {row.rowKind === "application_only" ? (
                        <Badge variant="outline" className="text-[10px]">
                          application only
                        </Badge>
                      ) : null}
                      <p className="text-xs text-muted-foreground font-mono break-all">
                        {row.slug ? `/${row.slug}` : "no slug"}
                      </p>
                      <p className="text-[10px] text-muted-foreground font-mono break-all" title="Truck id">
                        {row.truckId ?? "—"}
                      </p>
                    </div>
                  </TableCell>
                  <TableCell className="align-top text-xs space-y-1">
                    <p className="break-all">{row.vendorEmail ?? "—"}</p>
                    <p>
                      App:{" "}
                      <span className="font-medium">{row.applicationStatus ?? "—"}</span>
                    </p>
                    {row.authUserId ? (
                      <p className="font-mono text-[10px] text-muted-foreground break-all" title="Auth user id">
                        auth: {row.authUserId.slice(0, 8)}…
                      </p>
                    ) : (
                      <p className="text-muted-foreground">auth: —</p>
                    )}
                    <p className="text-muted-foreground">Updated {fmtTime(row.lastUpdated)}</p>
                  </TableCell>
                  <TableCell className="align-top text-xs space-y-0.5">
                    <p>
                      Directory: <YesNo value={row.visibleOnDirectory} />
                    </p>
                    <p>
                      show_in_directory:{" "}
                      {row.showInDirectory == null ? "—" : row.showInDirectory ? "true" : "false"}
                    </p>
                    <p>
                      is_active: {row.isActive == null ? "—" : row.isActive ? "true" : "false"}
                    </p>
                    <p>status: {row.listingStatus ?? "—"}</p>
                    <p>
                      Photo: <YesNo value={row.hasPhoto} />
                    </p>
                  </TableCell>
                  <TableCell className="align-top text-xs space-y-0.5">
                    <p>
                      Serving now: <YesNo value={row.servingToday} />
                    </p>
                    <p>
                      Valid coords: <YesNo value={row.hasCurrentLiveLocation} />
                    </p>
                    <p>
                      Location text: <YesNo value={row.hasLocationFields} />
                    </p>
                    <p>
                      Map pin now: <YesNo value={row.onMapPinNow} />
                    </p>
                    <p>
                      Map eligible: <YesNo value={row.eligibleForLiveMap} />
                    </p>
                    <p>
                      Go Live dash: <YesNo value={row.canAccessGoLiveDashboard} />
                    </p>
                  </TableCell>
                  <TableCell className="align-top">
                    {row.issueFlags.length === 0 ? (
                      <Badge variant="secondary" className="text-[10px]">
                        OK
                      </Badge>
                    ) : (
                      <ul className="flex flex-wrap gap-1 max-w-[220px]">
                        {row.issueFlags.map((flag) => (
                          <li key={flag}>
                            <Badge variant="destructive" className="text-[10px] font-normal whitespace-normal">
                              {ISSUE_LABELS[flag]}
                            </Badge>
                          </li>
                        ))}
                      </ul>
                    )}
                  </TableCell>
                  <TableCell className="align-top">
                    <div className="flex flex-col items-start gap-1">
                      {row.profileUrl ? (
                        <Button variant="outline" size="sm" className="h-7 text-xs" asChild>
                          <Link href={row.profileUrl} target="_blank" rel="noopener noreferrer">
                            <ExternalLink className="h-3 w-3 mr-1" />
                            Profile
                          </Link>
                        </Button>
                      ) : null}
                      <Button variant="outline" size="sm" className="h-7 text-xs" asChild>
                        <Link href={row.adminVendorsUrl}>Vendors admin</Link>
                      </Button>
                      {row.goLiveUrl ? (
                        <CopyButton text={row.goLiveUrl} label="Copy Go Live" />
                      ) : null}
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  )
}
