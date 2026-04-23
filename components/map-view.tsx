"use client"

import { useEffect, useRef } from "react"
import L from "leaflet"
import "leaflet/dist/leaflet.css"
import { type FoodTruck } from "@/lib/data"

// Charlotte center coordinates
const CHARLOTTE_CENTER: [number, number] = [35.2271, -80.8431]
const DEFAULT_ZOOM = 12

function escapeHtml(text: string): string {
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
}

interface MapViewProps {
  trucks: FoodTruck[]
  selectedTruck: FoodTruck | null
  onSelectTruck: (truck: FoodTruck | null) => void
}

export default function MapView({ trucks, selectedTruck, onSelectTruck }: MapViewProps) {
  const mapRef = useRef<L.Map | null>(null)
  const markersRef = useRef<Map<string, L.Marker>>(new Map())
  const containerRef = useRef<HTMLDivElement>(null)

  // Initialize map
  useEffect(() => {
    if (!containerRef.current || mapRef.current) return

    mapRef.current = L.map(containerRef.current, {
      center: CHARLOTTE_CENTER,
      zoom: DEFAULT_ZOOM,
      zoomControl: false,
    })

    // Add zoom control to bottom right
    L.control.zoom({ position: "bottomright" }).addTo(mapRef.current)

    // Use CartoDB Positron tiles for a clean, modern look
    L.tileLayer("https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png", {
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>',
      subdomains: "abcd",
      maxZoom: 20,
    }).addTo(mapRef.current)

    return () => {
      if (mapRef.current) {
        mapRef.current.remove()
        mapRef.current = null
      }
    }
  }, [])

  // Update markers when trucks change
  useEffect(() => {
    if (!mapRef.current) return

    // Clear existing markers
    markersRef.current.forEach((marker) => marker.remove())
    markersRef.current.clear()

    // Add new markers
    trucks.forEach((truck) => {
      if (!truck.location) return

      const isSelected = selectedTruck?.id === truck.id
      const isOpen = truck.isOpen

      // Create custom icon
      const icon = L.divIcon({
        className: "custom-marker",
        html: `
          <div class="marker-container ${isSelected ? "selected" : ""} ${isOpen ? "open" : "closed"}">
            <div class="marker-pin">
              <svg viewBox="0 0 24 24" fill="currentColor" class="marker-icon">
                <path d="M18.92 6.01C18.72 5.42 18.16 5 17.5 5h-11c-.66 0-1.21.42-1.42 1.01L3 12v8c0 .55.45 1 1 1h1c.55 0 1-.45 1-1v-1h12v1c0 .55.45 1 1 1h1c.55 0 1-.45 1-1v-8l-2.08-5.99zM6.5 16c-.83 0-1.5-.67-1.5-1.5S5.67 13 6.5 13s1.5.67 1.5 1.5S7.33 16 6.5 16zm11 0c-.83 0-1.5-.67-1.5-1.5s.67-1.5 1.5-1.5 1.5.67 1.5 1.5-.67 1.5-1.5 1.5zM5 11l1.5-4.5h11L19 11H5z"/>
              </svg>
            </div>
            ${isOpen ? '<div class="pulse-ring"></div>' : ''}
          </div>
        `,
        iconSize: [40, 40],
        iconAnchor: [20, 40],
        popupAnchor: [0, -40],
      })

      const marker = L.marker([truck.location.lat, truck.location.lng], { icon })
        .addTo(mapRef.current!)
        .on("click", () => onSelectTruck(truck))

      const nameSafe = escapeHtml(truck.name)
      const cuisineSafe = escapeHtml(truck.cuisine.join(", ") || "—")
      const addressRaw = truck.location?.address?.trim() ?? ""
      const hasLocation = addressRaw.length > 0
      const addressSafe = hasLocation ? escapeHtml(addressRaw) : ""
      const statusLabel = isOpen ? "Open now" : "Not currently serving"
      const viewHref = `/trucks/${encodeURIComponent(truck.slug)}`

      // Add popup
      marker.bindPopup(`
        <div class="map-popup">
          <strong class="popup-title">${nameSafe}</strong>
          <div class="popup-section">
            <span class="popup-label">Cuisine</span>
            <div class="popup-cuisine">${cuisineSafe}</div>
          </div>
          ${
            hasLocation
              ? `<div class="popup-section">
            <span class="popup-label">Current location</span>
            <div class="popup-address-block">${addressSafe}</div>
          </div>`
              : '<div class="popup-section"><span class="popup-label">Current location</span><div class="popup-address-muted">Not specified</div></div>'
          }
          <div class="popup-section">
            <span class="popup-label">Status</span>
            <div class="popup-status ${isOpen ? "open" : "closed"}">${statusLabel}</div>
          </div>
          <a class="popup-view-truck" href="${viewHref}">View Truck</a>
        </div>
      `)

      markersRef.current.set(truck.id, marker)
    })
  }, [trucks, selectedTruck, onSelectTruck])

  // Pan to selected truck
  useEffect(() => {
    if (!mapRef.current || !selectedTruck?.location) return

    mapRef.current.setView(
      [selectedTruck.location.lat, selectedTruck.location.lng],
      14,
      { animate: true }
    )

    // Open popup for selected truck
    const marker = markersRef.current.get(selectedTruck.id)
    if (marker) {
      marker.openPopup()
    }
  }, [selectedTruck])

  return (
    <>
      <div ref={containerRef} className="h-full w-full" />
      <style jsx global>{`
        .custom-marker {
          background: none;
          border: none;
        }

        .marker-container {
          position: relative;
          width: 40px;
          height: 40px;
        }

        .marker-pin {
          position: absolute;
          width: 36px;
          height: 36px;
          background: hsl(var(--primary));
          border-radius: 50% 50% 50% 0;
          transform: rotate(-45deg);
          display: flex;
          align-items: center;
          justify-content: center;
          box-shadow: 0 2px 8px rgba(0, 0, 0, 0.3);
          transition: transform 0.2s, box-shadow 0.2s;
        }

        .marker-container.closed .marker-pin {
          background: hsl(var(--muted-foreground));
        }

        .marker-container.selected .marker-pin {
          transform: rotate(-45deg) scale(1.2);
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.4);
          z-index: 1000;
        }

        .marker-icon {
          width: 18px;
          height: 18px;
          transform: rotate(45deg);
          color: hsl(var(--primary-foreground));
        }

        .pulse-ring {
          position: absolute;
          top: 50%;
          left: 50%;
          transform: translate(-50%, -50%);
          width: 50px;
          height: 50px;
          border-radius: 50%;
          background: hsl(var(--primary) / 0.3);
          animation: pulse 2s ease-out infinite;
        }

        @keyframes pulse {
          0% {
            transform: translate(-50%, -50%) scale(0.5);
            opacity: 1;
          }
          100% {
            transform: translate(-50%, -50%) scale(1.5);
            opacity: 0;
          }
        }

        .map-popup {
          padding: 8px 10px 10px;
          min-width: 200px;
          max-width: 260px;
        }

        .map-popup .popup-title {
          display: block;
          font-size: 15px;
          margin-bottom: 8px;
          line-height: 1.3;
        }

        .map-popup .popup-section {
          margin-bottom: 8px;
        }

        .map-popup .popup-section:last-of-type {
          margin-bottom: 0;
        }

        .map-popup .popup-label {
          display: block;
          font-size: 10px;
          font-weight: 600;
          text-transform: uppercase;
          letter-spacing: 0.03em;
          color: hsl(var(--muted-foreground));
          margin-bottom: 2px;
        }

        .map-popup .popup-cuisine {
          font-size: 13px;
          color: hsl(var(--foreground));
          line-height: 1.35;
        }

        .map-popup .popup-address-block {
          font-size: 13px;
          color: hsl(var(--foreground));
          line-height: 1.4;
          word-break: break-word;
        }

        .map-popup .popup-address-muted {
          font-size: 12px;
          color: hsl(var(--muted-foreground));
        }

        .map-popup .popup-status {
          font-size: 12px;
          font-weight: 600;
          padding: 4px 8px;
          border-radius: 4px;
          display: inline-block;
        }

        .map-popup .popup-view-truck {
          display: block;
          text-align: center;
          margin-top: 10px;
          padding: 8px 12px;
          font-size: 13px;
          font-weight: 600;
          border-radius: 8px;
          background: hsl(var(--primary));
          color: hsl(var(--primary-foreground)) !important;
          text-decoration: none !important;
        }

        .map-popup .popup-view-truck:hover {
          filter: brightness(0.95);
        }

        .popup-status.open {
          background: hsl(142 76% 36% / 0.1);
          color: hsl(142 76% 36%);
        }

        .popup-status.closed {
          background: hsl(var(--muted));
          color: hsl(var(--muted-foreground));
        }

        .leaflet-popup-content-wrapper {
          border-radius: 12px;
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
        }

        .leaflet-popup-tip {
          background: white;
        }

        .leaflet-control-zoom {
          border: none !important;
          box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15) !important;
        }

        .leaflet-control-zoom a {
          background: hsl(var(--background)) !important;
          color: hsl(var(--foreground)) !important;
          border: none !important;
        }

        .leaflet-control-zoom a:hover {
          background: hsl(var(--muted)) !important;
        }
      `}</style>
    </>
  )
}
