import type { TruckEvent } from "@/lib/types";

export const events: TruckEvent[] = [
  {
    id: "noda-friday-bites",
    title: "NoDa Friday Bites",
    date: "April 12, 2026",
    location: "North Davidson St, Charlotte",
    featuredTruckSlugs: ["queen-city-tacos", "clt-wing-lab"],
    description:
      "A neighborhood food truck night with live music, local vendors, and rotating family activities.",
    featured: true,
  },
  {
    id: "south-end-sunday-social",
    title: "South End Sunday Social",
    date: "April 20, 2026",
    location: "Camden Rd, Charlotte",
    featuredTruckSlugs: ["carolina-smash-co", "morning-bell-coffee"],
    description:
      "Community hangout featuring brunch-friendly trucks, art pop-ups, and patio seating.",
    featured: true,
  },
  {
    id: "ballantyne-bbq-block-party",
    title: "Ballantyne BBQ Block Party",
    date: "May 3, 2026",
    location: "Community House Rd, Charlotte",
    featuredTruckSlugs: ["smoke-ring-charlotte", "uptown-soul-kitchen"],
    description:
      "An evening block party focused on smoked favorites, family games, and local performers.",
  },
  {
    id: "plaza-midwood-dessert-night",
    title: "Plaza Midwood Dessert Night",
    date: "May 10, 2026",
    location: "Central Ave, Charlotte",
    featuredTruckSlugs: ["sweet-route-desserts", "morning-bell-coffee"],
    description:
      "Sweet treats, coffee pairings, and a lively local crowd in one of Charlotte’s favorite neighborhoods.",
  },
  {
    id: "east-charlotte-community-cookout",
    title: "East Charlotte Community Cookout",
    date: "May 24, 2026",
    location: "Albemarle Rd, Charlotte",
    featuredTruckSlugs: ["island-lane-eats", "queen-city-tacos"],
    description:
      "A community-centered cookout with diverse flavors, youth activities, and local nonprofit partners.",
  },
];
