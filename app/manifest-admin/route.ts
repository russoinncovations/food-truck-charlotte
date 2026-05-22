import { NextResponse } from "next/server"
import { ftcltWebManifestForRole } from "@/lib/ftclt-web-manifest"

/** Alias payload for `/manifest-admin.webmanifest` (rewrite). Admin subdomain should use `/manifest.webmanifest`. */
export function GET(): NextResponse {
  const body = ftcltWebManifestForRole("admin")
  return NextResponse.json(body, {
    headers: {
      "Content-Type": "application/manifest+json; charset=utf-8",
      "Cache-Control": "public, max-age=0, must-revalidate",
    },
  })
}
