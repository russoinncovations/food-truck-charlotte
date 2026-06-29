/** True when a new booking row includes a non-empty event start time. */
export function isBookingStartTimePresent(startTime: string | null | undefined): boolean {
  return Boolean(String(startTime ?? "").trim())
}

export const BOOKING_START_TIME_REQUIRED_MESSAGE = "Event start time is required."
