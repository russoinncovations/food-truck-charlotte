/**
 * Single source of truth for the Carto light basemap (homepage preview + /map).
 * Do not duplicate tile URL/options elsewhere.
 */
export const CARTO_LIGHT_BASEMAP_URL =
  "https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png" as const

export const CARTO_LIGHT_ATTRIBUTION =
  '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>'

export const CARTO_LIGHT_TILE_OPTIONS = {
  attribution: CARTO_LIGHT_ATTRIBUTION,
  subdomains: "abcd",
  maxZoom: 20,
} as const
