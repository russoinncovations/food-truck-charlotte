import Link from "next/link"
import { Mail, MousePointerClick } from "lucide-react"
import type { VendorEmailEngagementSummary } from "@/lib/admin/vendor-email-engagement"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"

type Props = {
  keyQ: string
  data: VendorEmailEngagementSummary
}

function fmtTime(iso: string): string {
  if (!iso) return "—"
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return iso
  return d.toLocaleString("en-US", {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  })
}

function fmtDateRange(sinceIso: string): string {
  const d = new Date(sinceIso)
  if (Number.isNaN(d.getTime())) return ""
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })
}

export function AdminVendorEmailEngagement({ keyQ, data }: Props) {
  const {
    usedServiceRole,
    sinceIso,
    rowCount,
    sentDistinct,
    deliveredDistinct,
    openedDistinct,
    clickedDistinct,
    bouncedFailedComplainedDistinct,
    clickers,
    bouncedOrFailed,
  } = data

  const stats = [
    { label: "Sent (accepted / queued)", value: sentDistinct },
    { label: "Delivered", value: deliveredDistinct },
    { label: "Opened (approx.)", value: openedDistinct, hint: "Images blocked or prefetched can skew this." },
    { label: "Clicked", value: clickedDistinct, emphasize: true },
    { label: "Bounced / failed / complained", value: bouncedFailedComplainedDistinct },
  ]

  return (
    <Card className="mb-10 border-primary/15">
      <CardHeader>
        <CardTitle className="text-lg flex items-center gap-2">
          <Mail className="h-5 w-5 text-primary shrink-0" />
          Vendor reminder — email results
        </CardTitle>
        <CardDescription className="space-y-1">
          <span>
            Resend lifecycle for schedule and profile reminder campaigns. Showing data since{" "}
            <strong>{fmtDateRange(sinceIso)}</strong> ({rowCount} event rows loaded).
          </span>
          <span className="block text-xs">
            Clicks are the main engagement signal. Open counts are{" "}
            <strong>approximate</strong> (not everyone loads tracking pixels). Configure the Resend webhook to POST
            signed events to <code className="text-[11px]">/api/resend/webhook</code>.
          </span>
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {!usedServiceRole ? (
          <p className="text-sm text-amber-900 dark:text-amber-100 rounded-md border border-amber-500/35 bg-amber-500/10 px-3 py-2">
            Set <code className="text-xs">SUPABASE_SERVICE_ROLE_KEY</code> to load engagement rows from{" "}
            <code className="text-xs">vendor_email_events</code>.
          </p>
        ) : null}

        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
          {stats.map((s) => (
            <div
              key={s.label}
              className={
                s.emphasize
                  ? "rounded-lg border-2 border-primary/40 bg-primary/5 px-3 py-3"
                  : "rounded-lg border border-border bg-muted/20 px-3 py-3"
              }
            >
              <div className="flex items-center gap-1.5 text-xs font-medium uppercase tracking-wide text-muted-foreground">
                {s.emphasize ? <MousePointerClick className="h-3.5 w-3.5" /> : null}
                {s.label}
              </div>
              <div className="mt-1 text-2xl font-semibold tabular-nums">{s.value}</div>
              {s.hint ? <p className="mt-1 text-[11px] text-muted-foreground leading-snug">{s.hint}</p> : null}
            </div>
          ))}
        </div>

        <div className="grid gap-6 lg:grid-cols-2">
          <div>
            <h3 className="text-sm font-semibold mb-2">Vendors who clicked</h3>
            {clickers.length === 0 ? (
              <p className="text-sm text-muted-foreground">No click events in this window.</p>
            ) : (
              <div className="rounded-md border border-border overflow-x-auto max-h-[320px] overflow-y-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Email</TableHead>
                      <TableHead>Truck</TableHead>
                      <TableHead>Campaign</TableHead>
                      <TableHead>When</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {clickers.map((c, i) => (
                      <TableRow key={`${c.vendorEmail}-${c.clickedAt}-${i}`}>
                        <TableCell className="max-w-[200px] break-all text-sm">{c.vendorEmail || "—"}</TableCell>
                        <TableCell className="text-sm">
                          {c.truckId && c.truckName ? (
                            <Link
                              href={`/admin/vendors${keyQ}`}
                              className="text-primary underline-offset-2 hover:underline"
                            >
                              {c.truckName}
                            </Link>
                          ) : (
                            "—"
                          )}
                        </TableCell>
                        <TableCell className="text-xs text-muted-foreground whitespace-nowrap">
                          {c.campaign ?? "—"}
                        </TableCell>
                        <TableCell className="text-xs text-muted-foreground whitespace-nowrap">
                          {fmtTime(c.clickedAt)}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </div>

          <div>
            <h3 className="text-sm font-semibold mb-2">Bounced, failed, or complained</h3>
            {bouncedOrFailed.length === 0 ? (
              <p className="text-sm text-muted-foreground">No delivery issues in this window.</p>
            ) : (
              <div className="rounded-md border border-border overflow-x-auto max-h-[320px] overflow-y-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Email</TableHead>
                      <TableHead>Events</TableHead>
                      <TableHead>Campaign</TableHead>
                      <TableHead>Last seen</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {bouncedOrFailed.map((b) => (
                      <TableRow key={`${b.resendEmailId}-${b.lastAt}`}>
                        <TableCell className="max-w-[200px] break-all text-sm">{b.vendorEmail || "—"}</TableCell>
                        <TableCell className="text-xs">{b.eventTypes.join(", ")}</TableCell>
                        <TableCell className="text-xs text-muted-foreground">{b.campaign ?? "—"}</TableCell>
                        <TableCell className="text-xs text-muted-foreground whitespace-nowrap">
                          {fmtTime(b.lastAt)}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
