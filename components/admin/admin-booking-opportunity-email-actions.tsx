"use client"

import { useState, useTransition } from "react"
import { Button } from "@/components/ui/button"
import {
  sendBookingNotificationNow,
  syncOpportunityNotificationEmailFromTruck,
} from "@/app/admin/bookings/notification-actions"
import { bookingNotificationWasEmailed } from "@/lib/booking/booking-notification-status"

type Props = {
  opportunityId: string
  bookingId: string
  adminKey: string
  notificationStatus: string | null
  canonicalEmail: string | null
  hasEmailWarnings: boolean
  notificationIsHistorical: boolean
}

export function AdminBookingOpportunityEmailActions({
  opportunityId,
  bookingId,
  adminKey,
  notificationStatus,
  canonicalEmail,
  hasEmailWarnings,
  notificationIsHistorical,
}: Props) {
  const [pending, startTransition] = useTransition()
  const [message, setMessage] = useState<string | null>(null)

  const alreadySent = bookingNotificationWasEmailed(notificationStatus)
  const canSync = hasEmailWarnings && !notificationIsHistorical

  function onSend() {
    setMessage(null)
    const fd = new FormData()
    fd.set("adminKey", adminKey)
    fd.set("opportunityId", opportunityId)
    fd.set("bookingId", bookingId)
    startTransition(async () => {
      const result = await sendBookingNotificationNow(fd)
      setMessage(result.ok ? "Notification sent." : (result.error ?? "Could not send notification."))
    })
  }

  function onSync() {
    setMessage(null)
    const fd = new FormData()
    fd.set("adminKey", adminKey)
    fd.set("opportunityId", opportunityId)
    fd.set("bookingId", bookingId)
    startTransition(async () => {
      const result = await syncOpportunityNotificationEmailFromTruck(fd)
      if (result.ok) {
        setMessage(
          result.canonicalEmail
            ? `Synced for future sends: ${result.canonicalEmail}`
            : "Synced for future sends."
        )
      } else {
        setMessage(result.error ?? "Could not sync.")
      }
    })
  }

  return (
    <div className="space-y-2 min-w-[160px]">
      {canSync ? (
        <Button type="button" variant="secondary" size="sm" disabled={pending} onClick={() => onSync()}>
          {pending ? "Working…" : "Sync notification email from active truck profile"}
        </Button>
      ) : null}
      <Button
        type="button"
        variant="outline"
        size="sm"
        disabled={pending || !canonicalEmail?.trim()}
        onClick={() => onSend()}
      >
        {pending ? "Sending…" : alreadySent ? "Send booking notification again" : "Send booking notification now"}
      </Button>
      {!canonicalEmail?.trim() ? (
        <p className="text-[11px] text-muted-foreground">Add a valid email to trucks.email on the truck profile.</p>
      ) : null}
      {message ? <p className="text-[11px] text-muted-foreground">{message}</p> : null}
    </div>
  )
}
