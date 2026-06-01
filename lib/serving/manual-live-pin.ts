/** Manual Go Live pins expire from the public map after this window without a refresh. */
export const MANUAL_LIVE_PIN_MAX_AGE_MS = 6 * 60 * 60 * 1000

export type ManualLivePinFields = {
  serving_today?: boolean | null
  serving_started_at?: string | null
}

function startedAtMs(iso: string | null | undefined): number | null {
  if (!iso) return null
  const ms = new Date(iso).getTime()
  return Number.isNaN(ms) ? null : ms
}

/** True when the truck is manually live and within the freshness window. */
export function isFreshManualLivePin(row: ManualLivePinFields): boolean {
  if (row.serving_today !== true) return false
  const started = startedAtMs(row.serving_started_at)
  if (started == null) return false
  return Date.now() - started <= MANUAL_LIVE_PIN_MAX_AGE_MS
}

/** True when serving_today is still set but the pin is too old (or missing a start time). */
export function isStaleManualLivePin(row: ManualLivePinFields): boolean {
  return row.serving_today === true && !isFreshManualLivePin(row)
}
