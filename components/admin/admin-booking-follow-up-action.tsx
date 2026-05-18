import { MessageCircle } from "lucide-react"
import type { BookingRequest } from "@/lib/booking-types"
import { buildBookingFollowUpMailtoFromRequest } from "@/lib/admin/booking-follow-up-mailto"
import { Button } from "@/components/ui/button"

type Props = {
  booking: BookingRequest
}

/** Opens a prefilled mailto to the customer — admin follow-up only; never sends automatically. */
export function AdminBookingFollowUpAction({ booking }: Props) {
  const email = booking.contact_email?.trim()
  const href = email ? buildBookingFollowUpMailtoFromRequest(booking) : null

  if (!email || !href) {
    return (
      <div className="flex flex-col gap-1 w-full max-w-md sm:items-end">
        <Button type="button" variant="outline" size="sm" disabled className="w-full sm:w-auto shrink-0">
          <MessageCircle className="h-4 w-4 mr-2" />
          Follow up
        </Button>
        <p className="text-xs text-muted-foreground sm:text-right">No email available</p>
      </div>
    )
  }

  return (
    <Button variant="outline" size="sm" className="w-full sm:w-auto shrink-0" asChild>
      <a href={href}>
        <MessageCircle className="h-4 w-4 mr-2" />
        Follow up
      </a>
    </Button>
  )
}
