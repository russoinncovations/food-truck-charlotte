import type { LucideIcon } from "lucide-react"
import {
  Calculator,
  CreditCard,
  Flame,
  MapPinned,
  Package,
  Paintbrush,
  Shield,
  Snowflake,
  Store,
  Truck,
  UtensilsCrossed,
  Wrench,
} from "lucide-react"

export type ResourcePartnerBadge =
  | "Founding Resource Partner"
  | "Featured Resource Partner"
  | "Category Sponsor"

/** Shape for future live partner listings. */
export type ResourcePartnerListing = {
  businessName: string
  category: string
  shortDescription: string
  serviceArea?: string | null
  bestFor?: string | null
  website?: string | null
  phone?: string | null
  email?: string | null
  logoUrl?: string | null
  photoUrl?: string | null
  badge?: ResourcePartnerBadge | null
}

export type ResourceCategory = {
  id: string
  title: string
  description: string
  icon: LucideIcon
}

export const RESOURCE_GUIDE_INQUIRY_MAILTO =
  "mailto:evolvebtc@gmail.com?subject=FoodTruckCLT%20Resource%20Guide%20Interest"

export const RESOURCE_CATEGORIES: ResourceCategory[] = [
  {
    id: "commissary",
    title: "Commissary Kitchens",
    description: "Licensed prep and storage space for mobile food operations.",
    icon: UtensilsCrossed,
  },
  {
    id: "builders",
    title: "Truck & Trailer Builders",
    description: "Custom builds, conversions, and mobile kitchen fabrication.",
    icon: Truck,
  },
  {
    id: "repair",
    title: "Truck Repair & Maintenance",
    description: "Mechanical service, brakes, tires, and fleet upkeep.",
    icon: Wrench,
  },
  {
    id: "generator",
    title: "Generator / Refrigeration Repair",
    description: "Power systems, cold storage, and equipment specialists.",
    icon: Snowflake,
  },
  {
    id: "hood",
    title: "Hood Cleaning",
    description: "Exhaust, hood, and grease-system cleaning for compliance.",
    icon: Flame,
  },
  {
    id: "fire",
    title: "Fire Suppression",
    description: "Inspection, service, and suppression system support.",
    icon: Shield,
  },
  {
    id: "insurance",
    title: "Insurance",
    description: "Coverage tailored to food trucks and mobile vendors.",
    icon: Shield,
  },
  {
    id: "wraps",
    title: "Wraps / Signage / Branding",
    description: "Vehicle wraps, menus, and on-truck visual identity.",
    icon: Paintbrush,
  },
  {
    id: "bookkeeping",
    title: "Bookkeeping / Tax Support",
    description: "Accounting help for owner-operators and small fleets.",
    icon: Calculator,
  },
  {
    id: "pos",
    title: "POS / Payment Systems",
    description: "Point-of-sale, mobile payments, and tipping tools.",
    icon: CreditCard,
  },
  {
    id: "suppliers",
    title: "Food & Packaging Suppliers",
    description: "Ingredients, disposables, and vendor-ready packaging.",
    icon: Package,
  },
  {
    id: "venues",
    title: "Truck-Friendly Venues & Spaces",
    description: "Lots, breweries, and hosts that welcome mobile food.",
    icon: MapPinned,
  },
  {
    id: "other",
    title: "Other Vendor Services",
    description: "Additional local help that keeps trucks on the road.",
    icon: Store,
  },
]

/** Live listings — empty for MVP; populate when a resources table exists. */
export const RESOURCE_PARTNER_LISTINGS: ResourcePartnerListing[] = []
