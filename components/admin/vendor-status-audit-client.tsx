"use client"

import { Fragment, useMemo, useState, type ReactNode } from "react"
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
import {
  ISSUE_LABELS,
  type VendorStatusAuditGroup,
  type VendorStatusAuditIssue,
  type VendorStatusAuditRow,
  type VendorStatusAuditSummary,
} from "@/lib/admin/vendor-status-audit"
import { ChevronDown, ChevronRight, Copy, ExternalLink } from "lucide-react"

const ROW_TYPE_LABELS: Record<VendorStatusAuditRow["rowType"], string> = {
  active_truck: "Active truck",
  truck_profile: "Truck profile",
  application_only: "Application only",
  historical_application: "Historical application",
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

function SeverityBadge({ severity }: { severity: VendorStatusAuditGroup["highestSeverity"] }) {
  if (severity === "ready") {
    return (
      <Badge variant="secondary" className="text-[10px] bg-green-500/15 text-green-800 dark:text-green-300 border-green-500/30">
        Ready
      </Badge>
    )
  }
  if (severity === "critical") {
    return <Badge variant="destructive" className="text-[10px]">Critical</Badge>
  }
  if (severity === "action") {
    return (
      <Badge className="text-[10px] bg-amber-500/15 text-amber-900 dark:text-amber-200 border-amber-500/40" variant="outline">
        Action
      </Badge>
    )
  }
  return (
    <Badge variant="outline" className="text-[10px] text-muted-foreground">
      Info
    </Badge>
  )
}

function IssueBadges({ issues }: { issues: VendorStatusAuditIssue[] }) {
  if (issues.length === 0) {
    return (
      <Badge variant="secondary" className="text-[10px]">
        OK
      </Badge>
    )
  }
  return (
    <ul className="flex flex-wrap gap-1 max-w-[240px]">
      {issues.map((item) => (
        <li key={item.flag}>
          <Badge
            variant={item.severity === "critical" ? "destructive" : "outline"}
            className={`text-[10px] font-normal whitespace-normal ${
              item.severity === "action"
                ? "border-amber-500/50 text-amber-900 dark:text-amber-200"
                : item.severity === "info"
                  ? "text-muted-foreground"
                  : ""
            }`}
          >
            {ISSUE_LABELS[item.flag]}
          </Badge>
        </li>
      ))}
    </ul>
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

function AuditDataRow({
  row,
  severity,
  historicalCount,
  expandControl,
  muted,
  internalTest,
}: {
  row: VendorStatusAuditRow
  severity?: VendorStatusAuditGroup["highestSeverity"]
  historicalCount?: number
  expandControl?: ReactNode
  muted?: boolean
  internalTest?: boolean
}) {
  return (
    <TableRow className={muted ? "bg-muted/25" : internalTest ? "bg-violet-500/5" : undefined}>
      <TableCell className="align-top w-10">{expandControl ?? null}</TableCell>
      <TableCell className="align-top min-w-[160px]">
        <div className="space-y-1">
          {severity ? (
            <div className="flex flex-wrap items-center gap-2 mb-1">
              <SeverityBadge severity={severity} />
              {internalTest ? (
                <Badge variant="outline" className="text-[10px] border-violet-500/40 text-violet-800 dark:text-violet-300">
                  Internal / test
                </Badge>
              ) : null}
              {historicalCount ? (
                <span className="text-[10px] text-muted-foreground">+{historicalCount} historical</span>
              ) : null}
            </div>
          ) : null}
          <p className={`font-medium ${muted ? "text-muted-foreground" : "text-foreground"}`}>{row.truckName}</p>
          <Badge variant="outline" className="text-[10px] font-normal">
            {ROW_TYPE_LABELS[row.rowType]}
          </Badge>
          <p className="text-xs text-muted-foreground font-mono break-all">{row.slug ? `/${row.slug}` : "no slug"}</p>
          <p className="text-[10px] text-muted-foreground font-mono break-all">{row.truckId ?? "—"}</p>
        </div>
      </TableCell>
      <TableCell className="align-top text-xs space-y-1">
        <p className="break-all">{row.vendorEmail ?? "—"}</p>
        <p>
          App: <span className="font-medium">{row.applicationStatus ?? "—"}</span>
        </p>
        <p className="font-mono text-[10px] text-muted-foreground break-all">
          auth: {row.authUserId ? `${row.authUserId.slice(0, 8)}…` : "—"}
        </p>
        <p className="text-muted-foreground">Updated {fmtTime(row.lastUpdated)}</p>
      </TableCell>
      <TableCell className="align-top text-xs space-y-0.5">
        <p>
          Directory: <YesNo value={row.visibleOnDirectory} />
        </p>
        <p>
          show_in_directory: {row.showInDirectory == null ? "—" : row.showInDirectory ? "true" : "false"}
        </p>
        <p>is_active: {row.isActive == null ? "—" : row.isActive ? "true" : "false"}</p>
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
        <IssueBadges issues={row.issues} />
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
          {row.goLiveUrl ? <CopyButton text={row.goLiveUrl} label="Copy Go Live" /> : null}
        </div>
      </TableCell>
    </TableRow>
  )
}

type Props = {
  groups: VendorStatusAuditGroup[]
  summary: VendorStatusAuditSummary
  initialQuery?: string
}

export function VendorStatusAuditClient({ groups, summary, initialQuery = "" }: Props) {
  const [query, setQuery] = useState(initialQuery)
  const [focusBlockers, setFocusBlockers] = useState(true)
  const [showReady, setShowReady] = useState(false)
  const [showHistorical, setShowHistorical] = useState(false)
  const [showInternalTest, setShowInternalTest] = useState(false)
  const [expanded, setExpanded] = useState<Record<string, boolean>>({})

  const productionGroupCount = groups.length - summary.internalTestRecords

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    return groups.filter((group) => {
      if (!showInternalTest && group.groupClassification === "internal_test") return false

      const primary = group.primary
      const hay = [
        group.displayName,
        primary.slug ?? "",
        primary.vendorEmail ?? "",
        primary.truckId ?? "",
        primary.applicationId ?? "",
        ...group.linkedApplications.flatMap((a) => [a.truckName, a.vendorEmail ?? "", a.applicationStatus ?? ""]),
        primary.issues.map((i) => ISSUE_LABELS[i.flag]).join(" "),
      ]
        .join(" ")
        .toLowerCase()

      if (q && !hay.includes(q)) return false

      if (!q) {
        if (focusBlockers) {
          const needsAttention =
            group.highestSeverity === "critical" ||
            group.highestSeverity === "action" ||
            primary.rowType === "application_only"
          if (!needsAttention && !showReady) return false
        } else if (!showReady && group.isReadyTruck && primary.rowType !== "application_only") {
          return false
        }
      }

      return true
    })
  }, [groups, query, focusBlockers, showReady, showInternalTest])

  return (
    <div className="space-y-6">
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 text-sm">
        <div className="rounded-lg border bg-card px-3 py-2">
          <p className="text-xs text-muted-foreground">Ready truck profiles</p>
          <p className="text-lg font-semibold tabular-nums text-green-700 dark:text-green-400">
            {summary.readyTruckProfiles}
          </p>
        </div>
        <div className="rounded-lg border bg-card px-3 py-2">
          <p className="text-xs text-muted-foreground">Critical blockers</p>
          <p className="text-lg font-semibold tabular-nums text-destructive">{summary.criticalBlockers}</p>
        </div>
        <div className="rounded-lg border bg-card px-3 py-2">
          <p className="text-xs text-muted-foreground">Needs cleanup (action)</p>
          <p className="text-lg font-semibold tabular-nums text-amber-700 dark:text-amber-400">{summary.needsCleanup}</p>
        </div>
        <div className="rounded-lg border bg-card px-3 py-2">
          <p className="text-xs text-muted-foreground">Internal / test records</p>
          <p className="text-lg font-semibold tabular-nums text-violet-700 dark:text-violet-400">
            {summary.internalTestRecords}
          </p>
        </div>
        <div className="rounded-lg border bg-card px-3 py-2">
          <p className="text-xs text-muted-foreground">Application-only records</p>
          <p className="text-lg font-semibold tabular-nums">{summary.applicationOnlyRecords}</p>
        </div>
        <div className="rounded-lg border bg-card px-3 py-2">
          <p className="text-xs text-muted-foreground">Historical / duplicate apps</p>
          <p className="text-lg font-semibold tabular-nums">{summary.historicalApplicationRecords}</p>
        </div>
      </div>

      {!summary.usedServiceRole ? (
        <p className="text-sm text-destructive">
          Set <code className="text-xs">SUPABASE_SERVICE_ROLE_KEY</code> to load the full truck + application audit.
        </p>
      ) : null}

      <div className="flex flex-col gap-4 rounded-lg border bg-card p-4">
        <div className="flex flex-col sm:flex-row gap-3 sm:items-center">
          <Input
            placeholder="Search truck name, email, slug…"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="max-w-md"
          />
          <p className="text-xs text-muted-foreground tabular-nums">
            Showing {filtered.length} of {showInternalTest ? groups.length : productionGroupCount} vendor groups
            {summary.internalTestRecords > 0 && !showInternalTest
              ? ` (${summary.internalTestRecords} internal/test hidden)`
              : null}
          </p>
        </div>
        <div className="flex flex-wrap gap-x-5 gap-y-2 text-sm">
          <label className="flex items-center gap-2 cursor-pointer">
            <Checkbox checked={focusBlockers} onCheckedChange={(v) => setFocusBlockers(v === true)} />
            Focus on blockers (critical + action)
          </label>
          <label className="flex items-center gap-2 cursor-pointer">
            <Checkbox checked={showReady} onCheckedChange={(v) => setShowReady(v === true)} />
            Include ready profiles
          </label>
          <label className="flex items-center gap-2 cursor-pointer">
            <Checkbox checked={showInternalTest} onCheckedChange={(v) => setShowInternalTest(v === true)} />
            Show internal / test records
          </label>
          <label className="flex items-center gap-2 cursor-pointer">
            <Checkbox checked={showHistorical} onCheckedChange={(v) => setShowHistorical(v === true)} />
            Expand all historical applications
          </label>
        </div>
        <p className="text-xs text-muted-foreground">
          Operational counts exclude internal demo/test groups. Matching application rows are grouped under their truck.
          Historical rows use info-level flags only — they do not affect the truck&apos;s directory or map eligibility.
        </p>
      </div>

      <div className="overflow-x-auto rounded-lg border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-10" />
              <TableHead className="min-w-[160px]">Truck / type</TableHead>
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
                <TableCell colSpan={7} className="text-center text-muted-foreground py-10">
                  No groups match your filters. Try clearing search or enabling ready profiles.
                </TableCell>
              </TableRow>
            ) : (
              filtered.map((group) => {
                const hasHistorical = group.linkedApplications.length > 0
                const isOpen = showHistorical || expanded[group.groupKey] === true

                const expandBtn = hasHistorical ? (
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="h-7 w-7 p-0"
                    onClick={() => setExpanded((prev) => ({ ...prev, [group.groupKey]: !isOpen }))}
                    aria-label={isOpen ? "Collapse history" : "Expand history"}
                  >
                    {isOpen ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
                  </Button>
                ) : null

                return (
                  <Fragment key={group.groupKey}>
                    <AuditDataRow
                      row={group.primary}
                      severity={group.highestSeverity}
                      historicalCount={hasHistorical ? group.linkedApplications.length : 0}
                      expandControl={expandBtn}
                      internalTest={group.groupClassification === "internal_test"}
                    />
                    {hasHistorical && isOpen
                      ? group.linkedApplications.map((appRow) => (
                          <AuditDataRow
                            key={`${group.groupKey}-${appRow.applicationId}`}
                            row={appRow}
                            muted
                          />
                        ))
                      : null}
                  </Fragment>
                )
              })
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  )
}
