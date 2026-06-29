const EASTERN_TZ = "America/New_York"

function parseDateParts(dateStr: string): { year: number; month: number; day: number } | null {
  const m = dateStr.trim().match(/^(\d{4})-(\d{2})-(\d{2})$/)
  if (!m) return null
  return {
    year: Number(m[1]),
    month: Number(m[2]),
    day: Number(m[3]),
  }
}

function parseTimeParts(timeStr: string | null | undefined): { hour: number; minute: number } | null {
  const raw = (timeStr ?? "").trim()
  if (!raw) return null
  const m = raw.match(/^(\d{1,2}):(\d{2})/)
  if (!m) return null
  const hour = Number(m[1])
  const minute = Number(m[2])
  if (hour < 0 || hour > 23 || minute < 0 || minute > 59) return null
  return { hour, minute }
}

function easternOffsetMinutes(utcDate: Date): number {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone: EASTERN_TZ,
    timeZoneName: "shortOffset",
  }).formatToParts(utcDate)
  const label = parts.find((p) => p.type === "timeZoneName")?.value ?? "GMT-5"
  const match = label.match(/GMT([+-])(\d{1,2})(?::(\d{2}))?/)
  if (!match) return -5 * 60
  const sign = match[1] === "+" ? 1 : -1
  return sign * (Number(match[2]) * 60 + Number(match[3] ?? "0"))
}

export function bookingOpportunityExpiresAt(
  eventDate: string | null | undefined,
  endTime?: string | null,
  startTime?: string | null
): string | null {
  const parts = eventDate ? parseDateParts(eventDate) : null
  if (!parts) return null
  const time = parseTimeParts(endTime) ?? parseTimeParts(startTime) ?? { hour: 23, minute: 59 }
  const naiveUtcMs = Date.UTC(parts.year, parts.month - 1, parts.day, time.hour, time.minute, 0)
  const offset = easternOffsetMinutes(new Date(naiveUtcMs))
  return new Date(naiveUtcMs - offset * 60_000).toISOString()
}

export function isBookingOpportunityExpired(
  eventDate: string | null | undefined,
  endTime?: string | null,
  startTime?: string | null,
  now = new Date()
): boolean {
  const expiresAt = bookingOpportunityExpiresAt(eventDate, endTime, startTime)
  if (!expiresAt) return false
  return new Date(expiresAt).getTime() <= now.getTime()
}
