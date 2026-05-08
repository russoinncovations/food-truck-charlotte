/** Base URL for links in server-sent email (matches vendor dashboard logic). */
export function getPublicSiteBase(): string {
  const fromEnv = process.env.NEXT_PUBLIC_APP_URL?.trim()
  if (fromEnv) return fromEnv.replace(/\/$/, "")
  const v = process.env.VERCEL_URL?.trim()
  if (v) {
    const host = v.replace(/^https?:\/\//, "")
    return `https://${host.replace(/\/$/, "")}`
  }
  return "https://www.foodtruckclt.com"
}
