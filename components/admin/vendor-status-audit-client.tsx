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
import { VendorStatusAuditResolutionActions } from "@/components/admin/vendor-status-audit-resolution-actions"
import {
  VENDOR_EMAIL_GO_LIVE_DASHBOARD_URL,
  VENDOR_EMAIL_VENDOR_LOGIN_URL,
} from "@/lib/email/vendor-email-public-links"
import {
  groupMatchesQuickFilter,
  ISSUE_LABELS,
  type VendorAuditQuickFilter,
  type VendorStatusAuditGroup,
  type VendorStatusAuditIssue,
  type VendorStatusAuditRow,
  type VendorStatusAuditSummary,
} from "@/lib/admin/vendor-status-audit"
import { ChevronDown, ChevronRight, Copy } from "lucide-react"

const ROW_TYPE_LABELS: Record<VendorStatusAuditRow["rowType"], string> = {
  active_truck: "Active truck",
  truck_profile: "Truck profile",
  application_only: "Application only",
  historical_application: "Historical application",
}

const QUICK_FILTERS: { id: VendorAuditQuickFilter; label: string }[] = [
  { id: "all", label: "All" },
  { id: "needs_login", label: "Needs login" },
  { id: "needs_first_live_location", label: "Needs first live location" },
  { id: "missing_photo", label: "Missing photo" },
  { id: "needs_truck_profile", label: "Needs truck profile" },
  { id: "hidden_inactive", label: "Hidden / inactive" },
  { id: "ready", label: "Ready" },
]

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

function AuditDataRow({
  row,
  severity,
  historicalCount,
  expandControl,
  muted,
  internalTest,
  outreachSelect,
}: {
  row: VendorStatusAuditRow
  severity?: VendorStatusAuditGroup["highestSeverity"]
  historicalCount?: number
  expandControl?: ReactNode
  muted?: boolean
  internalTest?: boolean
  outreachSelect?: ReactNode
}) {
  return (
    <TableRow className={muted ? "bg-muted/25" : internalTest ? "bg-violet-500/5" : undefined}>
      <TableCell className="align-top w-10">{outreachSelect ?? null}</TableCell>
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
        {muted ? (
          <Button variant="ghost" size="sm" className="h-7 text-xs" asChild>
            <Link href={row.adminVendorsUrl}>Vendors admin</Link>
          </Button>
        ) : (
          <VendorStatusAuditResolutionActions row={row} />
        )}
      </TableCell>
    </TableRow>
  )
}

type OutreachRow = {
  truckName: string
  email: string | null
  loginUrl: string
  goLiveUrl: string
}

function buildOutreachRows(
  groups: VendorStatusAuditGroup[],
  selectedKeys: Set<string>
): OutreachRow[] {
  return groups
    .filter((g) => selectedKeys.has(g.groupKey))
    .map((g) => ({
      truckName: g.primary.truckName,
      email: g.primary.vendorEmail,
      loginUrl: g.primary.vendorLoginUrl ?? VENDOR_EMAIL_VENDOR_LOGIN_URL,
      goLiveUrl: g.primary.goLiveUrl ?? VENDOR_EMAIL_GO_LIVE_DASHBOARD_URL,
    }))
}

function formatOutreachListText(rows: OutreachRow[]): string {
  return rows
    .map((row) =>
      [
        row.truckName,
        `Email: ${row.email ?? "—"}`,
        `Login: ${row.loginUrl}`,
        `Go Live: ${row.goLiveUrl}`,
      ].join("\n")
    )
    .join("\n\n")
}

type Props = {
  groups: VendorStatusAuditGroup[]
  summary: VendorStatusAuditSummary
  initialQuery?: string
}

export function VendorStatusAuditClient({ groups, summary, initialQuery = "" }: Props) {
  const [query, setQuery] = useState(initialQuery)
  const [quickFilter, setQuickFilter] = useState<VendorAuditQuickFilter>("all")
  const [focusBlockers, setFocusBlockers] = useState(true)
  const [showReady, setShowReady] = useState(false)
  const [showHistorical, setShowHistorical] = useState(false)
  const [showInternalTest, setShowInternalTest] = useState(false)
  const [expanded, setExpanded] = useState<Record<string, boolean>>({})
  const [selectedGroupKeys, setSelectedGroupKeys] = useState<Set<string>>(() => new Set())
  const [copyFeedback, setCopyFeedback] = useState<string | null>(null)

  const productionGroupCount = groups.length - summary.internalTestRecords

  const quickFilterCounts = useMemo(() => {
    const visibleGroups = groups.filter(
      (g) => showInternalTest || g.groupClassification === "production"
    )
    return Object.fromEntries(
      QUICK_FILTERS.map(({ id }) => [
        id,
        id === "all"
          ? visibleGroups.length
          : visibleGroups.filter((g) => groupMatchesQuickFilter(g, id)).length,
      ])
    ) as Record<VendorAuditQuickFilter, number>
  }, [groups, showInternalTest])

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    return groups.filter((group) => {
      if (!showInternalTest && group.groupClassification === "internal_test") return false
      if (!groupMatchesQuickFilter(group, quickFilter)) return false

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

      if (quickFilter === "all" && !q) {
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
  }, [groups, query, focusBlockers, showReady, showInternalTest, quickFilter])

  const filteredGroupKeys = useMemo(() => filtered.map((g) => g.groupKey), [filtered])
  const selectedOutreachRows = useMemo(
    () => buildOutreachRows(groups, selectedGroupKeys),
    [groups, selectedGroupKeys]
  )
  const allFilteredSelected =
    filteredGroupKeys.length > 0 && filteredGroupKeys.every((key) => selectedGroupKeys.has(key))
  const someFilteredSelected = filteredGroupKeys.some((key) => selectedGroupKeys.has(key))

  function toggleGroupSelection(groupKey: string, checked: boolean) {
    setSelectedGroupKeys((prev) => {
      const next = new Set(prev)
      if (checked) next.add(groupKey)
      else next.delete(groupKey)
      return next
    })
  }

  function toggleSelectAllFiltered() {
    setSelectedGroupKeys((prev) => {
      const next = new Set(prev)
      if (allFilteredSelected) {
        for (const key of filteredGroupKeys) next.delete(key)
      } else {
        for (const key of filteredGroupKeys) next.add(key)
      }
      return next
    })
  }

  function clearSelection() {
    setSelectedGroupKeys(new Set())
  }

  async function copyToClipboard(text: string, feedback: string) {
    try {
      await navigator.clipboard.writeText(text)
      setCopyFeedback(feedback)
      window.setTimeout(() => setCopyFeedback(null), 2000)
    } catch {
      setCopyFeedback("Copy failed — check browser permissions")
      window.setTimeout(() => setCopyFeedback(null), 2500)
    }
  }

  function copySelectedEmails() {
    const emails = selectedOutreachRows.map((row) => row.email?.trim()).filter(Boolean) as string[]
    if (emails.length === 0) {
      setCopyFeedback("No vendor emails in selection")
      window.setTimeout(() => setCopyFeedback(null), 2000)
      return
    }
    void copyToClipboard(emails.join("\n"), `Copied ${emails.length} email${emails.length === 1 ? "" : "s"}`)
  }

  function copySelectedOutreachList() {
    if (selectedOutreachRows.length === 0) {
      setCopyFeedback("Select at least one vendor group")
      window.setTimeout(() => setCopyFeedback(null), 2000)
      return
    }
    void copyToClipboard(
      formatOutreachListText(selectedOutreachRows),
      `Copied outreach list for ${selectedOutreachRows.length} vendor${selectedOutreachRows.length === 1 ? "" : "s"}`
    )
  }

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
        <div>
          <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground mb-2">Quick filters</p>
          <div className="flex flex-wrap gap-2">
            {QUICK_FILTERS.map(({ id, label }) => (
              <Button
                key={id}
                type="button"
                size="sm"
                variant={quickFilter === id ? "default" : "outline"}
                className="h-8 text-xs"
                onClick={() => setQuickFilter(id)}
              >
                {label}
                <span className="ml-1.5 tabular-nums opacity-80">({quickFilterCounts[id] ?? 0})</span>
              </Button>
            ))}
          </div>
        </div>

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

        <div className="rounded-lg border border-dashed bg-muted/20 p-3 space-y-3">
          <div>
            <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Manual outreach</p>
            <p className="text-xs text-muted-foreground mt-1">
              Search by truck name, select rows, then copy emails or a formatted outreach list. Nothing is sent from
              this page.
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <Button
              type="button"
              size="sm"
              variant="secondary"
              className="h-8 text-xs"
              disabled={selectedOutreachRows.length === 0}
              onClick={copySelectedEmails}
            >
              <Copy className="h-3.5 w-3.5 mr-1.5" />
              Copy selected emails
            </Button>
            <Button
              type="button"
              size="sm"
              variant="secondary"
              className="h-8 text-xs"
              disabled={selectedOutreachRows.length === 0}
              onClick={copySelectedOutreachList}
            >
              <Copy className="h-3.5 w-3.5 mr-1.5" />
              Copy selected outreach list
            </Button>
            <Button type="button" size="sm" variant="outline" className="h-8 text-xs" onClick={toggleSelectAllFiltered}>
              {allFilteredSelected ? "Deselect shown" : "Select all shown"}
            </Button>
            <Button
              type="button"
              size="sm"
              variant="ghost"
              className="h-8 text-xs"
              disabled={selectedGroupKeys.size === 0}
              onClick={clearSelection}
            >
              Clear selection
            </Button>
            <span className="text-xs text-muted-foreground tabular-nums">
              {selectedGroupKeys.size} selected
              {copyFeedback ? <span className="ml-2 text-foreground">· {copyFeedback}</span> : null}
            </span>
          </div>
        </div>
        <div className="flex flex-wrap gap-x-5 gap-y-2 text-sm">
          <label className="flex items-center gap-2 cursor-pointer">
            <Checkbox
              checked={focusBlockers}
              onCheckedChange={(v) => setFocusBlockers(v === true)}
              disabled={quickFilter !== "all"}
            />
            Focus on blockers (critical + action)
          </label>
          <label className="flex items-center gap-2 cursor-pointer">
            <Checkbox
              checked={showReady}
              onCheckedChange={(v) => setShowReady(v === true)}
              disabled={quickFilter !== "all"}
            />
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
          Use <span className="text-foreground">Next steps</span> to copy vendor links or jump to admin photo / application
          review. Operational counts exclude internal demo/test groups.
        </p>
      </div>

      <div className="overflow-x-auto rounded-lg border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-10">
                <Checkbox
                  checked={allFilteredSelected ? true : someFilteredSelected ? "indeterminate" : false}
                  onCheckedChange={() => toggleSelectAllFiltered()}
                  disabled={filteredGroupKeys.length === 0}
                  aria-label="Select all shown vendor groups"
                />
              </TableHead>
              <TableHead className="w-10" />
              <TableHead className="min-w-[160px]">Truck / type</TableHead>
              <TableHead>Email / app</TableHead>
              <TableHead>Listing</TableHead>
              <TableHead>Live / map</TableHead>
              <TableHead>Issues</TableHead>
              <TableHead className="min-w-[180px]">Next steps</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filtered.length === 0 ? (
              <TableRow>
                <TableCell colSpan={8} className="text-center text-muted-foreground py-10">
                  No groups match your filters. Try another quick filter or clearing search.
                </TableCell>
              </TableRow>
            ) : (
              filtered.map((group) => {
                const hasHistorical = group.linkedApplications.length > 0
                const isOpen = showHistorical || expanded[group.groupKey] === true
                const isSelected = selectedGroupKeys.has(group.groupKey)

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
                      outreachSelect={
                        <Checkbox
                          checked={isSelected}
                          onCheckedChange={(v) => toggleGroupSelection(group.groupKey, v === true)}
                          aria-label={`Select ${group.primary.truckName} for outreach`}
                        />
                      }
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
