"use client"

import { useEffect, useRef } from "react"
import L from "leaflet"
import "leaflet/dist/leaflet.css"
import { type FoodTruck } from "@/lib/data"

// Charlotte center coordinates
const CHARLOTTE_CENTER: [number, number] = [35.2271, -80.8431]
const DEFAULT_ZOOM = 12

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

      // Add popup
      marker.bindPopup(`
        <div class="map-popup">
          <strong>${truck.name}</strong>
          <div class="popup-cuisine">${truck.cuisine.join(", ")}</div>
          <div class="popup-status ${isOpen ? "open" : "closed"}">
            ${isOpen ? "Open Now" : "Closed"}
          </div>
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
          padding: 4px;
          min-width: 150px;
        }

        .map-popup strong {
          display: block;
          font-size: 14px;
          margin-bottom: 4px;
        }

        .popup-cuisine {
          font-size: 12px;
          color: hsl(var(--muted-foreground));
          margin-bottom: 4px;
        }

        .popup-status {
          font-size: 11px;
          font-weight: 600;
          padding: 2px 8px;
          border-radius: 4px;
          display: inline-block;
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
