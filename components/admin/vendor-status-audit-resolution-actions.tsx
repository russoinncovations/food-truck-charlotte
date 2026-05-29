"use client"

import Link from "next/link"
import { useState, type ReactNode } from "react"
import { Button } from "@/components/ui/button"
import { rowHasIssueFlag, type VendorStatusAuditRow } from "@/lib/admin/vendor-status-audit"
import { Copy, ExternalLink } from "lucide-react"

function CopyButton({ text, label }: { text: string; label: string }) {
  const [copied, setCopied] = useState(false)
  return (
    <Button
      type="button"
      variant="outline"
      size="sm"
      className="h-7 text-xs w-full justify-start"
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
      <Copy className="h-3 w-3 mr-1 shrink-0" />
      {copied ? "Copied" : label}
    </Button>
  )
}

function HelperText({ children }: { children: ReactNode }) {
  return <p className="text-[10px] leading-snug text-muted-foreground">{children}</p>
}

type Props = {
  row: VendorStatusAuditRow
}

export function VendorStatusAuditResolutionActions({ row }: Props) {
  const needsLogin = rowHasIssueFlag(row, "not_connected_to_vendor_account")
  const needsLocation =
    rowHasIssueFlag(row, "missing_location") || rowHasIssueFlag(row, "live_no_valid_coords")
  const needsPhoto = rowHasIssueFlag(row, "missing_photo")
  const needsTruckProfile = row.rowType === "application_only"
  const hiddenOrInactive =
    rowHasIssueFlag(row, "hidden_from_directory") ||
    rowHasIssueFlag(row, "listed_inactive") ||
    rowHasIssueFlag(row, "blocked_by_rls")

  return (
    <div className="flex flex-col items-stretch gap-2 min-w-[168px] max-w-[220px]">
      {needsLogin && row.vendorEmail ? (
        <div className="space-y-1.5 rounded-md border border-amber-500/25 bg-amber-500/5 px-2 py-1.5">
          <p className="text-[10px] font-medium text-amber-900 dark:text-amber-200">Needs login</p>
          {row.vendorLoginUrl ? (
            <CopyButton text={row.vendorLoginUrl} label="Copy vendor login link" />
          ) : null}
          {row.goLiveUrl ? <CopyButton text={row.goLiveUrl} label="Copy Go Live link" /> : null}
          <HelperText>Vendor requests a magic link at the login page — share that URL if needed.</HelperText>
        </div>
      ) : null}

      {needsLocation ? (
        <div className="space-y-1.5 rounded-md border border-border bg-muted/20 px-2 py-1.5">
          <p className="text-[10px] font-medium text-foreground">Needs live location</p>
          {row.goLiveUrl ? <CopyButton text={row.goLiveUrl} label="Copy Go Live link" /> : null}
          <HelperText>Vendor needs to log in and set first live pin.</HelperText>
        </div>
      ) : null}

      {needsPhoto ? (
        <div className="space-y-1.5 rounded-md border border-border bg-muted/20 px-2 py-1.5">
          <p className="text-[10px] font-medium text-foreground">Missing photo</p>
          {row.adminPhotosUrl ? (
            <Button variant="outline" size="sm" className="h-7 text-xs w-full justify-start" asChild>
              <Link href={row.adminPhotosUrl}>
                <ExternalLink className="h-3 w-3 mr-1 shrink-0" />
                Replace listing photo
              </Link>
            </Button>
          ) : (
            <Button variant="outline" size="sm" className="h-7 text-xs w-full justify-start" asChild>
              <Link href={`${row.adminVendorsUrl}#directory-listing-photos`}>
                <ExternalLink className="h-3 w-3 mr-1 shrink-0" />
                Open photo admin
              </Link>
            </Button>
          )}
        </div>
      ) : null}

      {needsTruckProfile ? (
        <div className="space-y-1.5 rounded-md border border-primary/25 bg-primary/5 px-2 py-1.5">
          <p className="text-[10px] font-medium text-foreground">Needs truck profile</p>
          <HelperText>Review and approve/create truck profile.</HelperText>
          <Button variant="outline" size="sm" className="h-7 text-xs w-full justify-start" asChild>
            <Link href={row.adminPendingApplicationsUrl}>
              <ExternalLink className="h-3 w-3 mr-1 shrink-0" />
              Review pending applications
            </Link>
          </Button>
          <Button variant="ghost" size="sm" className="h-7 text-xs w-full justify-start" asChild>
            <Link href={row.adminVendorsUrl}>All vendors admin</Link>
          </Button>
        </div>
      ) : null}

      {hiddenOrInactive ? (
        <div className="space-y-1 rounded-md border border-destructive/20 bg-destructive/5 px-2 py-1.5">
          <p className="text-[10px] font-medium text-destructive">Hidden / inactive</p>
          <HelperText>Review visibility/status before changing.</HelperText>
        </div>
      ) : null}

      <div className="space-y-1 pt-1 border-t border-border/60">
        {row.profileUrl ? (
          <Button variant="ghost" size="sm" className="h-7 text-xs w-full justify-start" asChild>
            <Link href={row.profileUrl} target="_blank" rel="noopener noreferrer">
              <ExternalLink className="h-3 w-3 mr-1 shrink-0" />
              Public profile
            </Link>
          </Button>
        ) : null}
        {!needsTruckProfile ? (
          <Button variant="ghost" size="sm" className="h-7 text-xs w-full justify-start" asChild>
            <Link href={row.adminVendorsUrl}>Vendors admin</Link>
          </Button>
        ) : null}
        {!needsLogin && !needsLocation && row.goLiveUrl ? (
          <CopyButton text={row.goLiveUrl} label="Copy Go Live link" />
        ) : null}
      </div>
    </div>
  )
}
