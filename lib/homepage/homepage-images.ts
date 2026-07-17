/**
 * Homepage visual asset paths — swap these when real community photos are ready.
 * All paths are local under /public. Do not point at Unsplash or external CDNs here.
 *
 * Suggested drop-in replacements (create files when available):
 * - /public/images/homepage/hero-community.jpg
 * - /public/images/homepage/use-corporate.jpg
 * - /public/images/homepage/use-schools.jpg
 * - /public/images/homepage/use-neighborhoods.jpg
 * - /public/images/homepage/use-breweries.jpg
 * - /public/images/homepage/use-private.jpg
 * - /public/images/homepage/use-community.jpg
 */
export const HOMEPAGE_IMAGES = {
  /** Full-bleed hero — community gathering with Charlotte skyline. */
  hero: "/images/event-festival.jpg",
  /** Optional alternate food-forward hero if you prefer plating over crowd. */
  heroFoodAlternate: "/images/hero-truck.jpg",
  useCases: {
    corporate: "/images/truck-wings.jpg",
    schools: "/images/truck-tacos.jpg",
    neighborhoods: "/images/hero-truck.jpg",
    breweries: "/images/truck-bbq.jpg",
    privateParties: "/images/truck-desserts.jpg",
    communityEvents: "/images/event-festival.jpg",
  },
} as const
