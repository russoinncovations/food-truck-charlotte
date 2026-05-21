"use client"

import { useEffect, useState } from "react"
import { X } from "lucide-react"
import { Button } from "@/components/ui/button"

const STORAGE_KEY = "ftclt-map-add-home-dismissed"

export function MapAddToHomePrompt() {
  const [hidden, setHidden] = useState(true)

  useEffect(() => {
    const standalone =
      typeof window !== "undefined" &&
      (window.matchMedia("(display-mode: standalone)").matches ||
        (navigator as Navigator & { standalone?: boolean }).standalone === true)

    try {
      if (standalone || localStorage.getItem(STORAGE_KEY) === "1") {
        return
      }
    } catch {
      return
    }
    setHidden(false)
  }, [])

  function dismiss() {
    try {
      localStorage.setItem(STORAGE_KEY, "1")
    } catch {
      // ignore quota / privacy mode
    }
    setHidden(true)
  }

  if (hidden) return null

  return (
    <div className="shrink-0 border-b border-primary/30 bg-primary/5 px-3 py-2.5 md:py-3">
      <div className="mx-auto flex max-w-6xl gap-3 sm:gap-4">
        <div className="min-w-0 flex-1 text-xs sm:text-sm leading-snug text-foreground">
          <p className="font-medium text-foreground">Add the live map to your phone</p>
          <p className="text-muted-foreground mt-1">
            Open FoodTruckCLT like an app to see who&apos;s serving nearby.
          </p>
          <ul className="mt-2 space-y-0.5 text-muted-foreground">
            <li>
              <span className="font-medium text-foreground">iPhone:</span> Tap Share → Add to Home Screen
            </li>
            <li>
              <span className="font-medium text-foreground">Android:</span> Tap menu → Add to Home screen
            </li>
          </ul>
        </div>
        <Button
          type="button"
          variant="ghost"
          size="icon"
          className="h-8 w-8 shrink-0 text-muted-foreground"
          aria-label="Dismiss"
          onClick={dismiss}
        >
          <X className="h-4 w-4" />
        </Button>
      </div>
    </div>
  )
}
