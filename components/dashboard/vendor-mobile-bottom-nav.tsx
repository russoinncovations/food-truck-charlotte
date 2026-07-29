"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { Inbox, MoreHorizontal, Radio, Truck } from "lucide-react"
import { cn } from "@/lib/utils"

type Props = {
  pendingRequestCount?: number
  onMore: () => void
}

const REQUESTS_HREF = "/dashboard#vendor-requests-to-confirm"

/**
 * Mobile-only sticky bottom nav for core vendor tasks.
 */
export function VendorMobileBottomNav({ pendingRequestCount = 0, onMore }: Props) {
  const pathname = usePathname()

  const requestsActive = pathname === "/dashboard" || pathname === "/dashboard/"
  const liveActive = pathname === "/dashboard/live" || pathname.startsWith("/dashboard/live/")
  const profileActive =
    pathname === "/dashboard/profile" || pathname.startsWith("/dashboard/profile/")

  const badge =
    pendingRequestCount > 0 ? (pendingRequestCount > 9 ? "9+" : String(pendingRequestCount)) : null

  return (
    <nav
      className="fixed inset-x-0 bottom-0 z-50 border-t bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/80 md:hidden"
      style={{ paddingBottom: "env(safe-area-inset-bottom, 0px)" }}
      aria-label="Vendor shortcuts"
    >
      <div className="grid h-16 grid-cols-4">
        <Link
          href={REQUESTS_HREF}
          className={cn(
            "relative flex flex-col items-center justify-center gap-0.5 text-[11px] font-medium",
            requestsActive ? "text-primary" : "text-muted-foreground"
          )}
        >
          <span className="relative">
            <Inbox className="h-5 w-5" aria-hidden />
            {badge ? (
              <span className="absolute -right-2.5 -top-1.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-primary px-1 text-[10px] font-semibold leading-none text-primary-foreground">
                {badge}
              </span>
            ) : null}
          </span>
          Requests
        </Link>

        <Link
          href="/dashboard/live"
          className={cn(
            "flex flex-col items-center justify-center gap-0.5 text-[11px] font-medium",
            liveActive ? "text-primary" : "text-muted-foreground"
          )}
        >
          <Radio className="h-5 w-5" aria-hidden />
          Go Live
        </Link>

        <Link
          href="/dashboard/profile"
          className={cn(
            "flex flex-col items-center justify-center gap-0.5 text-[11px] font-medium",
            profileActive ? "text-primary" : "text-muted-foreground"
          )}
        >
          <Truck className="h-5 w-5" aria-hidden />
          Profile
        </Link>

        <button
          type="button"
          onClick={onMore}
          className="flex flex-col items-center justify-center gap-0.5 text-[11px] font-medium text-muted-foreground"
        >
          <MoreHorizontal className="h-5 w-5" aria-hidden />
          More
        </button>
      </div>
    </nav>
  )
}
