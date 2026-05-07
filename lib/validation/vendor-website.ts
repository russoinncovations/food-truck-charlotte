/**
 * Accepts optional website values from vendor signup: plain domains, www hosts,
 * or http(s) URLs. Rejects empty string only as invalid when used after trim for required checks;
 * for optional fields, pass "" and receive true.
 */
export function isPlausibleVendorWebsiteInput(raw: string): boolean {
  const s = raw.trim()
  if (!s) return true
  if (s.length > 2048) return false
  if (/\s/.test(s)) return false
  if (/[<>]/.test(s)) return false
  if (/javascript:/i.test(s) || /data:/i.test(s)) return false

  const lower = s.toLowerCase()
  if (/^[a-z][a-z0-9+.-]*:/i.test(s)) {
    if (!lower.startsWith("http://") && !lower.startsWith("https://")) {
      return false
    }
  }

  let rest = s.replace(/^https?:\/\//i, "")
  if (rest.startsWith("//")) return false
  const hostAndMaybePath = rest.split(/[/?#]/)[0] ?? ""
  if (!hostAndMaybePath) return false
  const hostname = hostAndMaybePath.includes("[")
    ? hostAndMaybePath
    : hostAndMaybePath.split(":")[0] ?? ""

  if (!hostname || hostname.includes("@")) return false
  const labels = hostname.split(".")
  if (labels.length < 2) return false
  if (labels.some((label) => !label || label.length > 63)) return false
  const tld = labels[labels.length - 1]
  if (!/^[a-z0-9]{2,63}$/i.test(tld)) return false
  for (const label of labels) {
    if (!/^[a-z0-9]([a-z0-9-]*[a-z0-9])?$/i.test(label)) return false
  }
  return true
}
