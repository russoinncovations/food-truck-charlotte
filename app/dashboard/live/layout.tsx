import type { Metadata } from "next"
import type { ReactNode } from "react"
import { PWA_ICON_CACHE_QUERY } from "@/lib/pwa-icon-cache"

/** Force vendor web app manifest for this subtree (distinct id/scope vs consumer `/manifest.webmanifest`). */
export const metadata: Metadata = {
  manifest: `/manifest-vendor.webmanifest${PWA_ICON_CACHE_QUERY}`,
}

export default function DashboardLiveLayout({ children }: { children: ReactNode }) {
  return <>{children}</>
}
