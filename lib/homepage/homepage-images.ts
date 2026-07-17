/**
 * Homepage visual asset paths.
 * Event-type tiles use dedicated event-setting photos (people + place), not food close-ups.
 */
export const HOMEPAGE_IMAGES = {
  /** Full-bleed hero — community gathering with Charlotte skyline. */
  hero: "/images/event-festival.jpg",
  /** Optional food-forward hero alternate. */
  heroFoodAlternate: "/images/hero-truck.jpg",
  /** Event-scene photos for homepage use-case tiles. */
  useCases: {
    corporate: "/images/homepage/use-corporate.jpg",
    schools: "/images/homepage/use-schools.jpg",
    neighborhoods: "/images/homepage/use-neighborhoods.jpg",
    breweries: "/images/homepage/use-breweries.jpg",
    privateParties: "/images/homepage/use-private.jpg",
    communityEvents: "/images/homepage/use-community.jpg",
  },
  /** object-position hints so event context stays visible in card crops. */
  useCaseObjectPosition: {
    corporate: "object-center",
    schools: "object-[center_45%]",
    neighborhoods: "object-center",
    breweries: "object-center",
    privateParties: "object-center",
    communityEvents: "object-center",
  },
} as const

export type HomepageUseCaseKey = keyof typeof HOMEPAGE_IMAGES.useCases

export function homepageUseCaseImage(key: HomepageUseCaseKey): string {
  return HOMEPAGE_IMAGES.useCases[key]
}

export function homepageUseCaseObjectPosition(key: HomepageUseCaseKey): string {
  return HOMEPAGE_IMAGES.useCaseObjectPosition[key]
}
