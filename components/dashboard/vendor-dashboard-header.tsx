"use client"

import { useState } from "react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet"
import { VendorNavLinks } from "@/components/dashboard/vendor-dashboard-nav"
import { VendorMobileBottomNav } from "@/components/dashboard/vendor-mobile-bottom-nav"
import { Menu, Settings, Truck } from "lucide-react"

type Props = {
  truckNameInitial: string
  pendingRequestCount?: number
}

/**
 * Sticky header: hamburger opens the same links as the desktop sidebar on small screens.
 * Mobile also gets a sticky bottom nav for core vendor tasks.
 */
export function VendorDashboardHeader({ truckNameInitial, pendingRequestCount = 0 }: Props) {
  const [menuOpen, setMenuOpen] = useState(false)

  return (
    <>
      <header className="sticky top-0 z-50 bg-background border-b">
        <div className="flex items-center justify-between h-16 px-4 md:px-6">
          <div className="flex items-center gap-4 min-w-0">
            <Sheet open={menuOpen} onOpenChange={setMenuOpen}>
              <SheetTrigger asChild>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="md:hidden shrink-0"
                  aria-label="Open navigation"
                  aria-expanded={menuOpen}
                >
                  <Menu className="h-5 w-5" />
                </Button>
              </SheetTrigger>
              <SheetContent side="left" className="w-[min(100%,20rem)] p-0">
                <SheetHeader className="p-4 border-b text-left">
                  <SheetTitle className="font-display">Menu</SheetTitle>
                </SheetHeader>
                <div className="p-4 overflow-y-auto max-h-[calc(100vh-5rem)]">
                  <VendorNavLinks
                    onNavigate={() => setMenuOpen(false)}
                    pendingRequestCount={pendingRequestCount}
                  />
                </div>
              </SheetContent>
            </Sheet>
            <Link href="/dashboard" className="flex items-center gap-2 min-w-0">
              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-primary">
                <Truck className="h-4 w-4 text-primary-foreground" />
              </div>
              <span className="font-display font-bold hidden sm:block truncate">FoodTruck CLT</span>
            </Link>
            <Badge variant="secondary" className="hidden md:flex shrink-0">
              Vendor Dashboard
            </Badge>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <Button variant="ghost" size="icon" asChild>
              <Link href="/dashboard/settings" aria-label="Settings">
                <Settings className="h-5 w-5" />
              </Link>
            </Button>
            <div
              className="h-8 w-8 rounded-full bg-primary flex items-center justify-center text-white text-sm font-bold"
              aria-hidden
            >
              {truckNameInitial}
            </div>
          </div>
        </div>
      </header>

      <VendorMobileBottomNav
        pendingRequestCount={pendingRequestCount}
        onMore={() => setMenuOpen(true)}
      />
    </>
  )
}
