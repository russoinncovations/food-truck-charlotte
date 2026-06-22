import type { SupabaseClient } from "@supabase/supabase-js"
import type { BookingInsertRow } from "@/lib/booking/complete-booking-request"
import {
  type BookingOpportunityRef,
  processBookingOpportunityNotifications,
} from "@/lib/email/booking-opportunity-notification"

/**
 * Notifies vendors about a new booking lead after opportunities are created.
 * @deprecated Prefer processBookingOpportunityNotifications with opportunity IDs.
 */
export async function sendBookingVendorLeadEmails(
  db: SupabaseClient,
  row: BookingInsertRow,
  opportunities: BookingOpportunityRef[],
  bookingRequestId?: string | null
): Promise<void> {
  await processBookingOpportunityNotifications(db, row, opportunities, bookingRequestId)
}
