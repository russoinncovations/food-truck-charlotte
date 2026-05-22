/**
 * Bump `PWA_ICON_CACHE_QUERY` when regenerating PNG/ICO via `npm run generate:pwa-icons`
 * so clients refetch icons instead of using stale CDN / home-screen caches.
 *
 * Must stay in sync with `icon[].src` query strings in `public/manifest-vendor.webmanifest`
 * (same `?v=N` suffix as here).
 */
export const PWA_ICON_CACHE_QUERY = '?v=2'

export type PwaStaticIconPath =
  | '/icon-192.png'
  | '/icon-512.png'
  | '/apple-touch-icon.png'
  | '/favicon.ico'

export function cachedPwaIconHref(path: PwaStaticIconPath): string {
  return `${path}${PWA_ICON_CACHE_QUERY}`
}
