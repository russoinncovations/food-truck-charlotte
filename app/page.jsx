// app/page.jsx — your main homepage
// This replaces your existing homepage with the redesigned hero.
// The HeroSection component handles all state + layout.

import HeroSection from "@/components/HeroSection";

export const metadata = {
  title: "Food Truck Charlotte — Find, Book & Discover Charlotte Food Trucks",
  description:
    "Charlotte's local food truck guide, built from a 35,000-member community. Browse trucks by cuisine, discover local events, and send booking inquiries — free.",
};

export default function HomePage() {
  return <HeroSection />;
}
