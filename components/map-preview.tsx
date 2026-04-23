"use client"

import { useEffect, useRef, useState } from "react"
import Link from "next/link"
import Image from "next/image"
import L from "leaflet"
import "leaflet/dist/leaflet.css"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Navigation, ArrowRight } from "lucide-react"
import { createClient } from "@/lib/supabase/client"

const CHARLOTTE_CENTER: [number, number] = [35.2271, -80.8431]
const DEFAULT_ZOOM = 12
const CARTO_TILE =
  "https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png"
const CARTO_ATTRIB =
  '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>'

const TRUCK_IMAGES = [
  "https://images.unsplash.com/photo-1687351977296-e909232009b4?w=400&h=300&fit=crop",
  "https://images.unsplash.com/photo-1509315811345-672d83ef2fbc?w=400&h=300&fit=crop",
  "https://images.unsplash.com/photo-1626186241349-5d5f44407f55?w=400&h=300&fit=crop",
  "https://images.unsplash.com/photo-1563861019306-9cccb83bdf0c?w=400&h=300&fit=crop",
  "https://images.unsplash.com/photo-1519861155730-0b5fbf0dd889?w=400&h=300&fit=crop",
  "https://images.unsplash.com/photo-1726868734684-ce396eef668e?w=400&h=300&fit=crop",
  "https://images.unsplash.com/photo-1669039415113-48f87a568fdd?w=400&h=300&fit=crop",
]

function getTruckImage(truckId: string): string {
  const index =
    truckId.split("").reduce((acc, c) => acc + c.charCodeAt(0), 0) % TRUCK_IMAGES.length
  return TRUCK_IMAGES[index]
}

type ServingTruckRow = {
  id: string
  name: string
  slug: string
  cuisine: string | string[] | null
  latitude: number | string | null
  longitude: number | string | null
  serving_today: boolean | null
  today_location: string | null
}

type MapPoint = { id: string; name: string; slug: string; lat: number; lng: number }

function escHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
}

const MARKER_ORANGE = "#D94F1E"

function MapPreviewLeaflet({ points }: { points: MapPoint[] }) {
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
    markersLayerRef.current = L.layerGroup().addTo(map)

    L.tileLayer(CARTO_TILE, {
      attribution: CARTO_ATTRIB,
      subdomains: "abcd",
      maxZoom: 20,
    }).addTo(map)

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

    window.addEventListener("resize", invalidate)

    return () => {
      cancelAnimationFrame(rafOuter)
      cancelAnimationFrame(rafInner)
      clearTimeout(t1)
      clearTimeout(t2)
      ro.disconnect()
      io.disconnect()
      window.removeEventListener("resize", invalidate)
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

export function MapPreview() {
  const [openTrucks, setOpenTrucks] = useState<ServingTruckRow[]>([])

  useEffect(() => {
    let cancelled = false

    async function load() {
      const supabase = createClient()
      const { data } = await supabase
        .from("trucks")
        .select("id, name, slug, cuisine, latitude, longitude, serving_today, today_location")
        .eq("serving_today", true)
        .limit(5)

      if (!cancelled) {
        setOpenTrucks((data as ServingTruckRow[] | null) ?? [])
      }
    }

    void load()
    return () => {
      cancelled = true
    }
  }, [])

  const mapPoints: MapPoint[] = openTrucks
    .map((t) => {
      const lat = Number(t.latitude)
      const lng = Number(t.longitude)
      if (!Number.isFinite(lat) || !Number.isFinite(lng)) return null
      return { id: t.id, name: t.name, slug: t.slug, lat, lng }
    })
    .filter((p): p is MapPoint => p !== null)

  return (
    <section className="py-16 md:py-24 bg-muted/30">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="flex items-end justify-between mb-8">
          <div>
            <h2 className="font-display text-2xl md:text-3xl font-bold text-foreground">
              Live truck map
            </h2>
            <p className="mt-2 text-muted-foreground">
              See where trucks are right now across Charlotte neighborhoods.
            </p>
          </div>
          <Button variant="outline" asChild className="hidden md:flex">
            <Link href="/map" className="flex items-center gap-2">
              Open full map
              <ArrowRight className="h-4 w-4" />
            </Link>
          </Button>
        </div>

        {/* Map Preview Card */}
        <Card className="overflow-hidden">
          <div className="grid lg:grid-cols-3">
            <div className="lg:col-span-2 group relative w-full aspect-[4/3] lg:aspect-auto lg:h-[500px] lg:min-h-[500px] bg-[#f2efe9]">
              <div className="absolute inset-0 z-0 h-full w-full min-h-[inherit]">
                <MapPreviewLeaflet points={mapPoints} />
              </div>

              <div className="absolute inset-0 z-10 flex items-center justify-center bg-foreground/10 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none group-hover:pointer-events-auto">
                <Button size="lg" asChild>
                  <Link href="/map" className="flex items-center gap-2">
                    <Navigation className="h-5 w-5" />
                    Open Full Map
                  </Link>
                </Button>
              </div>

              <div className="absolute bottom-4 left-4 z-20 bg-background/95 backdrop-blur rounded-lg p-3 shadow-lg pointer-events-none">
                <div className="flex items-center gap-4 text-sm">
                  <div className="flex items-center gap-2">
                    <div className="h-3 w-3 rounded-full bg-primary" />
                    <span className="text-muted-foreground">Food Truck</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="h-3 w-3 rounded-full bg-accent" />
                    <span className="text-muted-foreground">Event</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Truck List Sidebar */}
            <div className="p-6 bg-background border-t lg:border-t-0 lg:border-l">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <span className="relative flex h-2 w-2">
                    <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-green-500 opacity-75" />
                    <span className="relative inline-flex h-2 w-2 rounded-full bg-green-500" />
                  </span>
                  <h3 className="font-semibold text-foreground">Open now</h3>
                </div>
                <span className="text-sm text-muted-foreground">{openTrucks.length} serving</span>
              </div>

              <div className="space-y-2">
                {openTrucks.length === 0 ? (
                  <p className="text-sm text-muted-foreground py-2">
                    No trucks serving right now — check back soon
                  </p>
                ) : (
                  openTrucks.map((truck) => (
                    <Link
                      key={truck.id}
                      href={`/trucks/${truck.slug}`}
                      className="flex items-center gap-3 p-3 rounded-lg hover:bg-muted/50 transition-colors"
                    >
                      <div className="relative h-11 w-11 rounded-lg overflow-hidden shrink-0">
                        <Image
                          src={getTruckImage(truck.id)}
                          alt={truck.name}
                          fill
                          className="object-cover"
                        />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-foreground truncate text-sm">
                          {truck.name}
                        </p>
                        <p className="text-xs text-muted-foreground truncate">
                          {truck.today_location?.trim()
                            ? truck.today_location
                            : "Location not set"}
                        </p>
                      </div>
                    </Link>
                  ))
                )}
              </div>

              <Button asChild className="w-full mt-4">
                <Link href="/map" className="flex items-center justify-center gap-2">
                  <Navigation className="h-4 w-4" />
                  Open live map
                </Link>
              </Button>
            </div>
          </div>
        </Card>
      </div>
    </section>
  )
}
