import { NextResponse } from "next/server"
import { Webhook } from "svix"
import { insertVendorEmailEvent, lookupVendorEmailDispatchMeta } from "@/lib/email/vendor-email-events"
import {
  applyBookingNotificationWebhookEvent,
  lookupBookingOpportunityIdForResendEmail,
  ensureBookingOpportunityResendLink,
} from "@/lib/email/apply-booking-notification-webhook"
import { VENDOR_EMAIL_CAMPAIGN_BOOKING_LEAD } from "@/lib/email/vendor-email-campaigns"

export const runtime = "nodejs"

const HANDLED = new Set([
  "email.sent",
  "email.delivered",
  "email.opened",
  "email.clicked",
  "email.bounced",
  "email.failed",
  "email.complained",
])

type ResendWebhookBody = {
  type?: string
  created_at?: string
  data?: Record<string, unknown>
}

function isDevelopment(): boolean {
  return process.env.NODE_ENV === "development"
}

function asDataRecord(body: ResendWebhookBody): Record<string, unknown> {
  const d = body.data
  if (d !== null && typeof d === "object" && !Array.isArray(d)) {
    return d as Record<string, unknown>
  }
  return {}
}

/** Resend `data.email_id` (preferred) or fallback `data.id`. */
function resendEmailIdFromData(data: Record<string, unknown>): string {
  const pick = (v: unknown): string =>
    typeof v === "string" && v.trim() ? v.trim() : ""

  const fromEmailId = pick(data.email_id)
  if (fromEmailId) return fromEmailId
  const fromId = pick(data.id)
  if (fromId) return fromId

  const nested = data.data
  if (nested !== null && typeof nested === "object" && !Array.isArray(nested)) {
    const nr = nested as Record<string, unknown>
    const n1 = pick(nr.email_id) || pick(nr.id)
    if (n1) return n1
  }

  return ""
}

function recipientsFromData(data: Record<string, unknown>): string[] {
  const toRaw = data.to
  if (Array.isArray(toRaw)) {
    return toRaw.filter((x): x is string => typeof x === "string" && x.includes("@"))
  }
  if (typeof toRaw === "string" && toRaw.includes("@")) {
    return [toRaw.trim()]
  }
  return []
}

function linkUrlFromData(data: Record<string, unknown>, type: string): string | null {
  if (type !== "email.clicked") return null
  const click = data.click
  if (click !== null && typeof click === "object") {
    const link = (click as { link?: unknown }).link
    if (typeof link === "string" && link.trim()) return link.trim()
  }
  if (typeof data.link === "string" && data.link.trim()) {
    return data.link.trim()
  }
  const url = data.url
  if (typeof url === "string" && url.trim()) return url.trim()
  return null
}

export async function GET() {
  return NextResponse.json({
    ok: true,
    endpoint: "resend-webhook",
    methods: ["POST"],
    message: "Resend webhook endpoint is ready",
  })
}

export async function POST(request: Request) {
  const payload = await request.text()
  console.log("[resend-webhook] POST received:", payload.length, "bytes")

  const secret = process.env.RESEND_WEBHOOK_SECRET?.trim()
  const dev = isDevelopment()

  let verified: unknown

  if (!secret) {
    if (!dev) {
      console.error("[resend-webhook] RESEND_WEBHOOK_SECRET missing (production) — rejecting")
      return NextResponse.json({ error: "webhook not configured" }, { status: 503 })
    }
    console.warn(
      "[resend-webhook] DEV: RESEND_WEBHOOK_SECRET unset — accepting unsigned JSON (localhost only; set secret for real verification)"
    )
    console.warn("[resend-webhook] DEV payload (truncated):", payload.slice(0, 2000))
    try {
      verified = JSON.parse(payload) as unknown
    } catch {
      return NextResponse.json({ error: "invalid json body" }, { status: 400 })
    }
  } else {
    const svixId = request.headers.get("svix-id")
    const svixTimestamp = request.headers.get("svix-timestamp")
    const svixSignature = request.headers.get("svix-signature")
    if (!svixId || !svixTimestamp || !svixSignature) {
      console.warn("[resend-webhook] missing svix headers")
      return NextResponse.json({ error: "missing svix headers" }, { status: 400 })
    }
    try {
      const wh = new Webhook(secret)
      verified = wh.verify(payload, {
        "svix-id": svixId,
        "svix-timestamp": svixTimestamp,
        "svix-signature": svixSignature,
      })
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e)
      console.warn("[resend-webhook] invalid signature:", msg)
      return NextResponse.json({ error: "invalid signature" }, { status: 401 })
    }
  }

  try {
    return await processResendEvent(verified)
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e)
    console.error("[resend-webhook] unexpected handler error:", msg)
    return NextResponse.json({ ok: false, error: "internal_error" }, { status: 500 })
  }
}

async function processResendEvent(verified: unknown): Promise<NextResponse> {
  let body: ResendWebhookBody
  try {
    if (
      verified === null ||
      typeof verified !== "object" ||
      Array.isArray(verified)
    ) {
      console.warn("[resend-webhook] unsupported root shape:", typeof verified)
      return NextResponse.json({ ok: true, ignored: "non_object_payload" })
    }
    body = verified as ResendWebhookBody
  } catch {
    return NextResponse.json({ ok: true, ignored: "parse_shape" })
  }

  const type = typeof body.type === "string" ? body.type.trim() : ""
  if (!type || !HANDLED.has(type)) {
    console.log("[resend-webhook] ignored event type:", type || "(missing)")
    return NextResponse.json({ ok: true, ignored: type || "unknown_type" })
  }

  console.log("[resend-webhook] event type:", type)

  const data = asDataRecord(body)
  let emailId: string
  try {
    emailId = resendEmailIdFromData(data)
  } catch {
    emailId = ""
  }

  console.log("[resend-webhook] resend_email_id:", emailId || "(none)")

  if (!emailId) {
    console.log("[resend-webhook] skip: no email_id in payload")
    return NextResponse.json({ ok: true, skipped: true, reason: "no_email_id" })
  }

  let meta: { truck_id: string | null; campaign: string | null } | null = null
  try {
    meta = await lookupVendorEmailDispatchMeta(emailId)
  } catch (e) {
    console.warn("[resend-webhook] lookupVendorEmailDispatchMeta failed:", e)
  }
  let truckId = meta?.truck_id ?? null
  let campaign = meta?.campaign ?? null

  if (campaign === VENDOR_EMAIL_CAMPAIGN_BOOKING_LEAD) {
    try {
      const oppId = await lookupBookingOpportunityIdForResendEmail(emailId)
      if (oppId) {
        await ensureBookingOpportunityResendLink(emailId, oppId)
      }
    } catch (e) {
      console.warn("[resend-webhook] booking opportunity link failed:", e)
    }
  }

  let recipients: string[]
  try {
    recipients = recipientsFromData(data)
  } catch {
    recipients = []
  }

  let eventTimestamp: string
  try {
    eventTimestamp =
      typeof body.created_at === "string" && body.created_at.trim()
        ? body.created_at
        : typeof data.created_at === "string" && (data.created_at as string).trim()
          ? (data.created_at as string)
          : new Date().toISOString()
  } catch {
    eventTimestamp = new Date().toISOString()
  }

  let linkUrl: string | null = null
  try {
    linkUrl = linkUrlFromData(data, type)
  } catch {
    linkUrl = null
  }

  let rawPayload: Record<string, unknown>
  try {
    rawPayload = verified as Record<string, unknown>
  } catch {
    rawPayload = { _note: "unserializable_original" }
  }

  /** One row per recipient when addresses exist; else a single anonymous row preserves the engagement event. */
  const inserts: Promise<boolean>[] =
    recipients.length === 0
      ? [
          insertVendorEmailEvent({
            resendEmailId: emailId,
            vendorEmail: null,
            truckId,
            campaign,
            eventType: type,
            eventTimestamp,
            linkUrl,
            rawPayload,
          }).then((ok) => {
            if (ok) {
              console.log("[resend-webhook] insert ok (no recipients):", type, emailId)
            } else {
              console.error("[resend-webhook] insert failed (no recipients):", type, emailId)
            }
            return ok
          }),
        ]
      : recipients.map((to) =>
          insertVendorEmailEvent({
            resendEmailId: emailId,
            vendorEmail: to,
            truckId,
            campaign,
            eventType: type,
            eventTimestamp,
            linkUrl,
            rawPayload,
          }).then((ok) => {
            if (ok) {
              console.log("[resend-webhook] insert ok:", type, emailId, to)
            } else {
              console.error("[resend-webhook] insert failed:", type, emailId, to)
            }
            return ok
          })
        )

  let outcomes: boolean[]
  try {
    outcomes = await Promise.all(inserts)
  } catch (e) {
    console.error("[resend-webhook] insert promise error:", e)
    return NextResponse.json({ ok: false, error: "insert_failed" }, { status: 500 })
  }

  const allOk = outcomes.every(Boolean)
  if (!allOk) {
    return NextResponse.json(
      { ok: false, error: "partial_or_failed_insert", type, resend_email_id: emailId },
      { status: 500 }
    )
  }

  try {
    await applyBookingNotificationWebhookEvent({
      resendEmailId: emailId,
      eventType: type,
      eventTimestamp,
      campaign,
    })
  } catch (e) {
    console.warn("[resend-webhook] booking notification apply failed:", e)
  }

  return NextResponse.json({ ok: true, type, resend_email_id: emailId })
}
