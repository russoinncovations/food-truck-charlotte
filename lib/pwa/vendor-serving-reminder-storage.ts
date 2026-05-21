/** Client-only reminder (“serving until”) for /dashboard/live — not synced to backend. */

export function servingReminderStorageKey(truckId: string): string {
  return `ftclt-serving-until-reminder:${truckId.trim()}`
}

export function readServingReminderUntilIso(truckId: string): string | null {
  if (typeof window === "undefined") return null
  try {
    const raw = sessionStorage.getItem(servingReminderStorageKey(truckId))
    const t = (raw ?? "").trim()
    if (!t) return null
    const d = Date.parse(t)
    if (!Number.isFinite(d)) return null
    return new Date(d).toISOString()
  } catch {
    return null
  }
}

export function writeServingReminderUntilIso(truckId: string, iso: string): void {
  try {
    sessionStorage.setItem(servingReminderStorageKey(truckId), iso)
  } catch {
    // ignore
  }
}

export function clearServingReminder(truckId: string): void {
  try {
    sessionStorage.removeItem(servingReminderStorageKey(truckId))
  } catch {
    // ignore
  }
}

export function extendServingReminderHours(truckId: string, hours: number): string | null {
  const ms = Math.round(hours * 3600_000)
  if (!Number.isFinite(ms) || ms <= 0) return null
  const prev = readServingReminderUntilIso(truckId)
  const base = prev != null ? Date.parse(prev) : Date.now()
  if (!Number.isFinite(base)) return null
  const next = Math.max(Date.now(), base) + ms
  const iso = new Date(next).toISOString()
  writeServingReminderUntilIso(truckId, iso)
  return iso
}

export function setServingReminderHoursFromNow(truckId: string, hours: number): string | null {
  const ms = Math.round(hours * 3600_000)
  if (!Number.isFinite(ms) || ms <= 0) return null
  const iso = new Date(Date.now() + ms).toISOString()
  writeServingReminderUntilIso(truckId, iso)
  return iso
}
