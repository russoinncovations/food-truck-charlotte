/**
 * Sanitize `next` from Supabase OAuth/magic-link callbacks.
 * Prevents open redirects; only same-origin relative paths allowed.
 */
export function safeAuthNextPath(raw: string | null, fallback: string): string {
  const fb = fallback.startsWith("/") ? fallback : "/dashboard"
  if (raw == null || raw.trim() === "") return fb
  let n: string
  try {
    n = decodeURIComponent(raw.trim())
  } catch {
    return fb
  }
  if (!n.startsWith("/") || n.startsWith("//")) return fb
  if (/[\r\n\0]/.test(n)) return fb
  if (n.includes("://") || n.includes("\\")) return fb
  return n
}
