import type { MetadataRoute } from "next"
import { FTCLT_BRAND_THEME_COLOR } from "@/lib/brand-colors"
import { cachedPwaIconHref } from "@/lib/pwa-icon-cache"

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "FoodTruckCLT",
    short_name: "FoodTruckCLT",
    description: "Charlotte food trucks — live map, booking, and community.",
    start_url: "/map",
    scope: "/",
    display: "standalone",
    background_color: "#ffffff",
    theme_color: FTCLT_BRAND_THEME_COLOR,
    icons: [
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
    ],
  }
}
