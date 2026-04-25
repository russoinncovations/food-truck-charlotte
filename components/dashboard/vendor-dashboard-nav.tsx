"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"
import {
  Calendar,
  type LucideIcon,
  MapPin,
  MessageSquare,
  Settings,
  Truck,
  TrendingUp,
  Inbox,
  Eye,
} from "lucide-react"

type NavItem =
  | { type: "link"; href: string; label: string; icon: LucideIcon; disabled?: false }
  | { type: "disabled"; href: string; label: string; icon: LucideIcon; soon?: boolean }

const VENDOR_NAV: NavItem[] = [
  { type: "link", href: "/dashboard", label: "Overview", icon: TrendingUp },
  { type: "link", href: "/dashboard#vendor-booking-requests", label: "Booking Requests", icon: Inbox },
  { type: "link", href: "/dashboard/schedule", label: "Schedule", icon: Calendar },
  { type: "link", href: "/dashboard/profile", label: "Truck Profile", icon: Truck },
  { type: "link", href: "/dashboard/events", label: "Events", icon: MapPin },
  { type: "disabled", href: "#", label: "Analytics", icon: Eye, soon: true },
  { type: "disabled", href: "#", label: "Messages", icon: MessageSquare, soon: true },
  { type: "link", href: "/dashboard/settings", label: "Settings", icon: Settings },
]

function pathBase(href: string) {
  const i = href.indexOf("#")
  return i === -1 ? href : href.slice(0, i)
}

function isActiveForPathname(pathname: string | null, itemHref: string) {
  if (!pathname) return false
  if (itemHref === "/dashboard" || itemHref === "/dashboard/") {
    return pathname === "/dashboard" || pathname === "/dashboard/"
  }
  if (itemHref.includes("#")) return false
  const base = pathBase(itemHref)
  return pathname === base || pathname.startsWith(base + "/")
}

export function VendorNavLinks({ onNavigate, className }: { onNavigate?: () => void; className?: string }) {
  const pathname = usePathname()

  return (
    <nav className={cn("space-y-2", className)}>
      {VENDOR_NAV.map((item) => {
        if (item.type === "disabled") {
          return (
            <div
              key={item.label}
              className="flex items-center gap-3 px-3 py-2 rounded-lg opacity-50 cursor-not-allowed pointer-events-none text-muted-foreground"
            >
              <item.icon className="h-5 w-5 shrink-0" />
              <span className="flex items-center gap-2 min-w-0">
                {item.label}
                {item.soon && (
                  <Badge
                    variant="secondary"
                    className="text-[10px] px-1.5 py-0 font-normal shrink-0 bg-muted text-muted-foreground border-0"
                  >
                    Soon
                  </Badge>
                )}
              </span>
            </div>
          )
        }
        const active = isActiveForPathname(pathname, item.href)
        return (
          <Link
            key={item.href + item.label}
            href={item.href}
            onClick={onNavigate}
            className={cn(
              "flex items-center gap-3 px-3 py-2 rounded-lg transition-colors",
              active
                ? "bg-primary/10 text-primary font-medium"
                : "text-muted-foreground hover:bg-muted hover:text-foreground"
            )}
          >
            <item.icon className="h-5 w-5 shrink-0" />
            {item.label}
          </Link>
        )
      })}
    </nav>
  )
}

export { VENDOR_NAV }
