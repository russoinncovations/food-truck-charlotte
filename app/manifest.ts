import type { MetadataRoute } from "next"
import { headers } from "next/headers"
import { ftcltWebManifestForRole } from "@/lib/ftclt-web-manifest"
import { getRoleSubdomainFromHost } from "@/lib/subdomain-routing"

export default async function manifest(): Promise<MetadataRoute.Manifest> {
  const hdrs = await headers()
  const rawHost = hdrs.get("x-forwarded-host") ?? hdrs.get("host")
  return ftcltWebManifestForRole(getRoleSubdomainFromHost(rawHost))
}
