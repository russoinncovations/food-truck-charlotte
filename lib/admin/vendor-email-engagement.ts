import { createAdminSupabaseClient } from "@/lib/supabase/admin"
import {
  VENDOR_EMAIL_CAMPAIGN_PROFILE_PIN_REMINDER,
  VENDOR_EMAIL_CAMPAIGN_PROFILE_PIN_TEST,
  VENDOR_EMAIL_CAMPAIGN_SCHEDULE_REMINDER,
  VENDOR_EMAIL_CAMPAIGN_SCHEDULE_REMINDER_TEST,
} from "@/lib/email/vendor-email-campaigns"

const REMINDER_CAMPAIGNS = [
  VENDOR_EMAIL_CAMPAIGN_SCHEDULE_REMINDER,
  VENDOR_EMAIL_CAMPAIGN_SCHEDULE_REMINDER_TEST,
  VENDOR_EMAIL_CAMPAIGN_PROFILE_PIN_REMINDER,
  VENDOR_EMAIL_CAMPAIGN_PROFILE_PIN_TEST,
] as const

const LOOKBACK_DAYS = 60
const ROW_LIMIT = 25_000

export type VendorEmailClickRow = {
  vendorEmail: string
  truckId: string | null
  truckName: string | null
  linkUrl: string | null
  clickedAt: string
  campaign: string | null
}

export type VendorEmailIssueRow = {
  vendorEmail: string
  eventTypes: string[]
  resendEmailId: string | null
  lastAt: string
  campaign: string | null
}

export type VendorEmailEngagementSummary = {
  usedServiceRole: boolean
  sinceIso: string
  rowCount: number
  /** Dispatched from our app (Resend accepted) — same email ids as vendor sends. */
  sentDistinct: number
  deliveredDistinct: number
  /** Pixel-based; can be blocked or inflated — see UI note. */
  openedDistinct: number
  /** Primary engagement metric — link clicks tracked by Resend. */
  clickedDistinct: number
  /** Distinct sends with bounce, delivery failure, or spam complaint. */
  bouncedFailedComplainedDistinct: number
  clickers: VendorEmailClickRow[]
  bouncedOrFailed: VendorEmailIssueRow[]
}

function emptySummary(sinceIso: string): VendorEmailEngagementSummary {
  return {
    usedServiceRole: false,
    sinceIso,
    rowCount: 0,
    sentDistinct: 0,
    deliveredDistinct: 0,
    openedDistinct: 0,
    clickedDistinct: 0,
    bouncedFailedComplainedDistinct: 0,
    clickers: [],
    bouncedOrFailed: [],
  }
}

export async function fetchVendorEmailEngagementSummary(): Promise<VendorEmailEngagementSummary> {
  const admin = createAdminSupabaseClient()
  const since = new Date()
  since.setUTCDate(since.getUTCDate() - LOOKBACK_DAYS)
  const sinceIso = since.toISOString()

  if (!admin) {
    return emptySummary(sinceIso)
  }

  const { data, error } = await admin
    .from("vendor_email_events")
    .select(
      "resend_email_id, vendor_email, truck_id, campaign, event_type, link_url, event_timestamp, created_at"
    )
    .in("campaign", [...REMINDER_CAMPAIGNS])
    .gte("created_at", sinceIso)
    .order("created_at", { ascending: false })
    .limit(ROW_LIMIT)

  if (error) {
    console.error("[vendor-email-engagement] query:", error.message)
    return { ...emptySummary(sinceIso), usedServiceRole: true }
  }

  const rows = (data ?? []) as {
    resend_email_id: string | null
    vendor_email: string | null
    truck_id: string | null
    campaign: string | null
    event_type: string
    link_url: string | null
    event_timestamp: string
    created_at: string
  }[]

  const sentIds = new Set<string>()
  for (const r of rows) {
    const eid = r.resend_email_id?.trim()
    if (!eid) continue
    if (r.event_type === "dispatch.log" || r.event_type === "email.sent") {
      sentIds.add(eid)
    }
  }
  const sentDistinct = sentIds.size

  const delivered = new Set<string>()
  const opened = new Set<string>()
  const clicked = new Set<string>()
  const bad = new Set<string>()

  const clickEvents: {
    resend_email_id: string
    vendor_email: string
    truck_id: string | null
    link_url: string | null
    at: string
    campaign: string | null
  }[] = []

  const badByEmailId = new Map<
    string,
    { vendor_email: string; types: Set<string>; lastAt: string; campaign: string | null }
  >()

  for (const r of rows) {
    const eid = r.resend_email_id?.trim()
    if (!eid) continue
    switch (r.event_type) {
      case "email.delivered":
        delivered.add(eid)
        break
      case "email.opened":
        opened.add(eid)
        break
      case "email.clicked":
        clicked.add(eid)
        clickEvents.push({
          resend_email_id: eid,
          vendor_email: (r.vendor_email ?? "").trim(),
          truck_id: r.truck_id,
          link_url: r.link_url,
          at: r.event_timestamp || r.created_at,
          campaign: r.campaign,
        })
        break
      case "email.bounced":
      case "email.failed":
      case "email.complained":
        bad.add(eid)
        {
          const prev = badByEmailId.get(eid)
          const at = r.event_timestamp || r.created_at
          const v = (r.vendor_email ?? "").trim()
          if (!prev) {
            badByEmailId.set(eid, {
              vendor_email: v,
              types: new Set([r.event_type]),
              lastAt: at,
              campaign: r.campaign,
            })
          } else {
            prev.types.add(r.event_type)
            if (new Date(at).getTime() > new Date(prev.lastAt).getTime()) {
              prev.lastAt = at
              if (v) prev.vendor_email = v
              prev.campaign = prev.campaign ?? r.campaign
            }
          }
        }
        break
      default:
        break
    }
  }

  const latestClickByEmail = new Map<string, (typeof clickEvents)[0]>()
  const sortedClicks = [...clickEvents].sort(
    (a, b) => new Date(a.at).getTime() - new Date(b.at).getTime()
  )
  for (const c of sortedClicks) {
    latestClickByEmail.set(c.resend_email_id, c)
  }
  const clickDeduped = [...latestClickByEmail.values()].sort(
    (a, b) => new Date(b.at).getTime() - new Date(a.at).getTime()
  )

  const truckIds = [...new Set(clickDeduped.map((c) => c.truck_id).filter(Boolean))] as string[]
  const truckNameById = new Map<string, string>()
  if (truckIds.length > 0) {
    const { data: trucks, error: truckErr } = await admin
      .from("trucks")
      .select("id, name")
      .in("id", truckIds)
    if (truckErr) {
      console.error("[vendor-email-engagement] trucks lookup:", truckErr.message)
    } else {
      for (const t of (trucks ?? []) as { id: string; name: string | null }[]) {
        truckNameById.set(t.id, (t.name ?? "").trim() || "—")
      }
    }
  }

  const clickers: VendorEmailClickRow[] = clickDeduped.map((c) => ({
    vendorEmail: c.vendor_email,
    truckId: c.truck_id,
    truckName: c.truck_id ? truckNameById.get(c.truck_id) ?? null : null,
    linkUrl: c.link_url,
    clickedAt: c.at,
    campaign: c.campaign,
  }))

  const bouncedOrFailed: VendorEmailIssueRow[] = [...badByEmailId.entries()]
    .map(([eid, v]) => ({
      vendorEmail: v.vendor_email,
      eventTypes: [...v.types].sort(),
      resendEmailId: eid,
      lastAt: v.lastAt,
      campaign: v.campaign,
    }))
    .sort((a, b) => new Date(b.lastAt).getTime() - new Date(a.lastAt).getTime())

  return {
    usedServiceRole: true,
    sinceIso,
    rowCount: rows.length,
    sentDistinct,
    deliveredDistinct: delivered.size,
    openedDistinct: opened.size,
    clickedDistinct: clicked.size,
    bouncedFailedComplainedDistinct: bad.size,
    clickers,
    bouncedOrFailed,
  }
}
