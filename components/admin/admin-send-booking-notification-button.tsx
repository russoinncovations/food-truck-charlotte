"use client"

import { useState, useTransition } from "react"
import { Button } from "@/components/ui/button"
import { sendBookingNotificationNow } from "@/app/admin/bookings/notification-actions"
import { bookingNotificationWasEmailed } from "@/lib/booking/booking-notification-status"

type Props = {
  opportunityId: string
  bookingId: string
  adminKey: string
  notificationStatus: string | null
  truckEmail: string | null
}

export function AdminSendBookingNotificationButton({
  opportunityId,
  bookingId,
  adminKey,
  notificationStatus,
  truckEmail,
}: Props) {
  const [pending, startTransition] = useTransition()
  const [message, setMessage] = useState<string | null>(null)

  const alreadySent = bookingNotificationWasEmailed(notificationStatus)

  function onSend() {
    setMessage(null)
    const fd = new FormData()
    fd.set("adminKey", adminKey)
    fd.set("opportunityId", opportunityId)
    fd.set("bookingId", bookingId)
    startTransition(async () => {
      const result = await sendBookingNotificationNow(fd)
      if (result.ok) {
        setMessage("Notification sent.")
      } else {
        setMessage(result.error ?? "Could not send notification.")
      }
    })
  }

  return (
    <div className="space-y-1">
      <Button
        type="button"
        variant="outline"
        size="sm"
        disabled={pending || !truckEmail?.trim()}
        onClick={() => onSend()}
      >
        {pending ? "Sending…" : alreadySent ? "Send booking notification again" : "Send booking notification now"}
      </Button>
      {!truckEmail?.trim() ? (
        <p className="text-[11px] text-muted-foreground">Add a vendor email on the truck profile first.</p>
      ) : null}
      {message ? <p className="text-[11px] text-muted-foreground">{message}</p> : null}
    </div>
  )
}
