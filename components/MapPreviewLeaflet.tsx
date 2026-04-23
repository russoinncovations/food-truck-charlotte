"use client"

import { useEffect, useRef, useState } from "react"
import L from "leaflet"
import "leaflet/dist/leaflet.css"
import { CARTO_LIGHT_BASEMAP_URL, CARTO_LIGHT_TILE_OPTIONS } from "@/lib/leaflet-basemap"

const CHARLOTTE_CENTER: [number, number] = [35.2271, -80.8431]
const DEFAULT_ZOOM = 12
const MAP_PREVIEW_LOG = "[MapPreviewLeaflet]"

export type MapPreviewMapPoint = {
  id: string
  name: string
  slug: string
  lat: number
  lng: number
}

function escHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
}

const MARKER_ORANGE = "#D94F1E"

export default function MapPreviewLeaflet({
  points,
}: {
  points: MapPreviewMapPoint[]
}) {
  const containerRef = useRef<HTMLDivElement>(null)
  const mapRef = useRef<L.Map | null>(null)
  const markersLayerRef = useRef<L.LayerGroup | null>(null)
  const [mapReady, setMapReady] = useState(false)

  useEffect(() => {
    const el = containerRef.current
    if (!el || mapRef.current) return

    const map = L.map(el, {
      center: CHARLOTTE_CENTER,
      zoom: DEFAULT_ZOOM,
      zoomControl: true,
    })
    mapRef.current = map
    const isDev = process.env.NODE_ENV === "development"
    if (isDev) {
      console.log(MAP_PREVIEW_LOG, "map initialized", { center: map.getCenter(), zoom: map.getZoom() })
    }

    // Match /map: basemap first, then other layers.
    const tileLayer = L.tileLayer(CARTO_LIGHT_BASEMAP_URL, { ...CARTO_LIGHT_TILE_OPTIONS })
    tileLayer.addTo(map)
    if (isDev) {
      console.log(MAP_PREVIEW_LOG, "tile layer added to map", tileLayer)
      tileLayer.on("tileload", (e: L.TileEvent) => {
        console.log(MAP_PREVIEW_LOG, "tileload", (e as L.TileEvent & { tile: HTMLImageElement }).tile?.src)
      })
      tileLayer.on("tileerror", (e) => {
        console.error(MAP_PREVIEW_LOG, "tileerror", e)
      })
    }

    markersLayerRef.current = L.layerGroup().addTo(map)

    const bumpSize = () => {
      map.invalidateSize({ animate: false })
    }
    map.whenReady(() => {
      if (isDev) {
        console.log(MAP_PREVIEW_LOG, "map whenReady (invalidateSize)")
      }
      bumpSize()
      requestAnimationFrame(bumpSize)
    })
    requestAnimationFrame(bumpSize)
    setTimeout(bumpSize, 0)
    setTimeout(bumpSize, 100)

    setMapReady(true)

    return () => {
      markersLayerRef.current = null
      map.remove()
      mapRef.current = null
      setMapReady(false)
    }
  }, [])

  useEffect(() => {
    if (!mapReady || !mapRef.current || !containerRef.current) return
    const map = mapRef.current
    const el = containerRef.current

    const invalidate = () => {
      map.invalidateSize({ animate: false })
    }

    invalidate()
    let rafInner = 0
    const rafOuter = requestAnimationFrame(() => {
      rafInner = requestAnimationFrame(invalidate)
    })
    const t1 = setTimeout(invalidate, 100)
    const t2 = setTimeout(invalidate, 400)

    const ro = new ResizeObserver(() => invalidate())
    ro.observe(el)

    const io = new IntersectionObserver(
      (entries) => {
        if (entries.some((e) => e.isIntersecting)) {
          invalidate()
        }
      },
      { threshold: 0.01 },
    )
    io.observe(el)

    if (typeof window !== "undefined") {
      window.addEventListener("resize", invalidate)
    }

    return () => {
      cancelAnimationFrame(rafOuter)
      cancelAnimationFrame(rafInner)
      clearTimeout(t1)
      clearTimeout(t2)
      ro.disconnect()
      io.disconnect()
      if (typeof window !== "undefined") {
        window.removeEventListener("resize", invalidate)
      }
    }
  }, [mapReady])

  useEffect(() => {
    if (!mapRef.current || !markersLayerRef.current) return
    const map = mapRef.current
    const layer = markersLayerRef.current
    layer.clearLayers()

    const valid = points.filter((p) => Number.isFinite(p.lat) && Number.isFinite(p.lng))
    if (valid.length === 0) {
      map.setView(CHARLOTTE_CENTER, DEFAULT_ZOOM)
      return
    }

    const latLngs: L.LatLng[] = []
    for (const p of valid) {
      const ll = L.latLng(p.lat, p.lng)
      latLngs.push(ll)
      const m = L.circleMarker(ll, {
        radius: 8,
        color: MARKER_ORANGE,
        weight: 2,
        fillColor: MARKER_ORANGE,
        fillOpacity: 0.85,
      })
      m.bindPopup(
        `<strong>${escHtml(p.name)}</strong><br/><a href="/trucks/${encodeURIComponent(p.slug)}">View truck</a>`,
      )
      m.addTo(layer)
    }

    if (latLngs.length === 1) {
      map.setView(latLngs[0], 13)
    } else {
      map.fitBounds(L.latLngBounds(latLngs), { padding: [40, 40], maxZoom: 14 })
    }
  }, [points, mapReady])

  return (
    <div
      ref={containerRef}
      className="h-full w-full min-h-[240px] lg:min-h-[500px]"
      style={{ width: "100%", minWidth: "100%" }}
    />
  )
}
