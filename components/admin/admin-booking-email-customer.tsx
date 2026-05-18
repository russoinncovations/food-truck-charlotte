"use client"

import { useState } from "react"
import { Mail } from "lucide-react"
import type { BookingRequest } from "@/lib/booking-types"
import { buildBookingCustomerMailtoFromRequest } from "@/lib/admin/booking-customer-mailto"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"

type Props = {
  booking: BookingRequest
}

export function AdminBookingEmailCustomer({ booking }: Props) {
  const [note, setNote] = useState("")

  if (!booking.contact_email?.trim()) {
    return <p className="text-sm text-destructive">No customer email on file.</p>
  }

  return (
    <div className="space-y-3 w-full max-w-md">
      <div className="space-y-2">
        <Label htmlFor="admin-booking-email-note" className="text-xs text-muted-foreground">
          Note to include in email (optional)
        </Label>
        <Textarea
          id="admin-booking-email-note"
          value={note}
          onChange={(e) => setNote(e.target.value)}
          placeholder="e.g. Following up on vendors who can serve your date…"
          rows={3}
          className="resize-y text-sm"
        />
      </div>
      <Button
        type="button"
        variant="outline"
        size="sm"
        className="w-full sm:w-auto"
        onClick={() => {
          const href = buildBookingCustomerMailtoFromRequest(booking, note)
          if (href === "#") return
          window.location.href = href
        }}
      >
        <Mail className="h-4 w-4 mr-2" />
        Send Email
      </Button>
      <p className="text-xs text-muted-foreground leading-relaxed">
        Opens your email app with the organizer&apos;s address. The customer&apos;s email stays in the mailto and in
        the Contact section on this page.
      </p>
    </div>
  )
}
