import { setBookingRequestLifecycleStatus } from "@/lib/admin/booking-lifecycle-actions"
import { Button } from "@/components/ui/button"
import type { BookingStatus } from "@/lib/booking-types"

type Props = {
  bookingId: string
  adminKey: string
  status: BookingStatus
}

export function AdminBookingLifecycleActions({ bookingId, adminKey, status }: Props) {
  const terminal = status === "fulfilled" || status === "closed"

  return (
    <div className="space-y-3">
      <p className="text-xs text-muted-foreground leading-relaxed">
        Closing or fulfilling a request removes it from vendor dashboards and blocks further vendor responses. History is
        kept under vendor routing below.
      </p>
      <div className="flex flex-col gap-2">
        <form action={setBookingRequestLifecycleStatus}>
          <input type="hidden" name="adminKey" value={adminKey} />
          <input type="hidden" name="bookingId" value={bookingId} />
          <input type="hidden" name="status" value="fulfilled" />
          <Button type="submit" variant="default" size="sm" className="w-full" disabled={terminal}>
            Mark fulfilled
          </Button>
        </form>
        <form action={setBookingRequestLifecycleStatus}>
          <input type="hidden" name="adminKey" value={adminKey} />
          <input type="hidden" name="bookingId" value={bookingId} />
          <input type="hidden" name="status" value="closed" />
          <Button type="submit" variant="outline" size="sm" className="w-full" disabled={terminal}>
            Close request
          </Button>
        </form>
        {terminal ? (
          <form action={setBookingRequestLifecycleStatus}>
            <input type="hidden" name="adminKey" value={adminKey} />
            <input type="hidden" name="bookingId" value={bookingId} />
            <input type="hidden" name="status" value="new" />
            <Button type="submit" variant="secondary" size="sm" className="w-full">
              Reopen request
            </Button>
          </form>
        ) : null}
      </div>
    </div>
  )
}
