import type { MetadataRoute } from "next"
import type { FtcltRoleHost } from "@/lib/subdomain-routing"
import { FTCLT_BRAND_THEME_COLOR } from "@/lib/brand-colors"
import { cachedPwaIconHref } from "@/lib/pwa-icon-cache"

function brandIcons(): NonNullable<MetadataRoute.Manifest["icons"]> {
  return [
    {
      src: cachedPwaIconHref("/icon-192.png"),
      sizes: "192x192",
      type: "image/png",
    },
    {
      src: cachedPwaIconHref("/icon-512.png"),
      sizes: "512x512",
      type: "image/png",
    },
    {
      src: cachedPwaIconHref("/favicon.ico"),
      sizes: "any",
      type: "image/x-icon",
    },
  ]
}

/** Customer / live subdomain — installs open the map. */
function consumerManifest(): MetadataRoute.Manifest {
  return {
    name: "FoodTruckCLT",
    short_name: "FoodTruckCLT",
    description: "Charlotte food trucks — live map, booking, and community.",
    start_url: "/map",
    scope: "/",
    display: "standalone",
    background_color: "#ffffff",
    theme_color: FTCLT_BRAND_THEME_COLOR,
    icons: brandIcons(),
  }
}

function vendorManifest(): MetadataRoute.Manifest {
  return {
    name: "FoodTruckCLT Vendor",
    short_name: "FTruck Vendor",
    description: "Go live on the FoodTruckCLT map and manage vendor requests.",
    start_url: "/dashboard/live",
    scope: "/",
    display: "standalone",
    background_color: "#ffffff",
    theme_color: FTCLT_BRAND_THEME_COLOR,
    icons: brandIcons(),
  }
}

function adminManifest(): MetadataRoute.Manifest {
  return {
    name: "FoodTruckCLT Admin",
    short_name: "FTCLT Admin",
    description: "Admin command center — bookings, vendors, events, and site checks.",
    start_url: "/admin",
    scope: "/",
    display: "standalone",
    background_color: "#ffffff",
    theme_color: FTCLT_BRAND_THEME_COLOR,
    icons: brandIcons(),
  }
}

/**
 * Web manifest for PWA installs. `vendor`/`admin` are distinct; `live` matches consumers (`/map`).
 */
export function ftcltWebManifestForRole(role: FtcltRoleHost | null): MetadataRoute.Manifest {
  if (role === "vendor") return vendorManifest()
  if (role === "admin") return adminManifest()
  return consumerManifest()
}
