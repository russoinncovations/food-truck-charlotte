import { NextResponse } from "next/server"
import { Webhook } from "svix"
import { insertVendorEmailEvent, lookupVendorEmailDispatchMeta } from "@/lib/email/vendor-email-events"

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

function recipientsFromData(data: Record<string, unknown>): string[] {
  const toRaw = data.to
  if (Array.isArray(toRaw)) {
    return toRaw.filter((x): x is string => typeof x === "string" && x.includes("@"))
  }
  if (typeof toRaw === "string" && toRaw.includes("@")) {
    return [toRaw]
  }
  return []
}

export async function POST(request: Request) {
  const secret = process.env.RESEND_WEBHOOK_SECRET?.trim()
  if (!secret) {
    console.error("[resend-webhook] RESEND_WEBHOOK_SECRET is not set")
    return NextResponse.json({ error: "webhook not configured" }, { status: 503 })
  }

  const payload = await request.text()
  const svixId = request.headers.get("svix-id")
  const svixTimestamp = request.headers.get("svix-timestamp")
  const svixSignature = request.headers.get("svix-signature")
  if (!svixId || !svixTimestamp || !svixSignature) {
    return NextResponse.json({ error: "missing svix headers" }, { status: 400 })
  }

  let verified: unknown
  try {
    const wh = new Webhook(secret)
    verified = wh.verify(payload, {
      "svix-id": svixId,
      "svix-timestamp": svixTimestamp,
      "svix-signature": svixSignature,
    })
  } catch (e) {
    console.warn("[resend-webhook] signature verification failed:", e)
    return NextResponse.json({ error: "invalid signature" }, { status: 400 })
  }

  const body = verified as ResendWebhookBody
  const type = body.type
  if (!type || !HANDLED.has(type)) {
    return NextResponse.json({ ok: true, ignored: type ?? "unknown" })
  }

  const data = body.data ?? {}
  const emailId = typeof data.email_id === "string" ? data.email_id.trim() : ""
  if (!emailId) {
    return NextResponse.json({ ok: true, skipped: true, reason: "no email_id" })
  }

  const meta = await lookupVendorEmailDispatchMeta(emailId)
  const truckId = meta?.truck_id ?? null
  const campaign = meta?.campaign ?? null

  const recipients = recipientsFromData(data)
  const eventTimestamp =
    typeof body.created_at === "string" && body.created_at.trim()
      ? body.created_at
      : new Date().toISOString()

  const click = data.click as { link?: unknown } | undefined
  const linkUrl =
    type === "email.clicked" && typeof click?.link === "string" ? click.link : null

  const rawPayload = verified as Record<string, unknown>

  if (recipients.length === 0) {
    await insertVendorEmailEvent({
      resendEmailId: emailId,
      vendorEmail: null,
      truckId,
      campaign,
      eventType: type,
      eventTimestamp,
      linkUrl,
      rawPayload,
    })
  } else {
    await Promise.all(
      recipients.map((to) =>
        insertVendorEmailEvent({
          resendEmailId: emailId,
          vendorEmail: to,
          truckId,
          campaign,
          eventType: type,
          eventTimestamp,
          linkUrl,
          rawPayload,
        })
      )
    )
  }

  return NextResponse.json({ ok: true })
}
